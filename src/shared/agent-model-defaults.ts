/**
 * Unified Canonical Agent Model Defaults
 * 
 * This file is the SINGLE SOURCE OF TRUTH for agent model fallback chains.
 * Both runtime and install use these unified chains, filtering by provider availability.
 * 
 * ## Design Principles
 * 
 * 1. **One Chain Per Agent**: No more runtime vs install drift. Each agent has exactly
 *    one canonical fallback chain used by both runtime and install.
 * 
 * 2. **Provider-Driven Selection**: Both runtime and install filter the same unified chain
 *    by provider availability from `_install_defaults` provider snapshots.
 * 
 * 3. **Dynamic Model Resolution**: Models are computed at runtime from provider snapshots,
 *    not pinned at install time. If you add a provider later, you automatically get
 *    better models on the next restart.
 * 
 * ## How It Works
 * 
 * Example with coder agent:
 * ```
 * Unified Chain:    [claude-opus-4-6, k2p5, kimi-k2.5, gpt-5.4, glm-5, big-pickle]
 * Provider Snapshot: { kimi: true }  // Only Kimi available
 * Filtered Chain:   [k2p5]           // First available entry
 * Selected Model:   kimi-for-coding/k2p5
 * ```
 * 
 * ## Modifying Chains
 * 
 * To add a new fallback for the coder agent:
 * ```typescript
 * coder: {
 *   chain: [
 *     ...existing entries,
 *     { providers: ["new-provider"], model: "new-model" }
 *   ],
 *   includeInInstall: true
 * }
 * ```
 * 
 * ## Agent Model Chains
 * 
 * | Agent | Unified Chain |
 * |-------|---------------|
 * | **coder** | claude-opus-4-6 → k2p5 → kimi-k2.5 → gpt-5.4 → glm-5 → big-pickle |
 * | **gptcoder** | gpt-5.4 (openai/venice/opencode) → gpt-5.4 (github-copilot) |
 * | **planner** | claude-opus-4-6 → k2p5 → gpt-5.4 → gemini-3.1-pro |
 * | **oracle** | gpt-5.4 → kimi-k2.5 → gemini-3.1-pro → claude-opus-4-6 → big-pickle (free) |
 * | **librarian** | gemini-3-flash → glm-4.7 → claude-sonnet-4-5 → minimax → big-pickle → glm-4.7-free |
 * | **explore** | Custom resolver (Claude → Zen → Copilot → OpenAI) |
 * | **multimodal-looker** | gpt-5.4 → k2p5 → gemini-3-flash → glm-4.6v → gpt-5-nano |
 * | **plan-consultant** | claude-opus-4-6 → k2p5 → gpt-5.4 → gemini-3.1-pro |
 * | **plan-reviewer** | gpt-5.4 → kimi-k2.5 → claude-opus-4-6 → gemini-3.1-pro → big-pickle (free) |
 * | **atlas** | k2p5 → claude-sonnet-4-6 → claude-sonnet-4-5 → gpt-5.4 → gemini-3.1-pro |
 * | **coder-junior** | claude-sonnet-4-6 → gpt-5.4 → gemini-3-flash (runtime only) |
 * 
 * ## Category Model Chains
 * 
 * | Category | Unified Chain |
 * |----------|---------------|
 * | **visual-engineering** | gemini-3.1-pro → glm-5 → claude-opus-4-6 → k2p5 |
 * | **ultrabrain** | gpt-5.4 → gemini-3.1-pro → claude-opus-4-6 → kimi-k2.5 → big-pickle (free) |
 * | **deep** | gpt-5.4 → claude-opus-4-6 → gemini-3.1-pro → kimi-k2.5 → big-pickle (free) |
 * | **artistry** | gemini-3.1-pro → claude-opus-4-6 → gpt-5.4 → kimi-k2.5 → minimax-m2.5-free (free) |
 * | **quick** | claude-haiku-4-5 → gemini-3-flash → gpt-5.1-codex-mini → gpt-5-nano (free) |
 * | **unspecified-low** | claude-sonnet-4-6 → kimi-k2.5 → gpt-5.4 → gemini-3-flash → minimax-m2.5-free (free) |
 * | **unspecified-high** | claude-opus-4-6 → gpt-5.4 → glm-5 → k2p5 → kimi-k2.5 |
 * | **writing** | gemini-3-flash → k2p5 → claude-sonnet-4-6 |
 * 
 * ## Special Cases
 * 
 * - **ZAI Override**: librarian uses zai-coding-plan/glm-4.7 when ZAI provider available
 * - **OpenAI-Only Mode**: Several agents/categories get gpt-5.4 overrides when only OpenAI available
 * - **Custom Resolver**: explore agent uses custom logic (not chain-based)
 * 
 * ## Intentional Behavior Changes
 * 
 * The following changed from install-time defaults after unification:
 * - **librarian**: Now uses gemini-3-flash first (was glm-4.7)
 * - **atlas**: Now uses k2p5 first (was claude-sonnet-4-6)
 * - **gptcoder**: Now allows github-copilot fallback (was OpenAI-only)
 * 
 * These simplifications achieve true single source of truth.
 */
