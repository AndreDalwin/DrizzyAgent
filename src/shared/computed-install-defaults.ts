import {
  getCoderFallbackChain,
  isAnyFallbackEntryAvailable,
  isRequiredModelAvailable,
  isRequiredProviderAvailable,
  resolveModelFromChain,
} from "../cli/fallback-chain-resolution"
import {
  CLI_AGENT_MODEL_REQUIREMENTS,
  CLI_CATEGORY_MODEL_REQUIREMENTS,
} from "../cli/model-fallback-requirements"
import type {
  AgentConfig,
  CategoryConfig,
  ProviderAvailability,
} from "../cli/model-fallback-types"
import type { InstallDefaultsProviders } from "./install-defaults-contract"
import type { ModelRequirement } from "./model-requirements"

const ZAI_MODEL = "zai-coding-plan/glm-4.7"
const ULTIMATE_FALLBACK = "opencode/glm-4.7-free"

export interface ComputedInstallDefaults {
  agents: Record<string, AgentConfig>
  categories: Record<string, CategoryConfig>
}

type ComputedInstallDefaultsOptions = {
  isMaxPlan?: boolean
}

export function toComputedProviderAvailability(
  providers: InstallDefaultsProviders,
  options?: ComputedInstallDefaultsOptions,
): ProviderAvailability {
  return {
    native: {
      claude: providers.claude !== "no",
      openai: providers.openai,
      gemini: providers.gemini,
    },
    opencodeZen: providers.opencode_zen,
    copilot: providers.copilot,
    zai: providers.zai_coding_plan,
    kimiForCoding: providers.kimi_for_coding,
    isMaxPlan: options?.isMaxPlan ?? providers.claude === "max20",
  }
}

export function computeDefaultsFromProviders(
  providers: InstallDefaultsProviders,
  options?: ComputedInstallDefaultsOptions,
): ComputedInstallDefaults {
  const availability = toComputedProviderAvailability(providers, options)

  if (!hasAnyProvider(availability)) {
    return {
      agents: Object.fromEntries(
        Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)
          .filter(([role, requirement]) => !(role === "coder" && requirement.requiresAnyModel))
          .map(([role]) => [role, { model: ULTIMATE_FALLBACK }]),
      ),
      categories: Object.fromEntries(
        Object.keys(CLI_CATEGORY_MODEL_REQUIREMENTS).map((category) => [category, { model: ULTIMATE_FALLBACK }]),
      ),
    }
  }

  const agents: Record<string, AgentConfig> = {}
  const categories: Record<string, CategoryConfig> = {}

  for (const [role, requirement] of Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)) {
    if (role === "librarian" && availability.zai) {
      agents[role] = { model: ZAI_MODEL }
      continue
    }

    if (role === "explore") {
      agents[role] = resolveExploreAgent(availability)
      continue
    }

    if (role === "coder") {
      const fallbackChain = getCoderFallbackChain()
      if (requirement.requiresAnyModel && !isAnyFallbackEntryAvailable(fallbackChain, availability)) {
        continue
      }

      const resolvedCoder = resolveModelFromChain(fallbackChain, availability)
      if (resolvedCoder) {
        agents[role] = withVariant(resolvedCoder.model, resolvedCoder.variant ?? requirement.variant)
      }
      continue
    }

    const resolved = resolveRequirementDefault(requirement, availability)
    if (resolved) {
      agents[role] = resolved
    }
  }

  for (const [category, requirement] of Object.entries(CLI_CATEGORY_MODEL_REQUIREMENTS)) {
    const fallbackChain =
      category === "unspecified-high" && !availability.isMaxPlan
        ? CLI_CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
        : requirement.fallbackChain

    const resolved = resolveRequirementDefault(requirement, availability, fallbackChain)
    if (resolved) {
      categories[category] = resolved
    }
  }

  return { agents, categories }
}

function hasAnyProvider(availability: ProviderAvailability): boolean {
  return (
    availability.native.claude ||
    availability.native.openai ||
    availability.native.gemini ||
    availability.opencodeZen ||
    availability.copilot ||
    availability.zai ||
    availability.kimiForCoding
  )
}

function resolveExploreAgent(availability: ProviderAvailability): AgentConfig {
  if (availability.native.claude) {
    return { model: "anthropic/claude-haiku-4-5" }
  }

  if (availability.opencodeZen) {
    return { model: "opencode/claude-haiku-4-5" }
  }

  if (availability.copilot) {
    return { model: "github-copilot/gpt-5-mini" }
  }

  return { model: "opencode/gpt-5-nano" }
}

function resolveRequirementDefault(
  requirement: ModelRequirement,
  availability: ProviderAvailability,
  fallbackChain = requirement.fallbackChain,
): AgentConfig | CategoryConfig | undefined {
  if (requirement.requiresModel && !isRequiredModelAvailable(requirement.requiresModel, requirement.fallbackChain, availability)) {
    return undefined
  }

  if (requirement.requiresProvider && !isRequiredProviderAvailable(requirement.requiresProvider, availability)) {
    return undefined
  }

  const resolved = resolveModelFromChain(fallbackChain, availability)
  if (!resolved) {
    return { model: ULTIMATE_FALLBACK }
  }

  return withVariant(resolved.model, resolved.variant ?? requirement.variant)
}

function withVariant(model: string, variant?: string): AgentConfig | CategoryConfig {
  return variant ? { model, variant } : { model }
}
