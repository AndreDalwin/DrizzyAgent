export type FallbackEntry = {
  providers: string[];
  model: string;
  variant?: string;
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
      { providers: ["opencode"], model: "big-pickle" },
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
    chain: [{ providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "high" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }],
    includeInInstall: true,
  },
  librarian: {
    chain: [
      { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" },
      { providers: ["opencode"], model: "glm-4.7" },
      { providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-5" },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["opencode"], model: "big-pickle" },
      { providers: ["opencode"], model: "glm-4.7-free" },
    ],
    includeInInstall: true,
    specialCases: { zaiOverride: { model: "zai-coding-plan/glm-4.7" }, openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "medium" } },
  },
  explore: {
    chain: [
      { providers: ["github-copilot"], model: "grok-code-fast-1" },
      { providers: ["opencode"], model: "minimax-m2.5-free" },
      { providers: ["anthropic", "opencode"], model: "claude-haiku-4-5" },
      { providers: ["opencode"], model: "gpt-5-nano" },
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
    chain: [{ providers: OPENAI_PROVIDERS, model: "gpt-5.4", variant: "xhigh" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }],
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
    chain: [{ providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "xhigh" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }],
    includeInInstall: true,
  },
  deep: {
    chain: [{ providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }],
    includeInInstall: true,
  },
  artistry: {
    chain: [{ providers: GEMINI_PROVIDERS, model: "gemini-3.1-pro", variant: "high" }, { providers: CLAUDE_PROVIDERS, model: "claude-opus-4-6", variant: "max" }, { providers: OPENAI_PROVIDERS, model: "gpt-5.4" }],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "xhigh" } },
  },
  quick: {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-haiku-4-5" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }, { providers: ["opencode"], model: "gpt-5-nano" }],
    includeInInstall: true,
    specialCases: { openAiOnlyOverride: { model: "openai/gpt-5.4", variant: "low" } },
  },
  "unspecified-low": {
    chain: [{ providers: CLAUDE_PROVIDERS, model: "claude-sonnet-4-6" }, { providers: OPENAI_NATIVE_PROVIDERS, model: "gpt-5.4", variant: "medium" }, { providers: GEMINI_PROVIDERS, model: "gemini-3-flash" }],
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
