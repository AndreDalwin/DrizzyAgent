import { getAgentConfigKey } from "./agent-display-names"
import { BuiltinAgentNameSchema } from "../config/schema/agent-names"

const CAMEL_TO_KEBAB: Record<string, string> = {
  planConsultant: "plan-consultant",
  planReviewer: "plan-reviewer",
}

export function resolvePromptReplayAgent(agent: string | undefined): string | undefined {
  if (!agent) return undefined

  const trimmed = agent.trim()
  if (!trimmed) return undefined

  // Fail closed on compaction agent
  if (trimmed.toLowerCase() === "compaction") return undefined

  const configKey = getAgentConfigKey(trimmed)
  const kebabKey = CAMEL_TO_KEBAB[configKey] ?? configKey

  // Fail closed on unknown agents - only return known built-ins or custom agents
  if (BuiltinAgentNameSchema.safeParse(kebabKey).success) {
    return kebabKey
  }

  // Accept any string as custom agent if it doesn't look like garbage
  // - Contains hyphen (kebab-case): custom-agent
  // - Contains uppercase (PascalCase/CamelCase): MyCustomAgent
  // - Looks like an identifier: my_custom_agent
  if (trimmed.includes("-") || /^[A-Z]/.test(trimmed) || trimmed.includes("_")) {
    return trimmed
  }

  // Fail closed on unknown/invalid agent names
  return undefined
}
