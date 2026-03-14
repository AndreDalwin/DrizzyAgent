import { AGENT_MODEL_DEFAULTS, CATEGORY_MODEL_DEFAULTS } from "../shared/agent-model-defaults"
import type { AgentConfig, CategoryConfig, GeneratedOmoConfig, ProviderAvailability } from "./model-fallback-types"

const OPENAI_ONLY_AGENT_OVERRIDES: Record<string, AgentConfig> = Object.fromEntries(
  Object.entries(AGENT_MODEL_DEFAULTS)
    .filter(([, def]) => def.specialCases?.openAiOnlyOverride)
    .map(([name, def]) => {
      const override = def.specialCases!.openAiOnlyOverride!

      return [name, { model: override.model, variant: override.variant }]
    }),
)

const OPENAI_ONLY_CATEGORY_OVERRIDES: Record<string, CategoryConfig> = Object.fromEntries(
  Object.entries(CATEGORY_MODEL_DEFAULTS)
    .filter(([, def]) => def.specialCases?.openAiOnlyOverride)
    .map(([name, def]) => {
      const override = def.specialCases!.openAiOnlyOverride!

      return [name, { model: override.model, variant: override.variant }]
    }),
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
  return {
    ...config,
    agents: {
      ...config.agents,
      ...OPENAI_ONLY_AGENT_OVERRIDES,
    },
    categories: {
      ...config.categories,
      ...OPENAI_ONLY_CATEGORY_OVERRIDES,
    },
  }
}
