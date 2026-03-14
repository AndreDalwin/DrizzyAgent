import {
  AGENT_MODEL_DEFAULTS,
  CATEGORY_MODEL_DEFAULTS,
  type FallbackEntry as CanonicalFallbackEntry,
} from "./agent-model-defaults"

export type FallbackEntry = CanonicalFallbackEntry

export type ModelRequirement = {
  fallbackChain: FallbackEntry[]
  variant?: string
  requiresModel?: string
  requiresAnyModel?: boolean
  requiresProvider?: string[]
}

type RequirementOverride = Partial<ModelRequirement>

const LEGACY_AGENT_REQUIREMENT_OVERRIDES = {
  coder: {
    requiresAnyModel: true,
  },
  gptcoder: {
    requiresProvider: AGENT_MODEL_DEFAULTS.gptcoder.requiresAnyProvider,
  },
  atlas: {
    fallbackChain: pickFallbackEntries(AGENT_MODEL_DEFAULTS.atlas.chain, ["claude-sonnet-4-6", "gpt-5.4"]),
  },
} satisfies Partial<Record<string, RequirementOverride>>

const LEGACY_CATEGORY_REQUIREMENT_OVERRIDES = {
  "visual-engineering": {
    fallbackChain: excludeFallbackEntries(CATEGORY_MODEL_DEFAULTS["visual-engineering"].chain, ["k2p5"]),
  },
  deep: {
    requiresModel: "gpt-5.4",
  },
  artistry: {
    requiresModel: "gemini-3.1-pro",
  },
  writing: {
    fallbackChain: excludeFallbackEntries(CATEGORY_MODEL_DEFAULTS.writing.chain, ["k2p5"]),
  },
} satisfies Partial<Record<string, RequirementOverride>>

export const AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = toModelRequirements(
  AGENT_MODEL_DEFAULTS,
  LEGACY_AGENT_REQUIREMENT_OVERRIDES,
)

export const CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> = toModelRequirements(
  CATEGORY_MODEL_DEFAULTS,
  LEGACY_CATEGORY_REQUIREMENT_OVERRIDES,
)

function toModelRequirements(
  defaults: Record<string, { chain: FallbackEntry[] }>,
  overrides: Partial<Record<string, RequirementOverride>>,
): Record<string, ModelRequirement> {
  return Object.fromEntries(
    Object.entries(defaults).map(([name, def]) => {
      const override = overrides[name]

      return [
        name,
        {
          fallbackChain: def.chain,
          ...override,
        },
      ]
    }),
  )
}

function pickFallbackEntries(chain: FallbackEntry[], models: string[]): FallbackEntry[] {
  const allowedModels = new Set(models)

  return chain.filter((entry) => allowedModels.has(entry.model))
}

function excludeFallbackEntries(chain: FallbackEntry[], models: string[]): FallbackEntry[] {
  const excludedModels = new Set(models)

  return chain.filter((entry) => !excludedModels.has(entry.model))
}
