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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value)
}

function detectProvidersFromDrizzyConfig(deps: DetectCurrentConfigDependencies): {
  hasClaude: boolean
  isMax20: boolean
  hasOpenAI: boolean
  hasGemini: boolean
  hasCopilot: boolean
  hasOpencodeZen: boolean
  hasZaiCodingPlan: boolean
  hasKimiForCoding: boolean
} {
  const drizzyConfigPath = deps.getDrizzyConfigPath()
  const configPath = existsSync(drizzyConfigPath)
    ? drizzyConfigPath
    : join(deps.getConfigDir(), "drizzy-agent.json")
  if (!existsSync(configPath)) {
    return {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }
  }

  try {
    const content = readFileSync(configPath, "utf-8")
    const drizzyConfig = deps.parseJsonc<Record<string, unknown>>(content)
    if (!isRecord(drizzyConfig)) {
      return {
        hasClaude: false,
        isMax20: false,
        hasOpenAI: true,
        hasGemini: false,
        hasCopilot: false,
        hasOpencodeZen: true,
        hasZaiCodingPlan: false,
        hasKimiForCoding: false,
      }
    }

    const configStr = JSON.stringify(drizzyConfig)
    const hasClaude = configStr.includes('"anthropic/')
    const hasOpenAI = configStr.includes('"openai/')
    const hasGemini = configStr.includes('"google/')
    const hasCopilot = configStr.includes('"github-copilot/')
    const hasOpencodeZen = configStr.includes('"opencode/')
    const hasZaiCodingPlan = configStr.includes('"zai-coding-plan/')
    const hasKimiForCoding = configStr.includes('"kimi-for-coding/')

    const categories = drizzyConfig.categories
    const unspecifiedHigh = isRecord(categories) ? categories["unspecified-high"] : undefined
    const isMax20 =
      hasClaude &&
      isRecord(unspecifiedHigh) &&
      unspecifiedHigh.model === "anthropic/claude-opus-4-6" &&
      unspecifiedHigh.variant === "max"

    return {
      hasClaude,
      isMax20,
      hasOpenAI,
      hasGemini,
      hasCopilot,
      hasOpencodeZen,
      hasZaiCodingPlan,
      hasKimiForCoding,
    }
  } catch {
    return {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }
  }
}

export function detectCurrentConfig(
  deps: DetectCurrentConfigDependencies = defaultDependencies,
): DetectedConfig {
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
  }

  const { format, path } = deps.detectConfigFormat()
  if (format === "none") {
    return result
  }

  const parseResult = deps.parseOpenCodeConfigFileWithError(path)
  if (!parseResult.config) {
    return result
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
  } = detectProvidersFromDrizzyConfig(deps)

  result.hasClaude = hasClaude || (providers ? "anthropic" in providers : false)
  result.isMax20 = isMax20
  result.hasOpenAI = hasOpenAI
  result.hasGemini = hasGemini || (providers ? "google" in providers : false)
  result.hasCopilot = hasCopilot || (providers ? "github-copilot" in providers : false)
  result.hasOpencodeZen = hasOpencodeZen
  result.hasZaiCodingPlan = hasZaiCodingPlan
  result.hasKimiForCoding = hasKimiForCoding

  return result
}
