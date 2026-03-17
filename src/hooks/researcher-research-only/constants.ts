export const HOOK_NAME = "researcher-research-only"

export const RESEARCHER_AGENTS = ["researcher", "researcher-junior"] as const

export const GUARDED_PATH_TOOLS = [
  "Write",
  "Edit",
  "write",
  "edit",
  "hashline_edit",
] as const

export const ALWAYS_BLOCKED_MUTATION_TOOLS = ["lsp_rename"] as const

export const CONDITIONALLY_BLOCKED_MUTATION_TOOLS = ["ast_grep_replace"] as const

export const ALLOWED_BASE_PATH = ".drizzy/research"

export const ALLOWED_EXTENSIONS = [".md"]
