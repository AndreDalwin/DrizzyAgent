import { RESEARCHER_AGENTS } from "./constants"

export function isResearcherAgent(agentName: string | undefined): boolean {
  if (!agentName) return false
  const normalized = agentName.toLowerCase()
  return RESEARCHER_AGENTS.some((identifier) => normalized.includes(identifier))
}
