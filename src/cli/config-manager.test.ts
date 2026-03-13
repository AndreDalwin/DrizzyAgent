import { describe, expect, test, mock, afterEach } from "bun:test"

import { getPluginNameWithVersion, fetchNpmDistTags, generateDrizzyConfig } from "./config-manager"
import type { InstallConfig } from "./types"

describe("getPluginNameWithVersion", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  test("returns @latest when current version matches latest tag", async () => {
    // #given npm dist-tags with latest=2.14.0
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 2.14.0
    const result = await getPluginNameWithVersion("2.14.0")

    // #then should use @latest tag
    expect(result).toBe("drizzy-agent@latest")
  })

  test("returns @beta when current version matches beta tag", async () => {
    // #given npm dist-tags with beta=3.0.0-beta.3
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 3.0.0-beta.3
    const result = await getPluginNameWithVersion("3.0.0-beta.3")

    // #then should use @beta tag
    expect(result).toBe("drizzy-agent@beta")
  })

  test("returns @next when current version matches next tag", async () => {
    // #given npm dist-tags with next=3.1.0-next.1
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3", next: "3.1.0-next.1" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 3.1.0-next.1
    const result = await getPluginNameWithVersion("3.1.0-next.1")

    // #then should use @next tag
    expect(result).toBe("drizzy-agent@next")
  })

  test("returns prerelease channel tag when no dist-tag matches prerelease version", async () => {
    // #given npm dist-tags with beta=3.0.0-beta.3
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ latest: "2.14.0", beta: "3.0.0-beta.3" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is old beta 3.0.0-beta.2
    const result = await getPluginNameWithVersion("3.0.0-beta.2")

    // #then should preserve prerelease channel
    expect(result).toBe("drizzy-agent@beta")
  })

  test("returns prerelease channel tag when fetch fails", async () => {
    // #given network failure
    globalThis.fetch = mock(() => Promise.reject(new Error("Network error"))) as unknown as typeof fetch

    // #when current version is 3.0.0-beta.3
    const result = await getPluginNameWithVersion("3.0.0-beta.3")

    // #then should preserve prerelease channel
    expect(result).toBe("drizzy-agent@beta")
  })

  test("returns bare package name when npm returns non-ok response for stable version", async () => {
    // #given npm returns 404
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: false,
        status: 404,
      } as Response)
    ) as unknown as typeof fetch

    // #when current version is 2.14.0
    const result = await getPluginNameWithVersion("2.14.0")

    // #then should fall back to bare package entry
    expect(result).toBe("drizzy-agent")
  })

  test("prioritizes latest over other tags when version matches multiple", async () => {
    // #given version matches both latest and beta (during release promotion)
    globalThis.fetch = mock(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ beta: "3.0.0", latest: "3.0.0", next: "3.1.0-alpha.1" }),
      } as Response)
    ) as unknown as typeof fetch

    // #when current version matches both
    const result = await getPluginNameWithVersion("3.0.0")

    // #then should prioritize @latest
    expect(result).toBe("drizzy-agent@latest")
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
