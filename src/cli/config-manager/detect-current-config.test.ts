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
  })

})
