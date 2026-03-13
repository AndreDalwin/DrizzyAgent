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

/**
 * Detects if a config value looks like a generated default (only has model/variant, no custom overrides).
 * Used to strip old generated defaults while preserving real user overrides.
 */
function isGeneratedDefault(
  config: Record<string, unknown>
): boolean {
  const keys = Object.keys(config)
  // Generated defaults only have model and optionally variant
  const allowedKeys = ["model", "variant"]
  return keys.every((k) => allowedKeys.includes(k))
}

/**
 * Strips generated defaults from agents/categories while preserving user overrides.
 * This is critical for legacy config migration to snapshot-based defaults.
 */
function stripGeneratedDefaults(
  existing: Record<string, unknown>
): Record<string, unknown> {
  const result = { ...existing }

  // Strip generated agents (keep only user overrides with custom fields)
  if (result.agents && typeof result.agents === "object" && !Array.isArray(result.agents)) {
    const agents = result.agents as Record<string, unknown>
    const filteredAgents: Record<string, unknown> = {}
    let hasFiltered = false

    for (const [key, value] of Object.entries(agents)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isGeneratedDefault(value as Record<string, unknown>)
      ) {
        // This has custom fields - it's a user override, keep it
        filteredAgents[key] = value
        hasFiltered = true
      }
    }

    if (hasFiltered) {
      result.agents = filteredAgents
    } else {
      delete result.agents
    }
  }

  // Strip generated categories (keep only user overrides with custom fields)
  if (
    result.categories &&
    typeof result.categories === "object" &&
    !Array.isArray(result.categories)
  ) {
    const categories = result.categories as Record<string, unknown>
    const filteredCategories: Record<string, unknown> = {}
    let hasFiltered = false

    for (const [key, value] of Object.entries(categories)) {
      if (
        value &&
        typeof value === "object" &&
        !Array.isArray(value) &&
        !isGeneratedDefault(value as Record<string, unknown>)
      ) {
        // This has custom fields - it's a user override, keep it
        filteredCategories[key] = value
        hasFiltered = true
      }
    }

    if (hasFiltered) {
      result.categories = filteredCategories
    } else {
      delete result.categories
    }
  }

  return result
}

function mergeSnapshotConfigWithExisting(
  generated: Record<string, unknown>,
  existing: Record<string, unknown>
): Record<string, unknown> {
  // Check if this is a legacy config (has agents/categories but no _install_defaults)
  const hasLegacyGeneratedDefaults =
    (existing.agents || existing.categories) && !existing._install_defaults

  if (hasLegacyGeneratedDefaults) {
    // Strip generated defaults, keep only user overrides
    const migrated = stripGeneratedDefaults(existing)
    return {
      ...migrated,
      ...generated,
    }
  }

  // Normal merge for snapshot-based configs
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
