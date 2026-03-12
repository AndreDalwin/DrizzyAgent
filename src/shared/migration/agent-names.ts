export const AGENT_NAME_MAP: Record<string, string> = {
  // Coder variants → "coder"
  Coder: "coder",
  coder: "coder",

  GPTCoder: "gptcoder",
  gptcoder: "gptcoder",
  hephaestus: "gptcoder",

  // Planner variants → "planner"
  Planner: "planner",
  planner: "planner",

  // Prometheus variants → "planner" (historical)
  "Prometheus (Planner)": "planner",
  prometheus: "planner",

  // Atlas variants → "atlas"
  Atlas: "atlas",
  atlas: "atlas",

  // Plan Consultant variants → "plan-consultant"
  "Plan Consultant": "plan-consultant",
  metis: "plan-consultant",
  "plan-consultant": "plan-consultant",

  // Plan Reviewer variants
  "Plan Reviewer": "plan-reviewer",
  momus: "plan-reviewer",
  "plan-reviewer": "plan-reviewer",

  // Coder-Junior → "coder-junior"
  "Coder-Junior": "coder-junior",
  "coder-junior": "coder-junior",

  // Already lowercase - passthrough
  build: "build",
  oracle: "oracle",
  librarian: "librarian",
  explore: "explore",
  "multimodal-looker": "multimodal-looker",
}

export const BUILTIN_AGENT_NAMES = new Set([
  "coder", // was "Coder"
  "gptcoder",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "plan-consultant", // was "Metis (Plan Consultant)"
  "plan-reviewer", // was "Plan Reviewer"
  "planner",
  "prometheus", // was "Prometheus (Planner)"
  "atlas", // was "Atlas"
  "build",
])

export function migrateAgentNames(
  agents: Record<string, unknown>
): { migrated: Record<string, unknown>; changed: boolean } {
  const migrated: Record<string, unknown> = {}
  let changed = false

  for (const [key, value] of Object.entries(agents)) {
    const newKey = AGENT_NAME_MAP[key.toLowerCase()] ?? AGENT_NAME_MAP[key] ?? key
    if (newKey !== key) {
      changed = true
    }
    migrated[newKey] = value
  }

  return { migrated, changed }
}
