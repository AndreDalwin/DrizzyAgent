import type { AgentConfig } from "@opencode-ai/sdk"
import type { BuiltinAgentName, AgentOverrides, AgentPromptMetadata } from "../types"
import type { CategoryConfig, GitMasterConfig } from "../../config/schema"
import type { BrowserAutomationProvider } from "../../config/schema"
import type { AvailableAgent } from "../dynamic-agent-prompt-builder"
import { AGENT_MODEL_REQUIREMENTS, isModelAvailable } from "../../shared"
import { getAgentConfigKey } from "../../shared/agent-display-names"
import { getExplicitAgentOverride, getEffectiveAgentOverride } from "../../shared/config-provenance"
import { buildAgent, isFactory } from "../agent-builder"
import { applyOverrides } from "./agent-overrides"
import { applyEnvironmentContext } from "./environment-context"
import { applyModelResolution, getFirstFallbackModel } from "./model-resolution"

export function collectPendingBuiltinAgents(input: {
  agentSources: Record<BuiltinAgentName, import("../agent-builder").AgentSource>
  agentMetadata: Partial<Record<BuiltinAgentName, AgentPromptMetadata>>
  disabledAgents: string[]
  agentOverrides: AgentOverrides
  directory?: string
  systemDefaultModel?: string
  mergedCategories: Record<string, CategoryConfig>
  gitMasterConfig?: GitMasterConfig
  browserProvider?: BrowserAutomationProvider
  uiSelectedModel?: string
  availableModels: Set<string>
  isFirstRunNoCache: boolean
  disabledSkills?: Set<string>
  useTaskSystem?: boolean
  disableOmoEnv?: boolean
}): { pendingAgentConfigs: Map<string, AgentConfig>; availableAgents: AvailableAgent[] } {
  const {
    agentSources,
    agentMetadata,
    disabledAgents,
    agentOverrides,
    directory,
    systemDefaultModel,
    mergedCategories,
    gitMasterConfig,
    browserProvider,
    uiSelectedModel,
    availableModels,
    isFirstRunNoCache,
    disabledSkills,
    disableOmoEnv = false,
  } = input

  const availableAgents: AvailableAgent[] = []
  const pendingAgentConfigs: Map<string, AgentConfig> = new Map()

  for (const [name, source] of Object.entries(agentSources)) {
    const agentName = name as BuiltinAgentName

    if (agentName === "coder") continue
    if (agentName === "gptcoder") continue
    if (agentName === "atlas") continue
    if (agentName === "coder-junior") continue
    if (disabledAgents.some((name) => name.toLowerCase() === agentName.toLowerCase())) continue

    const agentConfigKey = getAgentConfigKey(agentName)
    const override = getExplicitAgentOverride(agentOverrides, agentConfigKey)
    const effectiveOverride = getEffectiveAgentOverride(agentOverrides, agentConfigKey)
    const requirement = AGENT_MODEL_REQUIREMENTS[agentConfigKey]

    // Check if agent requires a specific model
    if (requirement?.requiresModel && availableModels) {
      if (!isModelAvailable(requirement.requiresModel, availableModels)) {
        continue
      }
    }

    const isPrimaryAgent = isFactory(source) && source.mode === "primary"

    let resolution = applyModelResolution({
      uiSelectedModel: (isPrimaryAgent && !override?.model) ? uiSelectedModel : undefined,
      userModel: override?.model,
      computedDefaultModel: effectiveOverride?.model,
      requirement,
      availableModels,
      systemDefaultModel,
    })
    if (!resolution && isFirstRunNoCache && !override?.model) {
      resolution = getFirstFallbackModel(requirement)
    }
    if (!resolution) continue
    const { model, variant: resolvedVariant } = resolution

    let config = buildAgent(source, model, mergedCategories, gitMasterConfig, browserProvider, disabledSkills)

    // Apply resolved variant from model fallback chain
    if (resolvedVariant) {
      config = { ...config, variant: resolvedVariant }
    }

    if (agentName === "librarian") {
      config = applyEnvironmentContext(config, directory, { disableOmoEnv })
    }

    config = applyOverrides(config, override, mergedCategories, directory)

    // Store for later - will be added after coder and gptcoder
    pendingAgentConfigs.set(name, config)

    const metadata = agentMetadata[agentName]
    if (metadata) {
      availableAgents.push({
        name: agentName,
        description: config.description ?? "",
        metadata,
      })
    }
  }

  return { pendingAgentConfigs, availableAgents }
}
