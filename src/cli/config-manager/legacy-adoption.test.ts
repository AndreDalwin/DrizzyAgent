/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadConfigFromPath } from "../../plugin-config"
import { parseJsonc } from "../../shared/jsonc-parser"
import { generateModelConfig } from "../model-fallback"
import type { InstallConfig } from "../types"
import { resetConfigContext } from "./config-context"
import { generateDrizzyConfig } from "./generate-drizzy-config"
import { writeDrizzyConfig } from "./write-drizzy-config"

const installConfig: InstallConfig = {
  hasClaude: true,
  isMax20: true,
  hasOpenAI: true,
  hasGemini: true,
  hasCopilot: false,
  hasOpencodeZen: false,
  hasZaiCodingPlan: false,
  hasKimiForCoding: false,
}

function createPureLegacyConfig(): Record<string, unknown> {
  return structuredClone(generateModelConfig(installConfig))
}

function createMixedLegacyConfig(): Record<string, unknown> {
  const config = createPureLegacyConfig()
  ;(config.agents as Record<string, unknown>).coder = {
    ...((config.agents as Record<string, unknown>).coder as Record<string, unknown>),
    prompt: "Keep my prompt",
  }
  config.disabled_hooks = ["comment-checker"]
  return config
}

function createAmbiguousLegacyConfig(): Record<string, unknown> {
  const config = createMixedLegacyConfig()
  ;((config.categories as Record<string, unknown>)["unspecified-high"] as Record<string, unknown>).model =
    "custom/provider-model"
  return config
}

function createAlreadyAdoptedConfig(): Record<string, unknown> {
  return {
    ...generateDrizzyConfig(installConfig),
    disabled_hooks: ["comment-checker"],
  }
}

function replaceStringValues(value: unknown, from: string, to: string): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => replaceStringValues(entry, from, to))
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
        key,
        replaceStringValues(entry, from, to),
      ]),
    )
  }

  return value === from ? to : value
}

function createRuntimeLegacyConfig(): Record<string, unknown> {
  return replaceStringValues(
    createAmbiguousLegacyConfig(),
    "anthropic/claude-sonnet-4-5",
    "anthropic/claude-sonnet-4-6",
  ) as Record<string, unknown>
}

function readConfig(configPath: string): Record<string, unknown> {
  return parseJsonc<Record<string, unknown>>(readFileSync(configPath, "utf-8"))
}

function listBackupFiles(configDir: string): string[] {
  return readdirSync(configDir).filter((entry) => entry.includes("drizzy-agent.json.bak."))
}

describe("legacy adoption regression", () => {
  let testConfigDir = ""
  let testConfigPath = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omo-legacy-adoption-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    testConfigPath = join(testConfigDir, "drizzy-agent.json")
    mkdirSync(testConfigDir, { recursive: true })
    process.env.OPENCODE_CONFIG_DIR = testConfigDir
    resetConfigContext()
  })

  afterEach(() => {
    rmSync(testConfigDir, { recursive: true, force: true })
    resetConfigContext()
    delete process.env.OPENCODE_CONFIG_DIR
  })

  it("adopts pure generated legacy configs cleanly and creates a backup", () => {
    const legacyConfig = createPureLegacyConfig()
    const original = JSON.stringify(legacyConfig, null, 2) + "\n"
    writeFileSync(testConfigPath, original, "utf-8")

    const result = writeDrizzyConfig(installConfig)

    expect(result).toEqual({ success: true, configPath: testConfigPath })
    expect(readConfig(testConfigPath)).toEqual(generateDrizzyConfig(installConfig))
    const backups = listBackupFiles(testConfigDir)
    expect(backups).toHaveLength(1)
    expect(readFileSync(join(testConfigDir, backups[0]), "utf-8")).toBe(original)
  })

  it("strips only matching generated territory from mixed legacy configs", () => {
    writeFileSync(testConfigPath, JSON.stringify(createMixedLegacyConfig(), null, 2) + "\n", "utf-8")

    const result = writeDrizzyConfig(installConfig)
    const saved = readConfig(testConfigPath)
    const savedAgents = (saved.agents ?? {}) as Record<string, unknown>

    expect(result.success).toBe(true)
    expect(savedAgents.coder).toEqual({ prompt: "Keep my prompt" })
    expect(saved.disabled_hooks).toEqual(["comment-checker"])
    expect(saved._install_defaults).toEqual(generateDrizzyConfig(installConfig)._install_defaults)
    expect(saved.categories).toBeUndefined()
  })

  it("aborts ambiguous legacy adoption with a mismatch report and no writes", () => {
    const legacyConfig = createAmbiguousLegacyConfig()
    const original = JSON.stringify(legacyConfig, null, 2) + "\n"
    writeFileSync(testConfigPath, original, "utf-8")

    const result = writeDrizzyConfig(installConfig)

    expect(result.success).toBe(false)
    expect(result.error).toContain("categories.unspecified-high.model")
    expect(readFileSync(testConfigPath, "utf-8")).toBe(original)
    expect(listBackupFiles(testConfigDir)).toHaveLength(0)
  })

  it("keeps repeat rerun install idempotent after adoption", () => {
    writeFileSync(testConfigPath, JSON.stringify(createPureLegacyConfig(), null, 2) + "\n", "utf-8")

    const firstResult = writeDrizzyConfig(installConfig)
    const firstSaved = readFileSync(testConfigPath, "utf-8")
    const secondResult = writeDrizzyConfig(installConfig)

    expect(firstResult.success).toBe(true)
    expect(secondResult.success).toBe(true)
    expect(readFileSync(testConfigPath, "utf-8")).toBe(firstSaved)
    expect(listBackupFiles(testConfigDir)).toHaveLength(1)
  })

  it("keeps already adopted configs stable on rerun install", () => {
    writeFileSync(testConfigPath, JSON.stringify(createAlreadyAdoptedConfig(), null, 2) + "\n", "utf-8")

    const result = writeDrizzyConfig(installConfig)

    expect(result.success).toBe(true)
    expect(readConfig(testConfigPath)).toEqual(createAlreadyAdoptedConfig())
    expect(listBackupFiles(testConfigDir)).toHaveLength(0)
  })

  it("keeps runtime loading read-only for non-adopted legacy configs", () => {
    const legacyConfig = createRuntimeLegacyConfig()
    writeFileSync(testConfigPath, JSON.stringify(legacyConfig, null, 2) + "\n", "utf-8")

    const loaded = loadConfigFromPath(testConfigPath, {})
    const savedAfterLoad = readConfig(testConfigPath)

    expect(listBackupFiles(testConfigDir)).toHaveLength(0)
    expect(loaded?.categories?.["unspecified-high"]?.model).toBe("custom/provider-model")
    expect(((savedAfterLoad.agents ?? {}) as Record<string, unknown>).coder).toBeDefined()
    expect(((savedAfterLoad.categories ?? {}) as Record<string, unknown>)["unspecified-high"]).toBeDefined()
  })
})
