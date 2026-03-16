import { describe, expect, test, mock, afterEach } from "bun:test"

import { getPluginNameWithVersion, fetchNpmDistTags, generateDrizzyConfig } from "./config-manager"
import type { InstallConfig } from "./types"

describe("getPluginNameWithVersion", () => {
  test("returns bare package name", () => {
    // #given the function is called
    // #when getting plugin name
    const result = getPluginNameWithVersion()

    // #then should return bare package name without version
    expect(result).toBe("drizzy-agent")
  })
})

describe("fetchNpmDistTags", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns dist-tags on success", async () => {
    // #given npm returns dist-tags
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("drizzy-agent")

    // #then should return the tags
    expect(result).toEqual({ latest: "2.14.0", beta: "3.0.0-beta.3" })
  })

  test("returns null on network failure", async () => {
    // #given network failure
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("drizzy-agent")

    // #then should return null
    expect(result).toBeNull()
  })

  test("returns null on non-ok response", async () => {
    // #given npm returns 404
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    ) as unknown as typeof fetch

    // #when fetching dist-tags
    const result = await fetchNpmDistTags("drizzy-agent")

    // #then should return null
    expect(result).toBeNull()
  })
})

describe("generateDrizzyConfig - snapshot-only data", () => {
  test("returns only schema and install_defaults for fresh install with providers", () => {
    // #given user has multiple providers
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: true,
      hasOpenAI: true,
      hasGemini: false,
      hasCopilot: true,
      hasOpencodeZen: false,
      hasZaiCodingPlan: true,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateDrizzyConfig(config)

    // #then should return only $schema and _install_defaults
    expect(result.$schema).toBe("https://raw.githubusercontent.com/AndreDalwin/DrizzyAgent/dev/assets/drizzy-agent.schema.json")
    expect(result._install_defaults).toBeDefined()
    const installDefaults = result._install_defaults as { snapshot_version: number; providers: Record<string, unknown> }
    expect(installDefaults.snapshot_version).toBe(1)
    expect(installDefaults.providers).toEqual({
      claude: "max20",
      openai: true,
      gemini: false,
      copilot: true,
      opencode_zen: false,
      zai_coding_plan: true,
      kimi_for_coding: false,
    })

    // #then should NOT contain expanded agents or categories
    expect(result.agents).toBeUndefined()
    expect(result.categories).toBeUndefined()
  })

  test("returns correct provider availability when no providers configured", () => {
    // #given user has no providers
    const config: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const result = generateDrizzyConfig(config)

    // #then should return snapshot with all providers disabled
    expect(result.$schema).toBeDefined()
    expect(result._install_defaults).toBeDefined()
    const installDefaults = result._install_defaults as { providers: Record<string, unknown> }
    expect(installDefaults.providers).toEqual({
      claude: "no",
      openai: false,
      gemini: false,
      copilot: false,
      opencode_zen: false,
      zai_coding_plan: false,
      kimi_for_coding: false,
    })

    // #then should NOT contain expanded agents or categories
    expect(result.agents).toBeUndefined()
    expect(result.categories).toBeUndefined()
  })

  test("handles Claude tri-state correctly (no, yes, max20)", () => {
    // #given user has no Claude
    const configNoClaude: InstallConfig = {
      hasClaude: false,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const resultNoClaude = generateDrizzyConfig(configNoClaude)

    // #then claude should be "no"
    const installDefaultsNoClaude = resultNoClaude._install_defaults as { providers: Record<string, unknown> }
    expect(installDefaultsNoClaude.providers.claude).toBe("no")

    // #given user has Claude (non-max)
    const configYesClaude: InstallConfig = {
      hasClaude: true,
      isMax20: false,
      hasOpenAI: false,
      hasGemini: false,
      hasCopilot: false,
      hasOpencodeZen: false,
      hasZaiCodingPlan: false,
      hasKimiForCoding: false,
    }

    // #when generating config
    const resultYesClaude = generateDrizzyConfig(configYesClaude)

    // #then claude should be "yes"
    const installDefaultsYesClaude = resultYesClaude._install_defaults as { providers: Record<string, unknown> }
    expect(installDefaultsYesClaude.providers.claude).toBe("yes")
  })

  test("produces deterministic output for same provider configuration", () => {
    // #given same config used twice
    const config: InstallConfig = {
      hasClaude: true,
      isMax20: false,
      hasOpenAI: true,
      hasGemini: true,
      hasCopilot: false,
      hasOpencodeZen: true,
      hasZaiCodingPlan: false,
      hasKimiForCoding: true,
    }

    // #when generating config twice
    const result1 = generateDrizzyConfig(config)
    const result2 = generateDrizzyConfig(config)

    // #then both outputs should be identical (idempotent)
    expect(result1).toEqual(result2)
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2))
  })
})
