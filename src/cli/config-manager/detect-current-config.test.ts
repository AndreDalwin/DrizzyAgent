import { beforeEach, describe, expect, mock, test } from "bun:test"

const OPEN_CODE_CONFIG_PATH = "/tmp/opencode.json"
const DRIZZY_CONFIG_PATH = "/tmp/drizzy-agent.json"
const CONFIG_DIR = "/tmp"

let hasDrizzyConfig = true
let drizzyConfigContent = "{}"
let openCodeConfig: Record<string, unknown> | null = null

mock.module("node:fs", () => ({
  existsSync: (filePath: string) => filePath === DRIZZY_CONFIG_PATH ? hasDrizzyConfig : false,
  readFileSync: (filePath: string) => {
    if (filePath === DRIZZY_CONFIG_PATH) {
      return drizzyConfigContent
    }

    throw new Error(`Unexpected file read: ${filePath}`)
  },
}))

mock.module("../../shared", () => ({
  parseJsonc: (content: string) => JSON.parse(content) as Record<string, unknown>,
}))

mock.module("./config-context", () => ({
  getConfigDir: () => CONFIG_DIR,
  getDrizzyConfigPath: () => DRIZZY_CONFIG_PATH,
}))

mock.module("./opencode-config-format", () => ({
  detectConfigFormat: () => ({ format: "json" as const, path: OPEN_CODE_CONFIG_PATH }),
}))

mock.module("./parse-opencode-config-file", () => ({
  parseOpenCodeConfigFileWithError: () => ({ config: openCodeConfig, error: undefined }),
}))

async function loadDetectCurrentConfig(): Promise<() => import("../types").DetectedConfig> {
  const mod = await import("./detect-current-config")
  return mod.detectCurrentConfig
}

describe("detectCurrentConfig", () => {
  beforeEach(() => {
    hasDrizzyConfig = true
    openCodeConfig = {
      plugin: ["drizzy-agent@latest"],
    }
    drizzyConfigContent = JSON.stringify({
      agents: {
        coder: { model: "openai/gpt-5.4", variant: "medium" },
        planner: { model: "kimi-for-coding/k2p5" },
      },
      categories: {
        quick: { model: "opencode/glm-4.7-free" },
        "unspecified-high": { model: "openai/gpt-5.4", variant: "medium" },
      },
    })
  })

  test("detects provider availability from drizzy config instead of stale Claude defaults", async () => {
    const detectCurrentConfig = await loadDetectCurrentConfig()

    const result = detectCurrentConfig()

    expect(result).toMatchObject({
      isInstalled: true,
      hasClaude: false,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: true,
    })
  })

  test("detects Gemini from drizzy config even without provider.google in opencode config", async () => {
    drizzyConfigContent = JSON.stringify({
      agents: {
        coder: { model: "google/gemini-3.1-pro" },
      },
      categories: {
        quick: { model: "google/gemini-3-flash" },
        "unspecified-high": { model: "google/gemini-3.1-pro" },
      },
    })

    const detectCurrentConfig = await loadDetectCurrentConfig()

    const result = detectCurrentConfig()

    expect(result.hasGemini).toBe(true)
    expect(result.hasClaude).toBe(false)
  })

  test("infers Claude max20 from generated unspecified-high category", async () => {
    drizzyConfigContent = JSON.stringify({
      agents: {
        coder: { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
      categories: {
        quick: { model: "anthropic/claude-haiku-4-5" },
        "unspecified-high": { model: "anthropic/claude-opus-4-6", variant: "max" },
      },
    })

    const detectCurrentConfig = await loadDetectCurrentConfig()

    const result = detectCurrentConfig()

    expect(result.hasClaude).toBe(true)
    expect(result.isMax20).toBe(true)
  })
})
