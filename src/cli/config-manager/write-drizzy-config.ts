import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { parseJsonc } from "../../shared"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { getConfigDir, getDrizzyConfigPath } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { generateDrizzyConfig } from "./generate-drizzy-config"

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0
}

function mergeGeneratedConfigWithExisting(
  generated: Record<string, unknown>,
  existing: Record<string, unknown>
): Record<string, unknown> {
  const result: Record<string, unknown> = { ...existing }

  for (const [key, generatedValue] of Object.entries(generated)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") continue

    const existingValue = existing[key]

    if (
      generatedValue !== null &&
      typeof generatedValue === "object" &&
      !Array.isArray(generatedValue) &&
      existingValue !== null &&
      typeof existingValue === "object" &&
      !Array.isArray(existingValue)
    ) {
      result[key] = mergeGeneratedConfigWithExisting(
        generatedValue as Record<string, unknown>,
        existingValue as Record<string, unknown>
      )
      continue
    }

    result[key] = generatedValue
  }

  return result
}

export function writeDrizzyConfig(installConfig: InstallConfig): ConfigMergeResult {
  try {
    ensureConfigDirectoryExists()
  } catch (err) {
    return {
      success: false,
      configPath: getConfigDir(),
      error: formatErrorWithSuggestion(err, "create config directory"),
    }
  }

  const drizzyConfigPath = getDrizzyConfigPath()
  const legacyConfigPath = join(getConfigDir(), "oh-my-opencode.json")
  const existingConfigPath = existsSync(drizzyConfigPath)
    ? drizzyConfigPath
    : existsSync(legacyConfigPath)
      ? legacyConfigPath
      : drizzyConfigPath

  try {
    const newConfig = generateDrizzyConfig(installConfig)

    if (existsSync(existingConfigPath)) {
      try {
        const stat = statSync(existingConfigPath)
        const content = readFileSync(existingConfigPath, "utf-8")

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: drizzyConfigPath }
        }

        const existing = parseJsonc<Record<string, unknown>>(content)
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: drizzyConfigPath }
        }

        const merged = mergeGeneratedConfigWithExisting(newConfig, existing)
        writeFileSync(drizzyConfigPath, JSON.stringify(merged, null, 2) + "\n")
      } catch (parseErr) {
        if (parseErr instanceof SyntaxError) {
          writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: drizzyConfigPath }
        }
        throw parseErr
      }
    } else {
      writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
    }

    return { success: true, configPath: drizzyConfigPath }
  } catch (err) {
    return {
      success: false,
      configPath: drizzyConfigPath,
      error: formatErrorWithSuggestion(err, "write drizzy-agent config"),
    }
  }
}
