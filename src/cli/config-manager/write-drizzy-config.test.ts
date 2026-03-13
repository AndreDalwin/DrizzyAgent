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

    const savedConfig = parseJsonc<Record<string, unknown>>(readFileSync(testConfigPath, "utf-8"))
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

  describe("legacy generated config adoption policy", () => {
    it.todo("treats rerun install as the only automatic file-mutating adoption path", () => {})

    it.todo("creates a backup before stripping legacy generated model pins during adoption", () => {})

    it.todo(
      "strips only generated-territory model and variant fields that exactly match current generated defaults",
      () => {}
    )

    it.todo(
      "aborts adoption, prints a mismatch report, and leaves the file untouched when any generated-territory model or variant differs",
      () => {}
    )
  })
})
