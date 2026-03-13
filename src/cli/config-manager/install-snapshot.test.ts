/// <reference types="bun-types" />

import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdirSync, readFileSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { parseJsonc } from "../../shared/jsonc-parser"
import type { InstallConfig } from "../types"
import { resetConfigContext } from "./config-context"
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

describe("fresh install snapshot persistence", () => {
  let testConfigDir = ""
  let testConfigPath = ""

  beforeEach(() => {
    testConfigDir = join(tmpdir(), `omo-install-snapshot-${Date.now()}-${Math.random().toString(36).slice(2)}`)
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

  test("writes only install-owned snapshot fields on a fresh install", () => {
    const result = writeDrizzyConfig(installConfig)

    expect(result.success).toBe(true)

    const savedConfig = parseJsonc<Record<string, unknown>>(readFileSync(testConfigPath, "utf-8"))

    expect(Object.keys(savedConfig).sort()).toEqual(["$schema", "_install_defaults"])
    expect(savedConfig._install_defaults).toEqual({
      snapshot_version: 1,
      providers: {
        claude: "max20",
        openai: true,
        gemini: true,
        copilot: false,
        opencode_zen: false,
        zai_coding_plan: false,
        kimi_for_coding: false,
      },
    })
    expect(savedConfig.agents).toBeUndefined()
    expect(savedConfig.categories).toBeUndefined()
  })
})
