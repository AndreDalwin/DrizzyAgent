import { InstallDefaultsClaudeProvider, InstallDefaultsProviders } from "../shared/install-defaults-contract"

// Typed structure representing a user intent to install with explicit overrides.
// This is the override-only architecture's input shape, separate from the persisted snapshot.
export interface InstallIntent {
  claude?: InstallDefaultsClaudeProvider
  openai?: boolean
  gemini?: boolean
  copilot?: boolean
  opencode_zen?: boolean
  zai_coding_plan?: boolean
  kimi_for_coding?: boolean
}

// Optional alias to reflect a subset of providers that can be supplied as a partial intent.
export type InstallIntentProviders = Partial<InstallDefaultsProviders> & {
  claude?: InstallDefaultsClaudeProvider
}
