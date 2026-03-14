import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isAnyProviderConnected } from "../../shared"
import { getExplicitAgentOverride, hasExplicitAgentOverride } from "../../shared/config-provenance"
import { createGptcoderAgent } from "../gptcoder"
import { applyEnvironmentContext } from "./environment-context"
import { applyCategoryOverride, mergeAgentConfig } from "./agent-overrides"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"

export function maybeCreateGptcoderConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  useTaskSystem: boolean
  disableOmoEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    availableModels,
    systemDefaultModel,
    isFirstRunNoCache,
    availableAgents,
    availableSkills,
    availableCategories,
    mergedCategories,
    directory,
    useTaskSystem,
    disableOmoEnv = false,
  } = input

  if (disabledAgents.includes("gptcoder")) return undefined

  const gptcoderOverride = getExplicitAgentOverride(agentOverrides, "gptcoder")
  const gptcoderRequirement = AGENT_MODEL_REQUIREMENTS["gptcoder"]
  const hasGptcoderExplicitConfig = hasExplicitAgentOverride(agentOverrides, "gptcoder")

  const hasRequiredProvider =
    !gptcoderRequirement?.requiresProvider ||
    hasGptcoderExplicitConfig ||
    isFirstRunNoCache ||
    isAnyProviderConnected(gptcoderRequirement.requiresProvider, availableModels)

  if (!hasRequiredProvider) return undefined

  let gptcoderResolution = applyModelResolution({
    userModel: gptcoderOverride?.model,
    requirement: gptcoderRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !gptcoderOverride?.model) {
    gptcoderResolution = getFirstFallbackModel(gptcoderRequirement)
  }

  if (!gptcoderResolution) return undefined
  const { model: gptcoderModel, variant: gptcoderResolvedVariant } = gptcoderResolution

  let gptcoderConfig = createGptcoderAgent(
    gptcoderModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  gptcoderConfig = { ...gptcoderConfig, variant: gptcoderResolvedVariant ?? "medium" }

  const gptcoderOverrideCategory = (gptcoderOverride as Record<string, unknown> | undefined)?.category as string | undefined
  if (gptcoderOverrideCategory) {
    gptcoderConfig = applyCategoryOverride(gptcoderConfig, gptcoderOverrideCategory, mergedCategories)
  }

  gptcoderConfig = applyEnvironmentContext(gptcoderConfig, directory, { disableOmoEnv })

  if (gptcoderOverride) {
    gptcoderConfig = mergeAgentConfig(gptcoderConfig, gptcoderOverride, directory)
  }
  return gptcoderConfig
}
