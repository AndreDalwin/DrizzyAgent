import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableCategory, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isAnyFallbackModelAvailable } from "../../shared"
import { getExplicitAgentOverride, hasExplicitAgentOverride } from "../../shared/config-provenance"
import { applyEnvironmentContext } from "./environment-context"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"
import { createCoderAgent } from "../coder"

export function maybeCreateCoderConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  isFirstRunNoCache: boolean
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  availableCategories: AvailableCategory[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem: boolean
  disableOmoEnv?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
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

  const coderOverride = getExplicitAgentOverride(agentOverrides, "coder")
  const coderRequirement = AGENT_MODEL_REQUIREMENTS["coder"]
  const hasCoderExplicitConfig = hasExplicitAgentOverride(agentOverrides, "coder")
  const meetsCoderAnyModelRequirement =
    !coderRequirement?.requiresAnyModel ||
    hasCoderExplicitConfig ||
    isFirstRunNoCache ||
    isAnyFallbackModelAvailable(coderRequirement.fallbackChain, availableModels)

  if (disabledAgents.includes("coder") || !meetsCoderAnyModelRequirement) return undefined

  let coderResolution = applyModelResolution({
    uiSelectedModel: coderOverride?.model ? undefined : uiSelectedModel,
    userModel: coderOverride?.model,
    requirement: coderRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (isFirstRunNoCache && !coderOverride?.model && !uiSelectedModel) {
    coderResolution = getFirstFallbackModel(coderRequirement)
  }

  if (!coderResolution) return undefined
  const { model: coderModel, variant: coderResolvedVariant } = coderResolution

  let coderConfig = createCoderAgent(
    coderModel,
    availableAgents,
    undefined,
    availableSkills,
    availableCategories,
    useTaskSystem
  )

  if (coderResolvedVariant) {
    coderConfig = { ...coderConfig, variant: coderResolvedVariant }
  }

  coderConfig = applyOverrides(coderConfig, coderOverride, mergedCategories, directory)
  coderConfig = applyEnvironmentContext(coderConfig, directory, {
    disableOmoEnv,
  })

  return coderConfig
}
