/**
 * Agent tool restrictions for session.prompt calls.
 * OpenCode SDK's session.prompt `tools` parameter expects boolean values.
 * true = tool allowed, false = tool denied.
 */

const EXPLORATION_AGENT_DENYLIST: Record<string, boolean> = {
  write: false,
  edit: false,
  task: false,
  call_drizzy_agent: false,
}

const AGENT_RESTRICTIONS: Record<string, Record<string, boolean>> = {
  explore: EXPLORATION_AGENT_DENYLIST,

  librarian: EXPLORATION_AGENT_DENYLIST,

  oracle: {
    write: false,
    edit: false,
    task: false,
    call_drizzy_agent: false,
  },

  planConsultant: {
    write: false,
    edit: false,
    task: false,
  },

  planReviewer: {
    write: false,
    edit: false,
    task: false,
  },

  "multimodal-looker": {
    read: true,
  },

  "coder-junior": {
    task: false,
  },
}

function normalizeAgentRestrictionKey(agentName: string): string {
  return agentName.toLowerCase().replace(/[-\s]/g, "")
}

export function getAgentToolRestrictions(agentName: string): Record<string, boolean> {
  return AGENT_RESTRICTIONS[agentName]
    ?? Object.entries(AGENT_RESTRICTIONS).find(
      ([key]) => normalizeAgentRestrictionKey(key) === normalizeAgentRestrictionKey(agentName)
    )?.[1]
    ?? {}
}

export function hasAgentToolRestrictions(agentName: string): boolean {
  const restrictions = AGENT_RESTRICTIONS[agentName]
    ?? Object.entries(AGENT_RESTRICTIONS).find(
      ([key]) => normalizeAgentRestrictionKey(key) === normalizeAgentRestrictionKey(agentName)
    )?.[1]
  return restrictions !== undefined && Object.keys(restrictions).length > 0
}
