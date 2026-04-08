import { describe, expect, test } from "bun:test"

import { generateModelConfig } from "./model-fallback"
import type { InstallConfig } from "./types"

function createConfig(overrides: Partial<InstallConfig> = {}): InstallConfig {
  return {
    hasClaude: false,
    isMax20: false,
    hasOpenAI: false,
    hasGemini: false,
    hasCopilot: false,
    hasOpencodeZen: false,
    hasZaiCodingPlan: false,
    hasKimiForCoding: false,
    ...overrides,
  }
}

describe("generateModelConfig", () => {
  describe("no providers available", () => {
    test("returns ULTIMATE_FALLBACK for all agents and categories when no providers", () => {
      // #given no providers are available
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ULTIMATE_FALLBACK for everything
      expect(result).toMatchSnapshot()
    })
  })

  describe("single native provider", () => {
    test("uses Claude models when only Claude is available", () => {
      // #given only Claude is available
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Claude models per NATIVE_FALLBACK_CHAINS
      expect(result).toMatchSnapshot()
    })

    test("uses Claude models with isMax20 flag", () => {
      // #given Claude is available with Max 20 plan
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models for Coder
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models when only OpenAI is available", () => {
      // #given only OpenAI is available
      const config = createConfig({ hasOpenAI: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OpenAI models
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI models with isMax20 flag", () => {
      // #given OpenAI is available with Max 20 plan
      const config = createConfig({ hasOpenAI: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models when only Gemini is available", () => {
      // #given only Gemini is available
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use Gemini models
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini models with isMax20 flag", () => {
      // #given Gemini is available with Max 20 plan
      const config = createConfig({ hasGemini: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("all native providers", () => {
    test("uses preferred models from fallback chains when all natives available", () => {
      // #given all native providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use first provider in each fallback chain
      expect(result).toMatchSnapshot()
    })

    test("uses preferred models with isMax20 flag when all natives available", () => {
      // #given all native providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("fallback providers", () => {
    test("uses OpenCode Zen models when only OpenCode Zen is available", () => {
      // #given only OpenCode Zen is available
      const config = createConfig({ hasOpencodeZen: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use OPENCODE_ZEN_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses OpenCode Zen models with isMax20 flag", () => {
      // #given OpenCode Zen is available with Max 20 plan
      const config = createConfig({ hasOpencodeZen: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models when only Copilot is available", () => {
      // #given only GitHub Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use GITHUB_COPILOT_MODELS
      expect(result).toMatchSnapshot()
    })

    test("uses GitHub Copilot models with isMax20 flag", () => {
      // #given GitHub Copilot is available with Max 20 plan
      const config = createConfig({ hasCopilot: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for librarian when only ZAI is available", () => {
      // #given only ZAI is available
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for librarian
      expect(result).toMatchSnapshot()
    })

    test("uses ZAI model for librarian with isMax20 flag", () => {
      // #given ZAI is available with Max 20 plan
      const config = createConfig({ hasZaiCodingPlan: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use ZAI_MODEL for librarian
      expect(result).toMatchSnapshot()
    })
  })

  describe("mixed provider scenarios", () => {
    test("uses Claude + OpenCode Zen combination", () => {
      // #given Claude and OpenCode Zen are available
      const config = createConfig({
        hasClaude: true,
        hasOpencodeZen: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer Claude (native) over OpenCode Zen
      expect(result).toMatchSnapshot()
    })

    test("uses OpenAI + Copilot combination", () => {
      // #given OpenAI and Copilot are available
      const config = createConfig({
        hasOpenAI: true,
        hasCopilot: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenAI (native) over Copilot
      expect(result).toMatchSnapshot()
    })

    test("uses Claude + ZAI combination (librarian uses ZAI)", () => {
      // #given Claude and ZAI are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should use ZAI, others use Claude
      expect(result).toMatchSnapshot()
    })

    test("uses Gemini + Claude combination (explore uses Gemini)", () => {
      // #given Gemini and Claude are available
      const config = createConfig({
        hasGemini: true,
        hasClaude: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use Gemini flash
      expect(result).toMatchSnapshot()
    })

    test("uses all fallback providers together", () => {
      // #given all fallback providers are available
      const config = createConfig({
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer OpenCode Zen, but librarian uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers together", () => {
      // #given all providers are available
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should prefer native providers, librarian uses ZAI
      expect(result).toMatchSnapshot()
    })

    test("uses all providers with isMax20 flag", () => {
      // #given all providers are available with Max 20 plan
      const config = createConfig({
        hasClaude: true,
        hasOpenAI: true,
        hasGemini: true,
        hasOpencodeZen: true,
        hasCopilot: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should use higher capability models
      expect(result).toMatchSnapshot()
    })
  })

  describe("explore agent special cases", () => {
    test("explore uses Gemini flash when only Gemini available", () => {
      // #given only Gemini is available (no Claude)
      const config = createConfig({ hasGemini: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use Gemini, not a free fallback
      expect(result.agents?.explore?.model).toBe("google/gemini-3-flash-preview")
    })

    test("explore uses Claude haiku when Claude available", () => {
      // #given Claude is available
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use claude-haiku-4-5
      expect(result.agents?.explore?.model).toBe("anthropic/claude-haiku-4-5")
    })

    test("explore uses Claude haiku regardless of isMax20 flag", () => {
      // #given Claude is available without Max 20 plan
      const config = createConfig({ hasClaude: true, isMax20: false })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use claude-haiku-4-5 (isMax20 doesn't affect explore)
      expect(result.agents?.explore?.model).toBe("anthropic/claude-haiku-4-5")
    })

    test("explore uses OpenAI model when only OpenAI available", () => {
      // #given only OpenAI is available
      const config = createConfig({ hasOpenAI: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use the cheaper native OpenAI fast model
      expect(result.agents?.explore?.model).toBe("openai/gpt-5.4-nano")
      expect(result.agents?.explore?.variant).toBeUndefined()
    })

    test("explore uses gpt-5-mini when only Copilot available", () => {
      // #given only Copilot is available
      const config = createConfig({ hasCopilot: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then explore should use gpt-5-mini (Copilot fallback)
      expect(result.agents?.explore?.model).toBe("github-copilot/gpt-5-mini")
    })
  })

  describe("Coder agent special cases", () => {
    test("Coder is created when at least one fallback provider is available (Claude)", () => {
      // #given
      const config = createConfig({ hasClaude: true, isMax20: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.coder?.model).toBe("anthropic/claude-opus-4-6")
    })

    test("Coder is created when multiple fallback providers are available", () => {
      // #given
      const config = createConfig({
        hasClaude: true,
        hasKimiForCoding: true,
        hasOpencodeZen: true,
        hasZaiCodingPlan: true,
        isMax20: true,
      })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.coder?.model).toBe("anthropic/claude-opus-4-6")
    })

    test("Coder resolves to gpt-5.4 medium when only OpenAI is available", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.coder?.model).toBe("openai/gpt-5.4")
      expect(result.agents?.coder?.variant).toBe("medium")
    })
  })

  describe("GPTCoder agent special cases", () => {
    test("GPTCoder is created when OpenAI is available (openai provider connected)", () => {
      // #given
      const config = createConfig({ hasOpenAI: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.gptcoder?.model).toBe("openai/gpt-5.3-codex")
      expect(result.agents?.gptcoder?.variant).toBe("medium")
    })

    test("GPTCoder IS created when Copilot is available (unified chain allows github-copilot)", () => {
      // #given
      const config = createConfig({ hasCopilot: true })

      // #when
      const result = generateModelConfig(config)

      // #then - gptcoder uses github-copilot with unified chain
      expect(result.agents?.gptcoder?.model).toBe("github-copilot/gpt-5.3-codex")
      expect(result.agents?.gptcoder?.variant).toBe("medium")
    })

    test("GPTCoder is created when OpenCode Zen is available (opencode provider connected)", () => {
      // #given
      const config = createConfig({ hasOpencodeZen: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.gptcoder?.model).toBe("opencode/gpt-5.3-codex")
      expect(result.agents?.gptcoder?.variant).toBe("medium")
    })

    test("GPTCoder is omitted when only Claude is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasClaude: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.gptcoder).toBeUndefined()
    })

    test("GPTCoder is omitted when only Gemini is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasGemini: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.gptcoder).toBeUndefined()
    })

    test("GPTCoder is omitted when only ZAI is available (no required provider connected)", () => {
      // #given
      const config = createConfig({ hasZaiCodingPlan: true })

      // #when
      const result = generateModelConfig(config)

      // #then
      expect(result.agents?.gptcoder).toBeUndefined()
    })
  })

  describe("librarian agent special cases", () => {
    test("librarian uses ZAI model when ZAI is available regardless of other providers", () => {
      // #given ZAI and Claude are available
      const config = createConfig({
        hasClaude: true,
        hasZaiCodingPlan: true,
      })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should use ZAI_MODEL
      expect(result.agents?.librarian?.model).toBe("zai-coding-plan/glm-4.7")
    })

    test("librarian falls back to generic chain result when no librarian provider matches", () => {
      // #given only Claude is available (no ZAI)
      const config = createConfig({ hasClaude: true })

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then librarian should use generic chain result when chain providers are unavailable
      expect(result.agents?.librarian?.model).toBe("anthropic/claude-sonnet-4-5")
    })

    test("librarian uses gpt-5.4-mini when only OpenAI is available", () => {
      const config = createConfig({ hasOpenAI: true })

      const result = generateModelConfig(config)

      expect(result.agents?.librarian).toEqual({
        model: "openai/gpt-5.4-mini",
      })
    })
  })

  describe("paid-only reroutes", () => {
    test("Kimi-only reroutes affected agents away from free fallbacks", () => {
      const config = createConfig({ hasKimiForCoding: true })

      const result = generateModelConfig(config)

      expect(result.agents?.oracle).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.agents?.librarian).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.agents?.explore).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.agents?.planReviewer).toEqual({ model: "kimi-for-coding/k2p5" })
    })

    test("Kimi-only reroutes affected categories away from free fallbacks", () => {
      const config = createConfig({ hasKimiForCoding: true })

      const result = generateModelConfig(config)

      expect(result.categories?.ultrabrain).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.categories?.deep).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.categories?.artistry).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.categories?.quick).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.categories?.["unspecified-low"]).toEqual({ model: "kimi-for-coding/k2p5" })
      expect(result.categories?.["unspecified-high"]).toEqual({ model: "kimi-for-coding/k2p5" })
    })

    test("Claude-only reroutes multimodal-looker away from free fallback", () => {
      const config = createConfig({ hasClaude: true })

      const result = generateModelConfig(config)

      expect(result.agents?.["multimodal-looker"]).toEqual({
        model: "anthropic/claude-sonnet-4-6",
      })
    })

    test("Gemini-only reroutes paid gaps away from free fallbacks", () => {
      const config = createConfig({ hasGemini: true })

      const result = generateModelConfig(config)

      expect(result.agents?.coder).toEqual({
        model: "google/gemini-3.1-pro-preview",
      })
      expect(result.agents?.explore).toEqual({
        model: "google/gemini-3-flash-preview",
      })
      expect(result.agents?.["researcher-junior"]).toEqual({
        model: "google/gemini-3-flash-preview",
      })
    })

    test("OpenAI-only uses fast defaults for lower-cost task buckets", () => {
      const config = createConfig({ hasOpenAI: true })

      const result = generateModelConfig(config)

      expect(result.agents?.librarian).toEqual({ model: "openai/gpt-5.4-mini" })
      expect(result.agents?.["researcher-junior"]).toEqual({
        model: "openai/gpt-5.4-mini",
      })
      expect(result.categories?.quick).toEqual({ model: "openai/gpt-5.4-mini" })
      expect(result.categories?.["unspecified-low"]).toEqual({
        model: "openai/gpt-5.4-mini",
      })
      expect(result.categories?.["unspecified-high"]).toEqual({
        model: "openai/gpt-5.3-codex",
        variant: "medium",
      })
    })

    test("ZAI-only behavior remains unchanged in this pass", () => {
      const config = createConfig({ hasZaiCodingPlan: true })

      const result = generateModelConfig(config)

      expect(result.agents?.librarian).toEqual({ model: "zai-coding-plan/glm-4.7" })
      expect(result.agents?.oracle).toEqual({ model: "opencode/big-pickle" })
      expect(result.agents?.explore).toEqual({ model: "opencode/gpt-5-nano" })
      expect(result.categories?.quick).toEqual({ model: "opencode/gpt-5-nano" })
      expect(result.categories?.artistry).toEqual({ model: "opencode/minimax-m2.5-free" })
    })
  })

  describe("schema URL", () => {
    test("always includes correct schema URL", () => {
      // #given any config
      const config = createConfig()

      // #when generateModelConfig is called
      const result = generateModelConfig(config)

      // #then should include correct schema URL
      expect(result.$schema).toBe(
        "https://raw.githubusercontent.com/AndreDalwin/DrizzyAgent/dev/assets/drizzy-agent.schema.json"
      )
    })
  })
})
