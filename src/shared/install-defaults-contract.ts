export const INSTALL_DEFAULTS_ROOT_KEY = "_install_defaults" as const

export const INSTALL_DEFAULTS_SNAPSHOT_VERSION = 1 as const

export const INSTALL_DEFAULTS_PRECEDENCE = [
  "project-explicit-override",
  "user-explicit-override",
  "snapshot-derived-default",
  "built-in-default",
] as const

export type InstallDefaultsPrecedence =
  (typeof INSTALL_DEFAULTS_PRECEDENCE)[number]

export type InstallDefaultsClaudeProvider = "no" | "yes" | "max20"

export const INSTALL_DEFAULTS_PROVIDER_KEYS = [
  "claude",
  "openai",
  "gemini",
  "copilot",
  "opencode_zen",
  "zai_coding_plan",
  "kimi_for_coding",
] as const

/**
 * Minimal install-owned snapshot persisted in user config.
 *
 * Persist only `_install_defaults.snapshot_version` plus normalized provider
 * availability under `_install_defaults.providers`. Expanded generated
 * `agents` and `categories` defaults are intentionally out of scope so runtime
 * can recompute them from current fallback rules.
 */
export interface InstallDefaultsProviders {
  claude: InstallDefaultsClaudeProvider
  openai: boolean
  gemini: boolean
  copilot: boolean
  opencode_zen: boolean
  zai_coding_plan: boolean
  kimi_for_coding: boolean
}

export interface InstallDefaultsSnapshot {
  snapshot_version: typeof INSTALL_DEFAULTS_SNAPSHOT_VERSION
  providers: InstallDefaultsProviders
}

/**
 * Explicit overrides stay sparse. Omitting `model` or `variant` means "use the
 * computed default" rather than pinning an empty value in config.
 */
export interface ComputedDefaultOverride {
  model?: string
  variant?: string
}
