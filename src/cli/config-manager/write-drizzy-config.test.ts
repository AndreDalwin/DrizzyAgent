/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { parseJsonc } from "../../shared/jsonc-parser"
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

describe("writeDrizzyConfig", () => {
  let testConfigDir = ""
  let testConfigPath = ""

  function readSavedConfig(): Record<string, unknown> {
    return parseJsonc<Record<string, unknown>>(readFileSync(testConfigPath, "utf-8"))
  }

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omo-write-config-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  it("refreshes generated defaults while preserving user-owned keys", () => {
    // given
    const existingConfig = {
      $schema: "https://raw.githubusercontent.com/code-yeongyu/drizzy-agent/master/assets/drizzy-agent.schema.json",
      agents: {
        coder: {
          effort: "high",
        },
      },
      disabled_hooks: ["comment-checker"],
    }
    writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2) + "\n", "utf-8")

    const generatedDefaults = generateDrizzyConfig(installConfig)

    // when
    const result = writeDrizzyConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = readSavedConfig()
    const savedCoder = ((savedConfig as any).agents?.coder) as Record<string, unknown> | undefined
    expect(savedCoder?.effort).toBe("high")
    // Schema and install defaults should be generated anew
    expect(savedConfig.$schema).toBe(generatedDefaults.$schema)
    expect(savedConfig._install_defaults).toEqual(generatedDefaults._install_defaults)
    expect(savedConfig.disabled_hooks).toEqual(["comment-checker"])

    for (const defaultKey of Object.keys(generatedDefaults)) {
      expect(savedConfig).toHaveProperty(defaultKey)
    }
  })

  it("replaces install-owned snapshot fields on rerun without touching explicit overrides", () => {
    // given
    const existingConfig = {
      _install_defaults: {
        snapshot_version: 0,
        providers: {
          claude: "yes",
          openai: false,
          gemini: false,
        },
        legacy_generated_defaults: true,
      },
      agents: {
        coder: {
          model: "custom-model",
        },
      },
    }
    writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2) + "\n", "utf-8")

    const generatedDefaults = generateDrizzyConfig(installConfig)

    // when
    const result = writeDrizzyConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = readSavedConfig()
    expect(savedConfig._install_defaults).toEqual(generatedDefaults._install_defaults)
    expect(((savedConfig as any).agents?.coder as Record<string, unknown> | undefined)?.model).toBe(
      "custom-model"
    )
  })

  it("preserves explicit user overrides across reruns while keeping snapshot-only install fields current", () => {
    // given
    const existingConfig = {
      $schema: "https://example.com/old-schema.json",
      _install_defaults: {
        snapshot_version: 0,
        providers: {
          claude: "yes",
          openai: false,
          gemini: false,
        },
      },
      agents: {
        coder: {
          model: "claude-opus-4",
        },
      },
      categories: {
        deep: {
          model: "o3-mini",
        },
      },
      disabled_hooks: ["comment-checker"],
    }
    writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2) + "\n", "utf-8")

    const generatedDefaults = generateDrizzyConfig(installConfig)

    // when
    const result = writeDrizzyConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = readSavedConfig()
    expect(savedConfig.$schema).toBe(generatedDefaults.$schema)
    expect(savedConfig._install_defaults).toEqual(generatedDefaults._install_defaults)
    expect(savedConfig.agents).toEqual(existingConfig.agents)
    expect(savedConfig.categories).toEqual(existingConfig.categories)
    expect(savedConfig.disabled_hooks).toEqual(existingConfig.disabled_hooks)
  })

  it("strips legacy generated defaults but preserves user overrides on upgrade", () => {
    // given: legacy config with generated defaults (only model/variant) mixed with user overrides
    const existingConfig = {
      $schema: "https://example.com/old-schema.json",
      // No _install_defaults = legacy config
      agents: {
        // This is a generated default (only model/variant) - should be stripped
        coder: { model: "anthropic/claude-opus-4-6", variant: "max" },
        // This is a generated default - should be stripped
        oracle: { model: "openai/gpt-5.4" },
        // This is a user override (has effort) - should be preserved
        librarian: { model: "zai-coding-plan/glm-4.7", effort: "high" },
      },
      categories: {
        // Generated default - should be stripped
        quick: { model: "anthropic/claude-haiku-4-5" },
        // User override (has temperature) - should be preserved
        deep: { model: "o3-mini", temperature: 0.5 },
      },
      disabled_hooks: ["comment-checker"],
    }
    writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2) + "\n", "utf-8")

    const generatedDefaults = generateDrizzyConfig(installConfig)

    // when
    const result = writeDrizzyConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = readSavedConfig()
    // Should now have _install_defaults
    expect(savedConfig._install_defaults).toEqual(generatedDefaults._install_defaults)
    // Generated agents stripped, but user overrides preserved
    expect(savedConfig.agents).toEqual({
      librarian: { model: "zai-coding-plan/glm-4.7", effort: "high" },
    })
    // Generated categories stripped, but user overrides preserved
    expect(savedConfig.categories).toEqual({
      deep: { model: "o3-mini", temperature: 0.5 },
    })
    // Other keys preserved
    expect(savedConfig.disabled_hooks).toEqual(["comment-checker"])
  })

  it("removes agents/categories entirely if only generated defaults exist", () => {
    // given: legacy config with ONLY generated defaults
    const existingConfig = {
      $schema: "https://example.com/old-schema.json",
      agents: {
        coder: { model: "anthropic/claude-opus-4-6" },
        oracle: { model: "openai/gpt-5.4" },
      },
      categories: {
        quick: { model: "anthropic/claude-haiku-4-5" },
        deep: { model: "openai/gpt-5.4" },
      },
    }
    writeFileSync(testConfigPath, JSON.stringify(existingConfig, null, 2) + "\n", "utf-8")

    const generatedDefaults = generateDrizzyConfig(installConfig)

    // when
    const result = writeDrizzyConfig(installConfig)

    // then
    expect(result.success).toBe(true)

    const savedConfig = readSavedConfig()
    expect(savedConfig._install_defaults).toEqual(generatedDefaults._install_defaults)
    // All generated content stripped
    expect(savedConfig.agents).toBeUndefined()
    expect(savedConfig.categories).toBeUndefined()
  })
})
