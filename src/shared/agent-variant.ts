import type { DrizzyAgentConfig } from "../config"
import { getAgentConfigKey } from "./agent-display-names"
import { AGENT_MODEL_REQUIREMENTS, CATEGORY_MODEL_REQUIREMENTS } from "./model-requirements"
import { getUserMessageVariant, setUserMessageVariant } from "./user-message-variant"

export function resolveAgentVariant(
  config: DrizzyAgentConfig,
  agentName?: string
): string | undefined {
  if (!agentName) {
    return undefined
  }

  const agentConfigKey = getAgentConfigKey(agentName)
  const agentOverrides = config.agents as
    | Record<string, { variant?: string; category?: string }>
    | undefined
  const agentOverride = agentOverrides
    ? agentOverrides[agentConfigKey]
      ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentConfigKey.toLowerCase())?.[1]
    : undefined
  if (!agentOverride) {
    return undefined
  }

  if (agentOverride.variant) {
    return agentOverride.variant
  }

  const categoryName = agentOverride.category
  if (!categoryName) {
    return undefined
  }

  return config.categories?.[categoryName]?.variant
}

export function resolveVariantForModel(
  config: DrizzyAgentConfig,
  agentName: string,
  currentModel: { providerID: string; modelID: string },
): string | undefined {
  const agentConfigKey = getAgentConfigKey(agentName)
  const agentOverrides = config.agents as
    | Record<string, { variant?: string; category?: string }>
    | undefined
  const agentOverride = agentOverrides
    ? agentOverrides[agentConfigKey]
      ?? Object.entries(agentOverrides).find(([key]) => key.toLowerCase() === agentConfigKey.toLowerCase())?.[1]
    : undefined
  if (agentOverride?.variant) {
    return agentOverride.variant
  }

  const agentRequirement = AGENT_MODEL_REQUIREMENTS[agentConfigKey]
  if (agentRequirement) {
    return findVariantInChain(agentRequirement.fallbackChain, currentModel)
  }
  const categoryName = agentOverride?.category
  if (categoryName) {
    const categoryRequirement = CATEGORY_MODEL_REQUIREMENTS[categoryName]
    if (categoryRequirement) {
      return findVariantInChain(categoryRequirement.fallbackChain, currentModel)
    }
  }

  return undefined
}

function findVariantInChain(
  fallbackChain: { providers: string[]; model: string; variant?: string }[],
  currentModel: { providerID: string; modelID: string },
): string | undefined {
  for (const entry of fallbackChain) {
    if (
      entry.providers.includes(currentModel.providerID)
      && entry.model === currentModel.modelID
    ) {
      return entry.variant
    }
  }

  // Some providers expose identical model IDs (e.g. OpenAI models via different providers).
  // If we didn't find an exact provider+model match, fall back to model-only matching.
  for (const entry of fallbackChain) {
    if (entry.model === currentModel.modelID) {
      return entry.variant
    }
  }
  return undefined
}

export function applyAgentVariant(
  config: DrizzyAgentConfig,
  agentName: string | undefined,
  message: Record<string, unknown>
): void {
  const variant = resolveAgentVariant(config, agentName)
  if (variant !== undefined && getUserMessageVariant(message) === undefined) {
    setUserMessageVariant(message, variant)
  }
}
