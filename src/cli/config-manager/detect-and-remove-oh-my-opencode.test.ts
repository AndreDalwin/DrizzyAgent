import { describe, expect, it, beforeEach, afterEach } from "bun:test"
import { existsSync, mkdirSync, rmSync, writeFileSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import {
  detectOhMyOpencode,
  removeOhMyOpencodeFromOpenCodeConfig,
  removeOhMyOpencodeConfig,
} from "./detect-and-remove-oh-my-opencode"
import type { OmoConfigPaths } from "./oh-my-opencode-paths"

describe("detect-and-remove-oh-my-opencode", () => {
  let tempDir: string
  let testPaths: OmoConfigPaths

  beforeEach(() => {
    tempDir = join(tmpdir(), `drizzy-test-${Date.now()}-${Math.random().toString(36).slice(2)}`)
    mkdirSync(tempDir, { recursive: true })
    testPaths = {
      configDir: tempDir,
      configJson: join(tempDir, "opencode.json"),
      configJsonc: join(tempDir, "opencode.jsonc"),
    }
  })

  afterEach(() => {
    if (existsSync(tempDir)) {
      rmSync(tempDir, { recursive: true, force: true })
    }
  })

  describe("#detectOhMyOpencode", () => {
    it("returns not installed when no omo files exist", () => {
      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(false)
      expect(result.configPath).toBeUndefined()
      expect(result.pluginEntry).toBeUndefined()
    })

    it("detects oh-my-opencode.json config file", () => {
      const configPath = join(tempDir, "oh-my-opencode.json")
      writeFileSync(configPath, JSON.stringify({ version: "1.0.0" }))

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.configPath).toBe(configPath)
    })

    it("detects oh-my-opencode.jsonc config file", () => {
      const configPath = join(tempDir, "oh-my-opencode.jsonc")
      writeFileSync(configPath, JSON.stringify({ version: "1.0.0" }))

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.configPath).toBe(configPath)
    })

    it("detects oh-my-opencode plugin in opencode.json", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-opencode@3.11.2"] }),
      )

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.pluginEntry).toBe("oh-my-opencode@3.11.2")
      expect(result.openCodeConfigPath).toBe(openCodeConfigPath)
    })

    it("detects oh-my-openagent plugin in opencode.json", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-openagent@3.11.2"] }),
      )

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.pluginEntry).toBe("oh-my-openagent@3.11.2")
    })

    it("detects bare plugin name without version", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-opencode"] }),
      )

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.pluginEntry).toBe("oh-my-opencode")
    })

    it("detects both config and plugin", () => {
      const configPath = join(tempDir, "oh-my-opencode.json")
      writeFileSync(configPath, JSON.stringify({ version: "1.0.0" }))

      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-opencode@3.11.2"] }),
      )

      const result = detectOhMyOpencode(testPaths)

      expect(result.isInstalled).toBe(true)
      expect(result.configPath).toBe(configPath)
      expect(result.pluginEntry).toBe("oh-my-opencode@3.11.2")
    })
  })

  describe("#removeOhMyOpencodeFromOpenCodeConfig", () => {
    it("succeeds when no opencode config exists", () => {
      const result = removeOhMyOpencodeFromOpenCodeConfig(testPaths)

      expect(result.success).toBe(true)
    })

    it("removes oh-my-opencode plugin from opencode.json", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-opencode@3.11.2", "other-plugin"], setting: true }, null, 2),
      )

      const result = removeOhMyOpencodeFromOpenCodeConfig(testPaths)

      expect(result.success).toBe(true)
      const updatedConfig = JSON.parse(readFileSync(openCodeConfigPath, "utf-8"))
      expect(updatedConfig.plugin).toEqual(["other-plugin"])
      expect(updatedConfig.setting).toBe(true)
    })

    it("removes oh-my-openagent plugin from opencode.json", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-openagent", "other-plugin"] }),
      )

      const result = removeOhMyOpencodeFromOpenCodeConfig(testPaths)

      expect(result.success).toBe(true)
      const updatedConfig = JSON.parse(readFileSync(openCodeConfigPath, "utf-8"))
      expect(updatedConfig.plugin).toEqual(["other-plugin"])
    })

    it("handles JSONC format with comments", () => {
      const openCodeConfigPath = join(tempDir, "opencode.jsonc")
      writeFileSync(
        openCodeConfigPath,
        `{
  // This is a comment
  "plugin": [
    "oh-my-opencode@3.11.2",
    "other-plugin"
  ],
  "setting": true
}`,
      )

      const result = removeOhMyOpencodeFromOpenCodeConfig(testPaths)

      expect(result.success).toBe(true)
      const updatedContent = readFileSync(openCodeConfigPath, "utf-8")
      expect(updatedContent).toContain("other-plugin")
      expect(updatedContent).not.toContain("oh-my-opencode")
      expect(updatedContent).toContain("// This is a comment")
    })

    it("removes entire plugin array if it becomes empty", () => {
      const openCodeConfigPath = join(tempDir, "opencode.json")
      writeFileSync(
        openCodeConfigPath,
        JSON.stringify({ plugin: ["oh-my-opencode@3.11.2"], setting: true }, null, 2),
      )

      const result = removeOhMyOpencodeFromOpenCodeConfig(testPaths)

      expect(result.success).toBe(true)
      const updatedConfig = JSON.parse(readFileSync(openCodeConfigPath, "utf-8"))
      expect(updatedConfig.plugin).toEqual([])
      expect(updatedConfig.setting).toBe(true)
    })
  })

  describe("#removeOhMyOpencodeConfig", () => {
    it("succeeds when no config files exist", () => {
      const result = removeOhMyOpencodeConfig(testPaths)

      expect(result.success).toBe(true)
      expect(result.removedPaths).toEqual([])
    })

    it("removes oh-my-opencode.json", () => {
      const configPath = join(tempDir, "oh-my-opencode.json")
      writeFileSync(configPath, JSON.stringify({ version: "1.0.0" }))

      const result = removeOhMyOpencodeConfig(testPaths)

      expect(result.success).toBe(true)
      expect(result.removedPaths).toContain(configPath)
      expect(existsSync(configPath)).toBe(false)
    })

    it("removes oh-my-opencode.jsonc", () => {
      const configPath = join(tempDir, "oh-my-opencode.jsonc")
      writeFileSync(configPath, JSON.stringify({ version: "1.0.0" }))

      const result = removeOhMyOpencodeConfig(testPaths)

      expect(result.success).toBe(true)
      expect(result.removedPaths).toContain(configPath)
      expect(existsSync(configPath)).toBe(false)
    })

    it("removes both config files", () => {
      const jsonPath = join(tempDir, "oh-my-opencode.json")
      const jsoncPath = join(tempDir, "oh-my-opencode.jsonc")
      writeFileSync(jsonPath, JSON.stringify({ version: "1.0.0" }))
      writeFileSync(jsoncPath, JSON.stringify({ version: "1.0.0" }))

      const result = removeOhMyOpencodeConfig(testPaths)

      expect(result.success).toBe(true)
      expect(result.removedPaths).toHaveLength(2)
      expect(existsSync(jsonPath)).toBe(false)
      expect(existsSync(jsoncPath)).toBe(false)
    })
  })
})
