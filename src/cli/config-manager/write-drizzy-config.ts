import { existsSync, readFileSync, statSync, writeFileSync } from "node:fs"
import { parseJsonc } from "../../shared/jsonc-parser"
import type { ConfigMergeResult, InstallConfig } from "../types"
import { getConfigDir, getDrizzyConfigPath } from "./config-context"
import { ensureConfigDirectoryExists } from "./ensure-config-directory-exists"
import { formatErrorWithSuggestion } from "./format-error-with-suggestion"
import { generateDrizzyConfig } from "./generate-drizzy-config"

function isEmptyOrWhitespace(content: string): boolean {
  return content.trim().length === 0
}

function mergeSnapshotConfigWithExisting(
  generated: Record<string, unknown>,
  existing: Record<string, unknown>
): Record<string, unknown> {
  return {
    ...existing,
    ...generated,
  }
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

  try {
    const newConfig = generateDrizzyConfig(installConfig)

    if (existsSync(drizzyConfigPath)) {
      try {
        const stat = statSync(drizzyConfigPath)
        const content = readFileSync(drizzyConfigPath, "utf-8")

        if (stat.size === 0 || isEmptyOrWhitespace(content)) {
          writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: drizzyConfigPath }
        }

        const existing = parseJsonc<Record<string, unknown>>(content)
        if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
          writeFileSync(drizzyConfigPath, JSON.stringify(newConfig, null, 2) + "\n")
          return { success: true, configPath: drizzyConfigPath }
        }

        const merged = mergeSnapshotConfigWithExisting(newConfig, existing)

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
