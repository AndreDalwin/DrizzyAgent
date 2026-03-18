import type { AgentConfig } from "@opencode-ai/sdk"
import type { AgentOverrides } from "../types"
import type { CategoriesConfig, CategoryConfig } from "../../config/schema"
import type { AvailableAgent, AvailableSkill } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS } from "../../shared"
import {
  getEffectiveAgentOverride,
  getExplicitAgentOverride,
} from "../../shared/config-provenance"
import { applyOverrides } from "./agent-overrides"
import { applyModelResolution } from "./model-resolution"
import { createOrchestratorAgent } from "../orchestrator"

export function maybeCreateOrchestratorConfig(input: {
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  uiSelectedModel?: string
  availableModels: Set<string>
  systemDefaultModel?: string
  availableAgents: AvailableAgent[]
  availableSkills: AvailableSkill[]
  mergedCategories: Record<string, CategoryConfig>
  directory?: string
  userCategories?: CategoriesConfig
  useTaskSystem?: boolean
}): AgentConfig | undefined {
  const {
    disabledAgents,
    agentOverrides,
    uiSelectedModel,
    availableModels,
    systemDefaultModel,
    availableAgents,
    availableSkills,
    mergedCategories,
    directory,
    userCategories,
  } = input

  if (disabledAgents.includes("orchestrator")) return undefined

  const orchestratorOverride = getExplicitAgentOverride(agentOverrides, "orchestrator")
  const effectiveOrchestratorOverride = getEffectiveAgentOverride(agentOverrides, "orchestrator")
  const orchestratorRequirement = AGENT_MODEL_REQUIREMENTS["orchestrator"]

  const orchestratorResolution = applyModelResolution({
    uiSelectedModel: effectiveOrchestratorOverride?.model ? undefined : uiSelectedModel,
    userModel: effectiveOrchestratorOverride?.model,
    requirement: orchestratorRequirement,
    availableModels,
    systemDefaultModel,
  })

  if (!orchestratorResolution) return undefined
  const { model: orchestratorModel, variant: orchestratorResolvedVariant } = orchestratorResolution

  let orchestratorConfig = createOrchestratorAgent({
    model: orchestratorModel,
    availableAgents,
    availableSkills,
    userCategories,
  })

  const orchestratorVariant =
    orchestratorOverride?.variant ?? effectiveOrchestratorOverride?.variant ?? orchestratorResolvedVariant
  if (orchestratorVariant) {
    orchestratorConfig = { ...orchestratorConfig, variant: orchestratorVariant }
  }

  orchestratorConfig = applyOverrides(orchestratorConfig, orchestratorOverride, mergedCategories, directory)

  return orchestratorConfig
}
