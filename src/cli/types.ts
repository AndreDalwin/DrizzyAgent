import type {
  InstallDefaultsClaudeProvider,
  InstallDefaultsProviders,
  InstallDefaultsSnapshot,
} from "../shared/install-defaults-contract";
import type { InstallIntent as _InstallIntent } from "./install-intent-types";

export type ClaudeSubscription = InstallDefaultsClaudeProvider
export type BooleanArg = "no" | "yes"

export interface InstallArgs {
  tui: boolean
  claude?: ClaudeSubscription
  openai?: BooleanArg
  gemini?: BooleanArg
  copilot?: BooleanArg
  opencodeZen?: BooleanArg
  zaiCodingPlan?: BooleanArg
  kimiForCoding?: BooleanArg
  skipAuth?: boolean
}

export interface InstallConfig {
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
}

export type InstallSnapshotProviders = InstallDefaultsProviders

export type InstallSnapshot = InstallDefaultsSnapshot

// Explicit install intent structure separated from the persisted snapshot
export type InstallIntent = _InstallIntent

export interface ConfigMergeResult {
  success: boolean
  configPath: string
  error?: string
}

export interface DetectedConfig {
  isInstalled: boolean
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
  /** True if config lacks _install_defaults (legacy config that won't receive auto-updates) */
  isLegacyConfig?: boolean
}

export interface OmoDetectionResult {
  isInstalled: boolean
  configPath?: string
  pluginEntry?: string
  openCodeConfigPath?: string
}
