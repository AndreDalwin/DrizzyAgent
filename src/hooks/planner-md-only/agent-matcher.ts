import { PLANNER_AGENT } from "./constants"

const LEGACY_AGENT_IDENTIFIERS = [PLANNER_AGENT, "prometheus"]

export function isPlannerAgent(agentName: string | undefined): boolean {
  if (!agentName) return false
  const normalized = agentName.toLowerCase()
  return LEGACY_AGENT_IDENTIFIERS.some((identifier) => normalized.includes(identifier))
}
