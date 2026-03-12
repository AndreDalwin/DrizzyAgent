export const AGENT_NAME_MAP: Record<string, string> = {
  // Coder variants → "coder"
  omo: "coder",
  OmO: "coder",
  Sisyphus: "coder",
  sisyphus: "coder",
  Coder: "coder",
  coder: "coder",

  // Prometheus variants → "prometheus"
  "OmO-Plan": "prometheus",
  "omo-plan": "prometheus",
  "Planner-Sisyphus": "prometheus",
  "planner-sisyphus": "prometheus",
  "Prometheus (Planner)": "prometheus",
  prometheus: "prometheus",

  // Atlas variants → "atlas"
  "orchestrator-sisyphus": "atlas",
  "orchestrator-coder": "atlas",
  Atlas: "atlas",
  atlas: "atlas",

  // Metis variants → "metis"
  "plan-consultant": "metis",
  "Metis (Plan Consultant)": "metis",
  metis: "metis",

  // Momus variants → "momus"
  "Momus (Plan Reviewer)": "momus",
  momus: "momus",

  // Coder-Junior → "coder-junior"
  "Sisyphus-Junior": "coder-junior",
  "sisyphus-junior": "coder-junior",
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
  "coder", // was "Sisyphus"
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis", // was "Metis (Plan Consultant)"
  "momus", // was "Momus (Plan Reviewer)"
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
