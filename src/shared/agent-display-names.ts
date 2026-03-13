export const AGENT_DISPLAY_NAMES: Record<string, string> = {
  coder: "Coder",
  gptcoder: "GPTCoder",
  planner: "Planner",
  atlas: "Atlas (Plan Executor)",
  "coder-junior": "Coder Junior",
  planConsultant: "Plan Consultant",
  planReviewer: "Plan Reviewer",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  "multimodal-looker": "multimodal-looker",
}

/**
 * Get display name for an agent config key.
 * Uses case-insensitive lookup for backward compatibility.
 * Returns original key if not found.
 */
export function getAgentDisplayName(configKey: string): string {
  // Try exact match first
  const exactMatch = AGENT_DISPLAY_NAMES[configKey]
  if (exactMatch !== undefined) return exactMatch
  
  // Fall back to case-insensitive search
  const lowerKey = configKey.toLowerCase()
  for (const [k, v] of Object.entries(AGENT_DISPLAY_NAMES)) {
    if (k.toLowerCase() === lowerKey) return v
  }
  
  // Unknown agent: return original key
  return configKey
}

const REVERSE_DISPLAY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(AGENT_DISPLAY_NAMES).map(([key, displayName]) => [displayName.toLowerCase(), key]),
)

/**
 * Resolve an agent name (display name or config key) to its lowercase config key.
 * "Atlas (Plan Executor)" → "atlas", "atlas" → "atlas", "unknown" → "unknown"
 */
export function getAgentConfigKey(agentName: string): string {
  if (AGENT_DISPLAY_NAMES[agentName] !== undefined) return agentName
  const lower = agentName.toLowerCase()
  const reversed = REVERSE_DISPLAY_NAMES[lower]
  if (reversed !== undefined) return reversed
  if (lower === "plan-consultant") return "planConsultant"
  if (lower === "plan-reviewer") return "planReviewer"
  if (AGENT_DISPLAY_NAMES[lower] !== undefined) return lower
  return lower
}
