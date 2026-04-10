import {
  getCoderFallbackChain,
  isRequiredModelAvailable,
  isRequiredProviderAvailable,
  resolveModelFromChain,
} from "../cli/fallback-chain-resolution"
import { isProviderAvailable } from "../cli/provider-availability"
import {
  CLI_AGENT_MODEL_REQUIREMENTS,
  CLI_CATEGORY_MODEL_REQUIREMENTS,
} from "../cli/model-fallback-requirements"
import type {
  AgentConfig,
  CategoryConfig,
  ProviderAvailability,
} from "../cli/model-fallback-types"
import {
  AGENT_MODEL_DEFAULTS,
  CATEGORY_MODEL_DEFAULTS,
} from "./agent-model-defaults"
import type { InstallDefaultsProviders } from "./install-defaults-contract"
import type { ModelRequirement } from "./model-requirements"

const ZAI_MODEL = AGENT_MODEL_DEFAULTS.librarian.specialCases?.zaiOverride?.model ?? "zai-coding-plan/glm-4.7"
const GLOBAL_ULTIMATE_FALLBACK = getFallbackModelFromChain(AGENT_MODEL_DEFAULTS.librarian.chain) ?? "opencode/glm-4.7-free"

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

  // Check if we have any usable fallback entries (either via providers or alwaysAvailable)
  const hasAnyUsableFallback = (chain?: ModelRequirement["fallbackChain"]) =>
    chain?.some((entry) => entry.alwaysAvailable || entry.providers.some((p) => isProviderAvailable(p, availability)))

  // Even with no providers, alwaysAvailable entries can be used
  const canUseCoder = !CLI_AGENT_MODEL_REQUIREMENTS.coder.requiresAnyModel ||
    hasAnyUsableFallback(getCoderFallbackChain())

  const agents: Record<string, AgentConfig> = {}
  const categories: Record<string, CategoryConfig> = {}

  for (const [role, requirement] of Object.entries(CLI_AGENT_MODEL_REQUIREMENTS)) {
    if (role === "librarian" && availability.zai && AGENT_MODEL_DEFAULTS.librarian.specialCases?.zaiOverride) {
      agents[role] = { model: ZAI_MODEL }
      continue
    }

    if (role === "explore" && AGENT_MODEL_DEFAULTS.explore.specialCases?.customResolver === "explore-agent") {
      agents[role] = resolveExploreAgent(availability)
      continue
    }

    if (role === "coder") {
      const fallbackChain = getCoderFallbackChain()
      // Check if coder can be used (requiresAnyModel only if no usable fallbacks)
      if (requirement.requiresAnyModel && !canUseCoder) {
        continue
      }

      const resolvedCoder = resolveModelFromChain(fallbackChain, availability)
      if (resolvedCoder) {
        agents[role] = withVariant(resolvedCoder.model, resolvedCoder.variant ?? requirement.variant)
      }
      continue
    }

    const resolved = resolveRequirementDefault(
      requirement,
      availability,
      requirement.fallbackChain,
      getUltimateFallback(role),
    )
    if (resolved) {
      agents[role] = resolved
    }
  }

  for (const [category, requirement] of Object.entries(CLI_CATEGORY_MODEL_REQUIREMENTS)) {
    const fallbackChain =
      category === "unspecified-high" && !availability.isMaxPlan
        ? CLI_CATEGORY_MODEL_REQUIREMENTS["unspecified-low"].fallbackChain
        : requirement.fallbackChain

    const resolved = resolveRequirementDefault(
      requirement,
      availability,
      fallbackChain,
      getCategoryUltimateFallback(category),
    )
    if (resolved) {
      categories[category] = resolved
    }
  }

  return { agents, categories }
}

function resolveExploreAgent(availability: ProviderAvailability): AgentConfig {
  if (availability.native.openai) {
    return { model: "openai/gpt-5.4-nano", variant: "low" }
  }

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
  ultimateFallback = GLOBAL_ULTIMATE_FALLBACK,
): AgentConfig | CategoryConfig | undefined {
  if (requirement.requiresModel && !isRequiredModelAvailable(requirement.requiresModel, requirement.fallbackChain, availability)) {
    return undefined
  }

  if (requirement.requiresProvider && !isRequiredProviderAvailable(requirement.requiresProvider, availability)) {
    return undefined
  }

  const resolved = resolveModelFromChain(fallbackChain, availability)
  if (!resolved) {
    return { model: ultimateFallback }
  }

  return withVariant(resolved.model, resolved.variant ?? requirement.variant)
}

function getUltimateFallback(agentName: string): string {
  return getFallbackModelFromChain(AGENT_MODEL_DEFAULTS[agentName]?.chain) ?? GLOBAL_ULTIMATE_FALLBACK
}

function getCategoryUltimateFallback(categoryName: string): string {
  return getFallbackModelFromChain(CATEGORY_MODEL_DEFAULTS[categoryName]?.chain) ?? GLOBAL_ULTIMATE_FALLBACK
}

function getFallbackModelFromChain(fallbackChain?: ModelRequirement["fallbackChain"]): string | undefined {
  const lastEntry = fallbackChain?.[fallbackChain.length - 1]
  const provider = lastEntry?.providers[0]

  if (!provider) {
    return undefined
  }

  return `${provider}/${lastEntry.model}`
}

function withVariant(model: string, variant?: string): AgentConfig | CategoryConfig {
  return variant ? { model, variant } : { model }
}