export type FallbackEntry = {
  providers: string[];
  model: string;
  variant?: string;
  /** If true, this model is always available as a last-resort fallback regardless of provider availability */
  alwaysAvailable?: boolean;
};

export type AgentModelDefault = {
  chain: FallbackEntry[];
  includeInInstall: boolean;
  requiresAnyProvider?: string[];
  specialCases?: {
    zaiOverride?: { model: string };
    openAiOnlyOverride?: { model: string; variant?: string };
    customResolver?: "explore-agent";
  };
};

const CLAUDE_PROVIDERS = ["anthropic", "github-copilot", "opencode"];
const OPENAI_PROVIDERS = ["openai", "github-copilot", "opencode"];
const OPENAI_NATIVE_PROVIDERS = ["openai", "opencode"];
const GEMINI_PROVIDERS = ["google", "github-copilot", "opencode"];
const KIMI_K25_PROVIDERS = ["opencode", "moonshotai", "moonshotai-cn", "firmware", "ollama-cloud", "aihubmix"];

export const AGENT_MODEL_DEFAULTS: Record<string, AgentModelDefault> = {
  coder: {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "medium" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: true,
    requiresAnyProvider: [
      "anthropic",
      "github-copilot",
      "opencode",
      "kimi-for-coding",
      "moonshotai",
      "moonshotai-cn",
      "firmware",
      "ollama-cloud",
      "aihubmix",
      "openai",
      "zai-coding-plan",
    ],
  },
  gptcoder: {
    chain: [
      { providers: ["openai", "venice", "opencode"], model: "gpt-5.4", variant: "medium" },
      { providers: ["github-copilot"], model: "gpt-5.4", variant: "medium" },
    ],
    includeInInstall: true,
    requiresAnyProvider: ["openai", "github-copilot", "venice", "opencode"],
  },
  planner: {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro" },
    ],
    includeInInstall: true,
  },
  oracle: {
    chain: [
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  librarian: {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "glm-4.7" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-5" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
      { providers: ["opencode"], model: "glm-4.7-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: { zaiOverride: { model: "zai-coding-plan/glm-4.7" }, openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "medium" } },
  },
  explore: {
    chain: [
      { providers: ["github-copilot"], model: "grok-code-fast-1" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
      { providers: ["anthropic", "opencode"], model: "claude-haiku-4-5" },
      { providers: ["opencode"], model: "gpt-5-nano", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: { customResolver: "explore-agent", openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "medium" } },
  },
  "multimodal-looker": {
    chain: [{ providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }, { providers: ["zai-coding-plan"], model: "glm-4.6v" }, { providers: OPENAI_PROVIDERS, model: "gpt-5-nano" }],
    includeInInstall: true,
  },
  planConsultant: {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }],
    includeInInstall: true,
  },
  planReviewer: {
    chain: [
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "xhigh" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  atlas: {
    chain: [{ providers: ["kimi-for-coding"], model: "k2p5" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-5" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro" }],
    includeInInstall: true,
  },
  "coder-junior": {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }],
    includeInInstall: false,
  },
  researcher: {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "low" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: false,
  },
  "researcher-junior": {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: false,
  },
};

export const CATEGORY_MODEL_DEFAULTS: Record<string, AgentModelDefault> = {
  "visual-engineering": {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: ["zai-coding-plan", "opencode"], model: "glm-5" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
    ],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "high" } },
  },
  ultrabrain: {
    chain: [
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "xhigh" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  deep: {
    chain: [
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  artistry: {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "xhigh" } },
  },
  quick: {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-haiku-4-5" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.1-codex-mini", variant: "low" },
      { providers: ["opencode"], model: "gpt-5-nano", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "low" } },
  },
  "unspecified-low": {
    chain: [
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  "unspecified-high": {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" }, { providers: ["zai-coding-plan", "opencode"], model: "glm-5" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" }],
    includeInInstall: true,
  },
  writing: {
    chain: [{ providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "medium" } },
  },
};
