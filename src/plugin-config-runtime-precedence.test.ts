/// <reference types="bun-types" />

import { afterEach, describe, expect, test } from "bun:test"

import { resolveCategoryConfig } from "./plugin-handlers/category-config-resolver"
import { resolveCategoryConfig as resolveDelegateCategoryConfig } from "./tools/delegate-task/categories"
import { loadPluginConfig } from "./plugin-config"
import {
  createInstallDefaultsSnapshot,
  PluginConfigFixture,
} from "./plugin-config-test-fixture"
import { clearConfigLoadErrors, getConfigLoadErrors } from "./shared"

class PluginConfigRuntimeFixture extends PluginConfigFixture {
  load() {
    process.env.OPENCODE_CONFIG_DIR = this.userConfigDir
    clearConfigLoadErrors()
    return loadPluginConfig(this.projectDir, {})
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
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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
      _install_defaults: createInstallDefaultsSnapshot({ openai: true }),
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

  test("does not infer snapshot defaults from explicit pins when snapshot is missing", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      categories: {
        deep: {
          model: "openai/gpt-5.4",
        },
      },
    })

    const config = fixture.load()
    const resolvedQuick = resolveCategoryConfig("quick", config.categories)

    expect(config._install_defaults).toBeUndefined()
    expect(config.categories?.deep).toEqual({
      model: "openai/gpt-5.4",
    })
    expect(resolvedQuick).toEqual({
      model: "anthropic/claude-haiku-4-5",
    })
    expect(getConfigLoadErrors()).toHaveLength(0)
  })

  test("snapshot-derived category defaults do not bypass requiresModel guards", () => {
    const fixture = createFixture()
    fixture.writeUserConfig({
      _install_defaults: createInstallDefaultsSnapshot({ gemini: true }),
    })

    const config = fixture.load()
    const resolvedDeep = resolveDelegateCategoryConfig("deep", {
      userCategories: config.categories,
      availableModels: new Set(["google/gemini-3.1-pro-preview"]),
    })

    expect(resolvedDeep).toBeNull()
    expect(config.categories?.deep?.model).toBe("google/gemini-3.1-pro-preview")
  })
})
