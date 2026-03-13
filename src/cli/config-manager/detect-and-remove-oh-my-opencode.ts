import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { getOmoConfigPaths, type OmoConfigPaths } from "./oh-my-opencode-paths"
import { parseOpenCodeConfigFileWithError } from "./parse-opencode-config-file"

export interface OmoDetectionResult {
  isInstalled: boolean
  configPath?: string
  pluginEntry?: string
  openCodeConfigPath?: string
}

const OMO_PACKAGE_NAMES = ["oh-my-opencode", "oh-my-openagent"]

/**
 * Detects if oh-my-opencode (or oh-my-openagent) is installed
 * Checks for:
 * 1. Plugin entry in opencode.json/opencode.jsonc
 * 2. Config file at oh-my-opencode.json
 */
export function detectOhMyOpencode(paths: OmoConfigPaths = getOmoConfigPaths()): OmoDetectionResult {
  const omoConfigPath = join(paths.configDir, "oh-my-opencode.json")
  const omoConfigPathC = join(paths.configDir, "oh-my-opencode.jsonc")

  // Check for config file
  const configExists = existsSync(omoConfigPath) || existsSync(omoConfigPathC)

  // Check opencode.json for plugin entry
  let openCodeConfigPath: string | undefined
  let pluginEntry: string | undefined

  if (existsSync(paths.configJsonc)) {
    openCodeConfigPath = paths.configJsonc
  } else if (existsSync(paths.configJson)) {
    openCodeConfigPath = paths.configJson
  }

  if (openCodeConfigPath) {
    const parseResult = parseOpenCodeConfigFileWithError(openCodeConfigPath)
    if (parseResult.config) {
      const plugins = parseResult.config.plugin ?? []
      for (const plugin of plugins) {
        for (const omoName of OMO_PACKAGE_NAMES) {
          if (plugin === omoName || plugin.startsWith(`${omoName}@`)) {
            pluginEntry = plugin
            break
          }
        }
        if (pluginEntry) break
      }
    }
  }

  const isInstalled = configExists || pluginEntry !== undefined

  return {
    isInstalled,
    configPath: configExists
      ? existsSync(omoConfigPath)
        ? omoConfigPath
        : omoConfigPathC
      : undefined,
    pluginEntry,
    openCodeConfigPath,
  }
}

/**
 * Removes oh-my-opencode plugin entry from opencode.json/opencode.jsonc
 */
export function removeOhMyOpencodeFromOpenCodeConfig(
  paths: OmoConfigPaths = getOmoConfigPaths(),
): {
  success: boolean
  error?: string
} {
  let configPath: string

  if (existsSync(paths.configJsonc)) {
    configPath = paths.configJsonc
  } else if (existsSync(paths.configJson)) {
    configPath = paths.configJson
  } else {
    return { success: true } // No config to modify
  }

  try {
    const parseResult = parseOpenCodeConfigFileWithError(configPath)
    if (!parseResult.config) {
      return { success: true } // Can't parse, assume no plugin
    }

    const config = parseResult.config
    const plugins = config.plugin ?? []
    const originalLength = plugins.length

    // Filter out oh-my-opencode entries
    const filteredPlugins = plugins.filter((plugin) => {
      for (const omoName of OMO_PACKAGE_NAMES) {
        if (plugin === omoName || plugin.startsWith(`${omoName}@`)) {
          return false
        }
      }
      return true
    })

    if (filteredPlugins.length === originalLength) {
      return { success: true } // No oh-my-opencode plugin found
    }

    config.plugin = filteredPlugins

    // Write back based on format
    const isJsonc = configPath.endsWith(".jsonc")
    if (isJsonc) {
      const content = readFileSync(configPath, "utf-8")
      const pluginArrayRegex = /"plugin"\s*:\s*\[([\s\S]*?)\]/
      const match = content.match(pluginArrayRegex)

      if (match) {
        if (filteredPlugins.length === 0) {
          // Remove the entire plugin array if empty
          const newContent = content.replace(/,?\s*"plugin"\s*:\s*\[[\s\S]*?\]/, "")
          // Clean up any trailing commas before the closing brace
          const cleanedContent = newContent.replace(/,(\s*\})/g, "$1")
          // Write the cleaned content
          writeFileSync(configPath, cleanedContent)
        } else {
          const formattedPlugins = filteredPlugins.map((p) => `"${p}"`).join(",\n    ")
          const newContent = content.replace(pluginArrayRegex, `"plugin": [\n    ${formattedPlugins}\n  ]`)
          writeFileSync(configPath, newContent)
        }
      } else {
        // Fallback: write as JSON
        writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
      }
    } else {
      // JSON format
      writeFileSync(configPath, JSON.stringify(config, null, 2) + "\n")
    }

    return { success: true }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

/**
 * Removes oh-my-opencode config files
 */
export function removeOhMyOpencodeConfig(paths: OmoConfigPaths = getOmoConfigPaths()): {
  success: boolean
  removedPaths: string[]
  error?: string
} {
  const configPaths = [
    join(paths.configDir, "oh-my-opencode.json"),
    join(paths.configDir, "oh-my-opencode.jsonc"),
  ]

  const removedPaths: string[] = []

  for (const configPath of configPaths) {
    if (existsSync(configPath)) {
      try {
        unlinkSync(configPath)
        removedPaths.push(configPath)
      } catch (err) {
        return {
          success: false,
          removedPaths,
          error: `Failed to remove ${configPath}: ${err instanceof Error ? err.message : String(err)}`,
        }
      }
    }
  }

  return { success: true, removedPaths }
}
