import {
  AGENT_MODEL_DEFAULTS,
  CATEGORY_MODEL_DEFAULTS,
  type FallbackEntry,
} from "../shared/agent-model-defaults"
import type { ModelRequirement } from "../shared/model-requirements"

type CliModelDefault = {
  chain: FallbackEntry[]
  includeInInstall: boolean
  requiresAnyProvider?: string[]
}

export const CLI_AGENT_MODEL_REQUIREMENTS: Record<string, ModelRequirement> =
  toCliModelRequirements(AGENT_MODEL_DEFAULTS, { includeProviderRequirements: true })

export const CLI_CATEGORY_MODEL_REQUIREMENTS: Record<string, ModelRequirement> =
  toCliModelRequirements(CATEGORY_MODEL_DEFAULTS)

function toCliModelRequirements(
  defaults: Record<string, CliModelDefault>,
  options: { includeProviderRequirements?: boolean } = {},
): Record<string, ModelRequirement> {
  return Object.fromEntries(
    Object.entries(defaults)
      .filter(([, def]) => def.includeInInstall)
      .map(([name, def]) => [
        name,
        {
          fallbackChain: def.chain,
          requiresAnyModel:
            options.includeProviderRequirements && def.requiresAnyProvider?.length ? true : undefined,
          requiresProvider: options.includeProviderRequirements ? def.requiresAnyProvider : undefined,
        },
      ]),
  )
}
