/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"
import * as path from "path"

import { resolveCategoryConfig } from "./plugin-handlers/category-config-resolver"
import { loadPluginConfig } from "./plugin-config"
import {
  createInstallDefaultsSnapshot,
  PluginConfigFixture,
} from "./plugin-config-test-fixture"
import { clearConfigLoadErrors, getConfigLoadErrors } from "./shared"

class PluginConfigSnapshotFixture extends PluginConfigFixture {
  load() {
    process.env.OPENCODE_CONFIG_DIR = this.userConfigDir
    clearConfigLoadErrors()
    return loadPluginConfig(this.projectDir, {})
  }
}

const fixtures: PluginConfigSnapshotFixture[] = []
const originalOpenCodeConfigDir = process.env.OPENCODE_CONFIG_DIR

function createFixture(): PluginConfigSnapshotFixture {
  const fixture = new PluginConfigSnapshotFixture()
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
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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

  test("supports snapshot-backed configs without explicit overrides", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
    })

    const config = fixture.load()
    const resolvedQuick = resolveCategoryConfig("quick", config.categories)

    expect(config._install_defaults).toEqual(
      createInstallDefaultsSnapshot({ openai: true }),
    )
    expect(resolvedQuick).toEqual({
      model: "openai/gpt-5.4",
      variant: "low",
    })
    expect(getConfigLoadErrors()).toHaveLength(0)
  })

  test("applies researcher defaults from kimi-only snapshot", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createInstallDefaultsSnapshot({ kimi_for_coding: true }),
    })

    const config = fixture.load()

    expect(config.agents?.researcher).toEqual({
      model: "kimi-for-coding/k2p5",
    })
    expect(config.agents?.["researcher-junior"]).toEqual({
      model: "kimi-for-coding/k2p5",
    })
    expect(getConfigLoadErrors()).toHaveLength(0)
  })

  test("falls back to built-in category defaults when no snapshot exists", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      categories: {
        deep: {
          model: "openai/gpt-5.4",
        },
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
    expect(config.categories?.deep).toEqual({
      model: "openai/gpt-5.4",
    })
  })

  test("ignores project install defaults and records a warning", () => {
    const fixture = createFixture()
    fixture.writeProjectConfig({
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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

  for (const invalidSnapshotCase of [
    {
      name: "ignores invalid user snapshot and falls back to built-in defaults",
      installDefaults: {
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
    },
    {
      name: "ignores malformed user snapshot structure",
      installDefaults: "not-an-object",
    },
  ]) {
    test(invalidSnapshotCase.name, () => {
      const fixture = createFixture()
      fixture.writeUserConfig({
        _install_defaults: invalidSnapshotCase.installDefaults,
        categories: {
          deep: {
            model: "openai/gpt-5.4",
          },
        },
      })

      const config = fixture.load()
      const resolved = resolveCategoryConfig("quick", config.categories)

      expect(config._install_defaults).toBeUndefined()
      expect(resolved?.model).toBe("anthropic/claude-haiku-4-5")
      expect(config.categories?.deep).toEqual({
        model: "openai/gpt-5.4",
      })
      const errors = getConfigLoadErrors()
      expect(errors.length).toBeGreaterThan(0)
      expect(errors[0].path).toBe(path.join(fixture.userConfigDir, "drizzy-agent.json"))
      expect(errors[0].error).toContain("_install_defaults")
    })
  }

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
