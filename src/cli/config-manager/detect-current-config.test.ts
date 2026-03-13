import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import { mkdtempSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { detectCurrentConfig } from "./detect-current-config"

const OPEN_CODE_CONFIG_PATH = "/tmp/opencode.json"
let drizzyConfigPath = "/tmp/drizzy-agent.json"
let configDir = "/tmp"
const tempDirs: string[] = []

let openCodeConfig: Record<string, unknown> | null = null

function createDependencies() {
  return {
    detectConfigFormat: () => ({ format: "json" as const, path: OPEN_CODE_CONFIG_PATH }),
    getConfigDir: () => configDir,
    getDrizzyConfigPath: () => drizzyConfigPath,
    parseJsonc: <T>(content: string) => JSON.parse(content) as T,
    parseOpenCodeConfigFileWithError: () => ({
      config: openCodeConfig,
      error: undefined,
    }),
  }
}

describe("detectCurrentConfig", () => {
  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop()
      if (dir) {
        rmSync(dir, { recursive: true, force: true })
      }
    }
  })

  beforeEach(() => {
    const tempDir = mkdtempSync(join(tmpdir(), "drizzy-config-test-"))
    tempDirs.push(tempDir)
    configDir = tempDir
    drizzyConfigPath = join(tempDir, "drizzy-agent.json")

    openCodeConfig = {
      plugin: ["drizzy-agent@latest"],
    }
  })

  test("detects provider availability from snapshot-based config", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      _install_defaults: {
        snapshot_version: 1,
        providers: {
          claude: "max20",
          openai: true,
          gemini: false,
          copilot: true,
          opencode_zen: false,
          zai_coding_plan: false,
          kimi_for_coding: false,
        },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.isInstalled).toBe(true)
    expect(result.hasClaude).toBe(true)
    expect(result.isMax20).toBe(true)
    expect(result.hasOpenAI).toBe(true)
    expect(result.hasGemini).toBe(false)
    expect(result.hasCopilot).toBe(true)
    expect(result.hasOpencodeZen).toBe(false)
    expect(result.hasZaiCodingPlan).toBe(false)
    expect(result.hasKimiForCoding).toBe(false)
  })

  test("detects provider availability from legacy config (no _install_defaults)", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      agents: {
        coder: { model: "openai/gpt-5.4", variant: "medium" },
        planner: { model: "kimi-for-coding/k2p5" },
      },
      categories: {
        quick: { model: "opencode/glm-4.7-free" },
        "unspecified-high": { model: "openai/gpt-5.4", variant: "medium" },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.isInstalled).toBe(true)
    expect(result.hasClaude).toBe(false)
    expect(result.isMax20).toBe(false)
    expect(result.hasOpenAI).toBe(true)
    expect(result.hasGemini).toBe(false)
    expect(result.hasCopilot).toBe(false)
    expect(result.hasOpencodeZen).toBe(true)
    expect(result.hasZaiCodingPlan).toBe(false)
    expect(result.hasKimiForCoding).toBe(true)
  })

  test("detects Gemini from legacy config with google/ models", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      agents: {
        coder: { model: "google/gemini-3.1-pro" },
      },
      categories: {
        quick: { model: "google/gemini-3-flash" },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.hasGemini).toBe(true)
    expect(result.hasClaude).toBe(false)
    expect(result.hasOpenAI).toBe(false)
  })

  test("infers isMax20 from legacy config with variant: max", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      agents: {
        coder: { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
      categories: {
        "unspecified-high": { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.hasClaude).toBe(true)
    expect(result.isMax20).toBe(true)
  })

  test("detects Copilot from github-copilot/ models", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      agents: {
        coder: { model: "github-copilot/claude-opus-4.6" },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.hasCopilot).toBe(true)
    expect(result.hasClaude).toBe(false)
  })

  test("detects ZAI from zai-coding-plan/ models", () => {
    writeFileSync(drizzyConfigPath, JSON.stringify({
      agents: {
        librarian: { model: "zai-coding-plan/glm-4.7" },
      },
    }))

    const result = detectCurrentConfig(createDependencies())

    expect(result.hasZaiCodingPlan).toBe(true)
  })

  test("returns defaults when no drizzy config exists", () => {
    drizzyConfigPath = join(configDir, "nonexistent.json")

    const result = detectCurrentConfig(createDependencies())

    expect(result.hasClaude).toBe(false)
    expect(result.isMax20).toBe(false)
    expect(result.hasOpenAI).toBe(true)
    expect(result.hasGemini).toBe(false)
    expect(result.hasCopilot).toBe(false)
    expect(result.hasOpencodeZen).toBe(true)
    expect(result.hasZaiCodingPlan).toBe(false)
    expect(result.hasKimiForCoding).toBe(false)
  })
})
