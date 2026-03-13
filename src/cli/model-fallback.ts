import type { InstallConfig } from "./types"

import type { GeneratedOmoConfig } from "./model-fallback-types"
import { applyOpenAiOnlyModelCatalog, isOpenAiOnlyAvailability } from "./openai-only-model-catalog"
import { computeDefaultsFromProviders, toComputedProviderAvailability } from "../shared/computed-install-defaults"
import { toInstallDefaultsProviders } from "./provider-availability"

export type { GeneratedOmoConfig } from "./model-fallback-types"

const SCHEMA_URL = "https://raw.githubusercontent.com/AndreDalwin/DrizzyAgent/dev/assets/drizzy-agent.schema.json"



export function generateModelConfig(config: InstallConfig): GeneratedOmoConfig {
  const providers = toInstallDefaultsProviders(config)
  const availability = toComputedProviderAvailability(providers, { isMaxPlan: config.isMax20 })
  const { agents, categories } = computeDefaultsFromProviders(providers, { isMaxPlan: config.isMax20 })

  const generatedConfig: GeneratedOmoConfig = {
    $schema: SCHEMA_URL,
    agents,
    categories,
  }

  return isOpenAiOnlyAvailability(availability)
    ? applyOpenAiOnlyModelCatalog(generatedConfig)
    : generatedConfig
}

export function shouldShowChatGPTOnlyWarning(config: InstallConfig): boolean {
  return !config.hasClaude && !config.hasGemini && config.hasOpenAI
}
