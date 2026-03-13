/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import * as fs from "fs"
import * as os from "os"
import * as path from "path"

import { resolveCategoryConfig } from "./plugin-handlers/category-config-resolver"
import { loadPluginConfig } from "./plugin-config"
import { clearConfigLoadErrors, getConfigLoadErrors } from "./shared"

class PluginConfigFixture {
  readonly rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "drizzy-agent-plugin-config-"))
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

const fixtures: PluginConfigFixture[] = []
const originalOpenCodeConfigDir = process.env.OPENCODE_CONFIG_DIR

function createFixture(): PluginConfigFixture {
  const fixture = new PluginConfigFixture()
  fixtures.push(fixture)
  return fixture
}

afterEach(() => {
  process.env.OPENCODE_CONFIG_DIR = originalOpenCodeConfigDir
  while (fixtures.length > 0) {
    fixtures.pop()?.cleanup()
  }
})

describe("loadPluginConfig snapshot defaults", () => {
  test("applies project explicit overrides over user explicit and computed defaults", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createSnapshot({ openai: true }),
      categories: {
        deep: {
          model: "user/custom-deep",
          temperature: 0.25,
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

    expect(config.categories?.deep?.model).toBe("project/custom-deep")
    expect(config.categories?.deep?.temperature).toBe(0.25)
  })

  test("fills omitted user fields from computed defaults", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createSnapshot({ openai: true }),
      categories: {
        deep: {
          temperature: 0.4,
        },
      },
    })

    const config = fixture.load()

    expect(config.categories?.deep).toEqual({
      model: "openai/gpt-5.4",
      variant: "medium",
      temperature: 0.4,
    })
  })

  test("falls back to built-in category defaults when no snapshot exists", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      categories: {
        quick: {
          temperature: 0.1,
        },
      },
    })

    const config = fixture.load()
    const resolved = resolveCategoryConfig("quick", config.categories)

    expect(resolved).toEqual({
      model: "anthropic/claude-haiku-4-5",
      temperature: 0.1,
    })
  })

  test("ignores project install defaults and records a warning", () => {
    const fixture = createFixture()
    fixture.writeProjectConfig({
      _install_defaults: createSnapshot({ openai: true }),
    })

    const config = fixture.load()
    const resolved = resolveCategoryConfig("quick", config.categories)

    expect(config.categories?.deep).toBeUndefined()
    expect(resolved?.model).toBe("anthropic/claude-haiku-4-5")
    expect(getConfigLoadErrors()).toContainEqual({
      path: path.join(fixture.projectDir, ".opencode", "drizzy-agent.json"),
      error: "Ignoring project _install_defaults, snapshot defaults are user-config only",
    })
  })

  test("ignores invalid user snapshot and falls back to built-in defaults", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: {
        snapshot_version: 999,
        providers: {
          claude: "no",
          openai: false,
          gemini: false,
          copilot: false,
          opencode_zen: false,
          zai_coding_plan: false,
          kimi_for_coding: false,
        },
      },
    })

    const config = fixture.load()
    const resolved = resolveCategoryConfig("quick", config.categories)

    expect(config._install_defaults).toBeUndefined()
    expect(resolved?.model).toBe("anthropic/claude-haiku-4-5")
    const errors = getConfigLoadErrors()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toBe(path.join(fixture.userConfigDir, "drizzy-agent.json"))
    expect(errors[0].error).toContain("_install_defaults")
  })

  test("ignores malformed user snapshot structure", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: "not-an-object",
    })

    const config = fixture.load()
    const resolved = resolveCategoryConfig("quick", config.categories)

    expect(config._install_defaults).toBeUndefined()
    expect(resolved?.model).toBe("anthropic/claude-haiku-4-5")
    const errors = getConfigLoadErrors()
    expect(errors.length).toBeGreaterThan(0)
    expect(errors[0].path).toBe(path.join(fixture.userConfigDir, "drizzy-agent.json"))
    expect(errors[0].error).toContain("_install_defaults")
  })

  test("uses built-in defaults when user has no snapshot", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      categories: {
        quick: {
          temperature: 0.2,
        },
      },
    })

    const config = fixture.load()
    const resolved = resolveCategoryConfig("quick", config.categories)

    expect(config._install_defaults).toBeUndefined()
    expect(resolved?.model).toBe("anthropic/claude-haiku-4-5")
    expect(resolved?.temperature).toBe(0.2)
    expect(getConfigLoadErrors()).toHaveLength(0)
  })
})
