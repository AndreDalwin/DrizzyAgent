import { AGENT_MODEL_DEFAULTS, CATEGORY_MODEL_DEFAULTS } from "../shared/agent-model-defaults"
import type { AgentConfig, CategoryConfig, GeneratedOmoConfig, ProviderAvailability } from "./model-fallback-types"

type SpecialCaseOverrideKey =
  | "openAiOnlyOverride"
  | "kimiOnlyOverride"
  | "geminiOnlyOverride"
  | "claudeOnlyOverride"

const OPENAI_ONLY_AGENT_OVERRIDES: Record<string, AgentConfig> = Object.fromEntries(
  collectAgentOverrides("openAiOnlyOverride"),
)

const OPENAI_ONLY_CATEGORY_OVERRIDES: Record<string, CategoryConfig> = Object.fromEntries(
  collectCategoryOverrides("openAiOnlyOverride"),
)

const KIMI_ONLY_AGENT_OVERRIDES: Record<string, AgentConfig> = Object.fromEntries(
  collectAgentOverrides("kimiOnlyOverride"),
)

const KIMI_ONLY_CATEGORY_OVERRIDES: Record<string, CategoryConfig> = Object.fromEntries(
  collectCategoryOverrides("kimiOnlyOverride"),
)

const GEMINI_ONLY_AGENT_OVERRIDES: Record<string, AgentConfig> = Object.fromEntries(
  collectAgentOverrides("geminiOnlyOverride"),
)

const GEMINI_ONLY_CATEGORY_OVERRIDES: Record<string, CategoryConfig> = Object.fromEntries(
  collectCategoryOverrides("geminiOnlyOverride"),
)

const CLAUDE_ONLY_AGENT_OVERRIDES: Record<string, AgentConfig> = Object.fromEntries(
  collectAgentOverrides("claudeOnlyOverride"),
)

const CLAUDE_ONLY_CATEGORY_OVERRIDES: Record<string, CategoryConfig> = Object.fromEntries(
  collectCategoryOverrides("claudeOnlyOverride"),
)

export function isOpenAiOnlyAvailability(availability: ProviderAvailability): boolean {
  return (
    availability.native.openai &&
    !availability.native.claude &&
    !availability.native.gemini &&
    !availability.opencodeZen &&
    !availability.copilot &&
    !availability.zai &&
    !availability.kimiForCoding
  )
}

export function applyOpenAiOnlyModelCatalog(config: GeneratedOmoConfig): GeneratedOmoConfig {
  return applyOverrideCatalog(config, OPENAI_ONLY_AGENT_OVERRIDES, OPENAI_ONLY_CATEGORY_OVERRIDES)
}

export function isKimiOnlyAvailability(availability: ProviderAvailability): boolean {
  return (
    availability.kimiForCoding &&
    !availability.native.claude &&
    !availability.native.openai &&
    !availability.native.gemini &&
    !availability.opencodeZen &&
    !availability.copilot &&
    !availability.zai
  )
}

export function isGeminiOnlyAvailability(availability: ProviderAvailability): boolean {
  return (
    availability.native.gemini &&
    !availability.native.claude &&
    !availability.native.openai &&
    !availability.opencodeZen &&
    !availability.copilot &&
    !availability.zai &&
    !availability.kimiForCoding
  )
}

export function isClaudeOnlyAvailability(availability: ProviderAvailability): boolean {
  return (
    availability.native.claude &&
    !availability.native.openai &&
    !availability.native.gemini &&
    !availability.opencodeZen &&
    !availability.copilot &&
    !availability.zai &&
    !availability.kimiForCoding
  )
}

export function applyProviderSpecificModelCatalog(
  config: GeneratedOmoConfig,
  availability: ProviderAvailability,
): GeneratedOmoConfig {
  if (isOpenAiOnlyAvailability(availability)) {
    return applyOpenAiOnlyModelCatalog(config)
  }

  if (isKimiOnlyAvailability(availability)) {
    return applyOverrideCatalog(config, KIMI_ONLY_AGENT_OVERRIDES, KIMI_ONLY_CATEGORY_OVERRIDES)
  }

  if (isGeminiOnlyAvailability(availability)) {
    return applyOverrideCatalog(config, GEMINI_ONLY_AGENT_OVERRIDES, GEMINI_ONLY_CATEGORY_OVERRIDES)
  }

  if (isClaudeOnlyAvailability(availability)) {
    return applyOverrideCatalog(config, CLAUDE_ONLY_AGENT_OVERRIDES, CLAUDE_ONLY_CATEGORY_OVERRIDES)
  }

  return config
}

function collectAgentOverrides(key: SpecialCaseOverrideKey): Array<[string, AgentConfig]> {
  return Object.entries(AGENT_MODEL_DEFAULTS)
    .filter(([, def]) => def.specialCases?.[key])
    .map(([name, def]) => {
      const override = def.specialCases![key]!

      return [name, { model: override.model, ...(override.variant ? { variant: override.variant } : {}) }]
    })
}

function collectCategoryOverrides(key: SpecialCaseOverrideKey): Array<[string, CategoryConfig]> {
  return Object.entries(CATEGORY_MODEL_DEFAULTS)
    .filter(([, def]) => def.specialCases?.[key])
    .map(([name, def]) => {
      const override = def.specialCases![key]!

      return [name, { model: override.model, ...(override.variant ? { variant: override.variant } : {}) }]
    })
}

function applyOverrideCatalog(
  config: GeneratedOmoConfig,
  agentOverrides: Record<string, AgentConfig>,
  categoryOverrides: Record<string, CategoryConfig>,
): GeneratedOmoConfig {
  return {
    ...config,
    agents: {
      ...config.agents,
      ...agentOverrides,
    },
    categories: {
      ...config.categories,
      ...categoryOverrides,
    },
  }
}
