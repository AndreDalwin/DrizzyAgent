/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

import { resolveCategoryConfig } from "./plugin-handlers/category-config-resolver"
import { loadPluginConfig } from "./plugin-config"
import { clearConfigLoadErrors, getConfigLoadErrors } from "./shared"

class PluginConfigRuntimeFixture {
  readonly rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "drizzy-agent-runtime-config-"))
  readonly userConfigDir = path.join(this.rootDir, "user-config")
  readonly projectDir = path.join(this.rootDir, "project")

  constructor() {
    fs.mkdirSync(this.userConfigDir, { recursive: true })
    fs.mkdirSync(path.join(this.projectDir, ".opencode"), { recursive: true })
  }

  writeUserConfig(config: Record<string, unknown>): void {
    this.writeConfig(path.join(this.userConfigDir, "drizzy-agent.json"), config)
  }

  writeProjectConfig(config: Record<string, unknown>): void {
    this.writeConfig(path.join(this.projectDir, ".opencode", "drizzy-agent.json"), config)
  }

  load() {
    process.env.OPENCODE_CONFIG_DIR = this.userConfigDir
    clearConfigLoadErrors()
    return loadPluginConfig(this.projectDir, {})
  }

  cleanup(): void {
    clearConfigLoadErrors()
    fs.rmSync(this.rootDir, { recursive: true, force: true })
  }

  private writeConfig(filePath: string, config: Record<string, unknown>): void {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  }
}

function createSnapshot(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    snapshot_version: 1,
    providers: {
      claude: "no",
      openai: false,
      gemini: false,
      copilot: false,
      opencode_zen: false,
      zai_coding_plan: false,
      kimi_for_coding: false,
      ...overrides,
    },
  }
}

const fixtures: PluginConfigRuntimeFixture[] = []
const originalOpenCodeConfigDir = process.env.OPENCODE_CONFIG_DIR

function createFixture(): PluginConfigRuntimeFixture {
  const fixture = new PluginConfigRuntimeFixture()
  fixtures.push(fixture)
  return fixture
}

afterEach(() => {
  process.env.OPENCODE_CONFIG_DIR = originalOpenCodeConfigDir
  while (fixtures.length > 0) {
    fixtures.pop()?.cleanup()
  }
})

describe("loadPluginConfig runtime precedence", () => {
  test("applies project, user, computed, and built-in precedence at runtime", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createSnapshot({ openai: true }),
      categories: {
        deep: {
          variant: "high",
        },
      },
    })
    fixture.writeProjectConfig({
      categories: {
        deep: {
          model: "project/custom-deep",
        },
      },
    })

    const config = fixture.load()
    const resolvedQuick = resolveCategoryConfig("quick", config.categories)

    expect(config.categories?.deep).toEqual({
      model: "project/custom-deep",
      variant: "high",
    })
    expect(resolvedQuick).toEqual({
      model: "openai/gpt-5.4",
      variant: "low",
    })
    expect(resolvedQuick?.model).not.toBe("anthropic/claude-haiku-4-5")
    expect(getConfigLoadErrors()).toHaveLength(0)
  })

  test("returns omitted overrides to computed snapshot defaults", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createSnapshot({ openai: true }),
      categories: {
        deep: {
          model: "user/custom-deep",
          temperature: 0.4,
        },
      },
    })

    const explicitOverrideConfig = fixture.load()
    expect(explicitOverrideConfig.categories?.deep).toEqual({
      model: "user/custom-deep",
      variant: "medium",
      temperature: 0.4,
    })

    fixture.writeUserConfig({
      _install_defaults: createSnapshot({ openai: true }),
      categories: {
        deep: {
          temperature: 0.4,
        },
      },
    })

    const revertedConfig = fixture.load()

    expect(revertedConfig.categories?.deep).toEqual({
      model: "openai/gpt-5.4",
      variant: "medium",
      temperature: 0.4,
    })
    expect(getConfigLoadErrors()).toHaveLength(0)
  })
})
