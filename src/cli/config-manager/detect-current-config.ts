import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { parseJsonc } from "../../shared/jsonc-parser"
import type { DetectedConfig } from "../types"
import { getConfigDir, getDrizzyConfigPath } from "./config-context"
import { detectConfigFormat } from "./opencode-config-format"
import {
  parseOpenCodeConfigFileWithError,
  type OpenCodeConfig,
} from "./parse-opencode-config-file"

interface DetectCurrentConfigDependencies {
  detectConfigFormat: typeof detectConfigFormat
  getConfigDir: typeof getConfigDir
  getDrizzyConfigPath: typeof getDrizzyConfigPath
  parseJsonc: typeof parseJsonc
  parseOpenCodeConfigFileWithError: typeof parseOpenCodeConfigFileWithError
}

const defaultDependencies: DetectCurrentConfigDependencies = {
  detectConfigFormat,
  getConfigDir,
  getDrizzyConfigPath,
  parseJsonc,
  parseOpenCodeConfigFileWithError,
}

const DEFAULT_PROVIDER_DETECTION = {
  hasClaude: false,
  isMax20: false,
  hasOpenAI: true,
  hasGemini: false,
  hasCopilot: false,
  hasOpencodeZen: true,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
  isLegacyConfig: false,
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

type ProviderDetectionResult = {
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
  isLegacyConfig: boolean
}

function detectProvidersFromString(configStr: string) {
  return {
    hasClaude: configStr.includes('"anthropic/'),
    hasOpenAI: configStr.includes('"openai/'),
    hasGemini: configStr.includes('"google/'),
    hasCopilot: configStr.includes('"github-copilot/'),
    hasOpencodeZen: configStr.includes('"opencode/'),
    hasZaiCodingPlan: configStr.includes('"zai-coding-plan/'),
    hasKimiForCoding: configStr.includes('"kimi-for-coding/'),
  }
}

function mergeProviderDetection(
  source: ReturnType<typeof detectProvidersFromString>,
  isMax20: boolean,
): Omit<ProviderDetectionResult, "isLegacyConfig"> {
  return { ...source, isMax20 }
}

function detectProvidersFromDrizzyConfig(
  deps: DetectCurrentConfigDependencies,
): ProviderDetectionResult {
  const configPath =
    existsSync(deps.getDrizzyConfigPath()) &&
    deps.getDrizzyConfigPath()
      ? deps.getDrizzyConfigPath()
      : join(deps.getConfigDir(), "drizzy-agent.json")

  if (!existsSync(configPath)) return DEFAULT_PROVIDER_DETECTION

  try {
    const drizzyConfig = deps.parseJsonc<Record<string, unknown>>(
      readFileSync(configPath, "utf-8"),
    )
    if (!isRecord(drizzyConfig)) return DEFAULT_PROVIDER_DETECTION

    const isLegacyConfig = !("_install_defaults" in drizzyConfig)
    let result: Omit<ProviderDetectionResult, "isLegacyConfig">

    if (!isLegacyConfig) {
      const installDefaults = drizzyConfig._install_defaults
      if (isRecord(installDefaults) && isRecord(installDefaults.providers)) {
        const p = installDefaults.providers
        result = {
          hasClaude: p.claude !== "no",
          isMax20: p.claude === "max20",
          hasOpenAI: p.openai === true,
          hasGemini: p.gemini === true,
          hasCopilot: p.copilot === true,
          hasOpencodeZen: p.opencode_zen === true,
          hasZaiCodingPlan: p.zai_coding_plan === true,
          hasKimiForCoding: p.kimi_for_coding === true,
        }
      } else {
        const inferred = detectProvidersFromString(JSON.stringify(drizzyConfig))
        result = mergeProviderDetection(inferred, false)
      }
    } else {
      const inferred = detectProvidersFromString(JSON.stringify(drizzyConfig))
      const categories = drizzyConfig.categories
      const unspecifiedHigh = isRecord(categories)
        ? categories["unspecified-high"]
        : undefined
      const isMax20 =
        inferred.hasClaude &&
        isRecord(unspecifiedHigh) &&
        unspecifiedHigh.model === "anthropic/claude-opus-4-6" &&
        unspecifiedHigh.variant === "max"
      result = mergeProviderDetection(inferred, isMax20)
    }

    return { ...result, isLegacyConfig }
  } catch {
    return DEFAULT_PROVIDER_DETECTION
  }
}

export function detectCurrentConfig(
  deps: DetectCurrentConfigDependencies = defaultDependencies,
): DetectedConfig {
  const { format, path } = deps.detectConfigFormat()
  if (format === "none") {
    return { isInstalled: false, ...DEFAULT_PROVIDER_DETECTION }
  }

  const parseResult = deps.parseOpenCodeConfigFileWithError(path)
  if (!parseResult.config) {
    return { isInstalled: false, ...DEFAULT_PROVIDER_DETECTION }
  }

  const result: DetectedConfig = {
    isInstalled: false,
    hasClaude: false,
    isMax20: false,
    hasOpenAI: true,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: true,
    hasZaiCodingPlan: false,
    hasKimiForCoding: false,
    isLegacyConfig: false,
  }

  const openCodeConfig = parseResult.config as OpenCodeConfig
  const plugins = openCodeConfig.plugin ?? []
  result.isInstalled = plugins.some((p) => p.startsWith("drizzy-agent"))

  if (!result.isInstalled) {
    return result
  }

  const providers = openCodeConfig.provider as Record<string, unknown> | undefined
  const {
    hasClaude,
    isMax20,
    hasOpenAI,
    hasGemini,
    hasCopilot,
    hasOpencodeZen,
    hasZaiCodingPlan,
    hasKimiForCoding,
    isLegacyConfig,
  } = detectProvidersFromDrizzyConfig(deps)

  result.hasClaude = hasClaude || (providers ? "anthropic" in providers : false)
  result.isMax20 = isMax20
  result.hasOpenAI = hasOpenAI
  result.hasGemini = hasGemini || (providers ? "google" in providers : false)
  result.hasCopilot = hasCopilot || (providers ? "github-copilot" in providers : false)
  result.hasOpencodeZen = hasOpencodeZen
  result.hasZaiCodingPlan = hasZaiCodingPlan
  result.hasKimiForCoding = hasKimiForCoding
  result.isLegacyConfig = isLegacyConfig

  return result
}
