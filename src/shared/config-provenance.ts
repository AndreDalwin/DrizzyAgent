import type { AgentOverrideConfig, AgentOverrides, CategoriesConfig, CategoryConfig } from "../config/schema"

const explicitAgentOverridesStore = new WeakMap<AgentOverrides, AgentOverrides>()
const explicitCategoryConfigsStore = new WeakMap<CategoriesConfig, CategoriesConfig>()

export function registerConfigProvenance(input: {
  effectiveAgents?: AgentOverrides
  effectiveCategories?: CategoriesConfig
  explicitAgents?: AgentOverrides
  explicitCategories?: CategoriesConfig
}): void {
  const {
    effectiveAgents,
    effectiveCategories,
    explicitAgents,
    explicitCategories,
  } = input

  if (effectiveAgents) {
    explicitAgentOverridesStore.set(effectiveAgents, explicitAgents ?? {})
  }

  if (effectiveCategories) {
    explicitCategoryConfigsStore.set(effectiveCategories, explicitCategories ?? {})
  }
}

export function getExplicitAgentOverride(
  agentOverrides: AgentOverrides | undefined,
  agentName: string,
): AgentOverrideConfig | undefined {
  return getValueByKey<AgentOverrideConfig>(
    explicitAgentOverridesStore.get(agentOverrides ?? {}) ?? agentOverrides,
    agentName,
  )
}

export function hasExplicitAgentOverride(
  agentOverrides: AgentOverrides | undefined,
  agentName: string,
): boolean {
  return getExplicitAgentOverride(agentOverrides, agentName) !== undefined
}

export function getEffectiveAgentOverride(
  agentOverrides: AgentOverrides | undefined,
  agentName: string,
): AgentOverrideConfig | undefined {
  return getValueByKey(agentOverrides, agentName)
}

export function getExplicitCategoryConfig(
  userCategories: CategoriesConfig | undefined,
  categoryName: string,
): CategoryConfig | undefined {
  return getValueByKey<CategoryConfig>(
    explicitCategoryConfigsStore.get(userCategories ?? {}) ?? userCategories,
    categoryName,
  )
}

export function hasExplicitCategoryConfig(
  userCategories: CategoriesConfig | undefined,
  categoryName: string,
): boolean {
  return getExplicitCategoryConfig(userCategories, categoryName) !== undefined
}

export function getEffectiveCategoryConfig(
  userCategories: CategoriesConfig | undefined,
  categoryName: string,
): CategoryConfig | undefined {
  return getValueByKey<CategoryConfig>(userCategories, categoryName)
}

function getValueByKey<T>(
  config: Partial<Record<string, T>> | undefined,
  key: string,
): T | undefined {
  if (!config) {
    return undefined
  }

  return config[key] ?? Object.entries(config).find(([entryKey]) => entryKey.toLowerCase() === key.toLowerCase())?.[1]
}
