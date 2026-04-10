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
 * | **planner** | gpt-5.4 → claude-opus-4-6 → k2p5 → gemini-3.1-pro |
 * | **oracle** | gpt-5.4 → kimi-k2.5 → gemini-3.1-pro → claude-opus-4-6 → big-pickle (free) |
 * | **librarian** | gemini-3-flash → glm-4.7 → claude-sonnet-4-5 → minimax → big-pickle → glm-4.7-free |
 * | **explore** | grok-code-fast-1 (copilot) → gpt-5.4-mini → claude-haiku-4-5 → minimax-m2.5-free (free) → gpt-5-nano (free) |
 * | **multimodal-looker** | gpt-5.4 → k2p5 → gemini-3-flash → glm-4.6v → gpt-5-nano |
 * | **plan-consultant** | claude-opus-4-6 → k2p5 → gpt-5.4 → gemini-3.1-pro |
 * | **plan-reviewer** | gpt-5.4 → kimi-k2.5 → claude-opus-4-6 → gemini-3.1-pro → big-pickle (free) |
 * | **orchestrator** | k2p5 → claude-sonnet-4-6 → claude-sonnet-4-5 → gpt-5.4 → gemini-3.1-pro |
 * | **coder-junior** | claude-sonnet-4-6 → gpt-5.3-codex → gemini-3-flash (runtime only) |
 * 
 * ## Category Model Chains
 * 
 * | Category | Unified Chain |
 * |----------|---------------|
 * | **visual-engineering** | gemini-3.1-pro → glm-5 → claude-opus-4-6 → k2p5 |
 * | **ultrabrain** | gpt-5.4 → gemini-3.1-pro → claude-opus-4-6 → kimi-k2.5 → big-pickle (free) |
 * | **deep** | gpt-5.4 → claude-opus-4-6 → gemini-3.1-pro → kimi-k2.5 → big-pickle (free) |
 * | **artistry** | gemini-3.1-pro → claude-opus-4-6 → gpt-5.4 → kimi-k2.5 → minimax-m2.5-free (free) |
 * | **quick** | gpt-5.4-mini → claude-haiku-4-5 → gemini-3-flash → gpt-5-nano (free) |
 * | **unspecified-low** | gpt-5.3-codex → claude-sonnet-4-6 → kimi-k2.5 → gemini-3-flash → minimax-m2.5-free (free) |
 * | **unspecified-high** | gpt-5.3-codex → claude-opus-4-6 → glm-5 → k2p5 → kimi-k2.5 |
 * | **writing** | gemini-3-flash → k2p5 → claude-sonnet-4-6 |
 * 
 * ## Special Cases
 * 
 * - **ZAI Override**: librarian uses zai-coding-plan/glm-4.7 when ZAI provider available
 * - **OpenAI-Only Mode**: Several agents/categories get OpenAI-specific fast-model overrides
 * - **Provider-Only Paid Reroutes**: Kimi-only, Gemini-only, and Claude-only installs avoid free fallbacks for a minimal set of roles
 * - **Custom Resolver**: explore agent uses custom logic (not chain-based)
 * 
 * ## Intentional Behavior Changes
 * 
 * The following changed from install-time defaults after unification:
 * - **librarian**: Now uses gemini-3-flash first (was glm-4.7)
 * - **orchestrator**: Now uses k2p5 first (was claude-sonnet-4-6)
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
    kimiOnlyOverride?: { model: string; variant?: string };
    geminiOnlyOverride?: { model: string; variant?: string };
    claudeOnlyOverride?: { model: string; variant?: string };
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
    specialCases: {
      geminiOnlyOverride: { model: "google/gemini-3.1-pro-preview" },
    },
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
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" },
      { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
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
    specialCases: {
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  librarian: {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4-mini", variant: "low" },
      { providers: ["opencode"], model: "glm-4.7" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-5" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
      { providers: ["opencode"], model: "big-pickle", alwaysAvailable: true },
      { providers: ["opencode"], model: "glm-4.7-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: {
      zaiOverride: { model: "zai-coding-plan/glm-4.7" },
      openAiOnlyOverride: { model: "openai/gpt-5.4-mini", variant: "low" },
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  explore: {
    chain: [
      { providers: ["github-copilot"], model: "grok-code-fast-1" },
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4-mini", variant: "low" },
      { providers: ["anthropic", "opencode"], model: "claude-haiku-4-5" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
      { providers: ["opencode"], model: "gpt-5-nano", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: {
      customResolver: "explore-agent",
      openAiOnlyOverride: { model: "openai/gpt-5.4-nano", variant: "low" },
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
      geminiOnlyOverride: { model: "google/gemini-3-flash-preview" },
    },
  },
  "multimodal-looker": {
    chain: [{ providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }, { providers: ["zai-coding-plan"], model: "glm-4.6v" }, { providers: OPENAI_PROVIDERS, model: "gpt-5-nano" }],
    includeInInstall: true,
    specialCases: {
      claudeOnlyOverride: { model: "anthropic/claude-sonnet-4-6" },
    },
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
    specialCases: {
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  orchestrator: {
    chain: [{ providers: ["kimi-for-coding"], model: "k2p5" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-5" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro" }],
    includeInInstall: true,
  },
  "coder-junior": {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.3-codex", variant: "medium" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }],
    includeInInstall: false,
  },
  researcher: {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro" },
      { providers: ["kimi-for-coding"], model: "k2p5" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6", variant: "medium" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "medium" },
      { providers: ["opencode"], model: "glm-4.7-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
  },
  "researcher-junior": {
    chain: [
      { providers: ["kimi-for-coding"], model: "k2p5" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6", variant: "medium" },
      { providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "low" },
      { providers: ["opencode"], model: "glm-4.7-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: {
      openAiOnlyOverride: { model: "openai/gpt-5.4-mini", variant: "low" },
      geminiOnlyOverride: { model: "google/gemini-3-flash-preview" },
    },
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
    specialCases: {
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
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
    specialCases: {
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
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
    specialCases: {
      openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "xhigh" },
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  quick: {
    chain: [
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4-mini", variant: "low" },
      { providers: CLAUDE_PROVIDERS, model: "claude-haiku-4-5" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "gpt-5-nano", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: {
      openAiOnlyOverride: { model: "openai/gpt-5.4-mini", variant: "low" },
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  "unspecified-low": {
    chain: [
      { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.3-codex", variant: "medium" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" },
      { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" },
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "minimax-m2.5-free", alwaysAvailable: true },
    ],
    includeInInstall: true,
    specialCases: {
      openAiOnlyOverride: { model: "openai/gpt-5.4-mini", variant: "medium" },
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  "unspecified-high": {
    chain: [{ providers: OPENAI_PROVIDERS, model: "gpt-5.3-codex", variant: "high" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: ["zai-coding-plan", "opencode"], model: "glm-5" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: KIMI_K25_PROVIDERS, model: "kimi-k2.5" }],
    includeInInstall: true,
    specialCases: {
      kimiOnlyOverride: { model: "kimi-for-coding/k2p5" },
    },
  },
  writing: {
    chain: [{ providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }, { providers: ["kimi-for-coding"], model: "k2p5" }, { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "medium" } },
  },
};
