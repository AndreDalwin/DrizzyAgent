import { describe, expect, test } from "bun:test"

import { computeDefaultsFromProviders } from "./computed-install-defaults"
import type { InstallDefaultsProviders } from "./install-defaults-contract"

function createProviders(
  overrides: Partial<InstallDefaultsProviders> = {},
): InstallDefaultsProviders {
  return {
    claude: "no",
    openai: false,
    gemini: false,
    copilot: false,
    opencode_zen: false,
    zai_coding_plan: false,
    kimi_for_coding: false,
    ...overrides,
  }
}

describe("computeDefaultsFromProviders", () => {
  test("returns alwaysAvailable free fallbacks when no providers are available", () => {
    const result = computeDefaultsFromProviders(createProviders())

    // Free models (alwaysAvailable) should be used as last-resort fallbacks
    expect(result.agents.coder).toEqual({ model: "opencode/big-pickle" })
    // Librarian chain: minimax-m2.5-free comes before glm-4.7-free
    expect(result.agents.librarian).toEqual({ model: "opencode/minimax-m2.5-free" })
    expect(result.categories.quick).toEqual({ model: "opencode/gpt-5-nano" })
  })

  test("preserves the coder fallback chain selection", () => {
    const result = computeDefaultsFromProviders(createProviders({ openai: true }))

    expect(result.agents.coder).toEqual({
      model: "openai/gpt-5.4",
      variant: "medium",
    })
  })

  test("preserves the librarian zai special case", () => {
    const result = computeDefaultsFromProviders(createProviders({ zai_coding_plan: true }))

    expect(result.agents.librarian).toEqual({ model: "zai-coding-plan/glm-4.7" })
  })

  test("prefers OpenAI for explore when OpenAI and Claude are both available", () => {
    const result = computeDefaultsFromProviders(
      createProviders({ claude: "yes", openai: true, copilot: true, opencode_zen: true }),
    )

    expect(result.agents.explore).toEqual({ model: "openai/gpt-5.4-nano", variant: "low" })
  })

  describe("#given providers with claude=yes and no opencode_zen", () => {
    describe("#when computing defaults", () => {
      test("#then explore should resolve to anthropic/claude-haiku-4-5, NOT opencode/minimax-m2.5-free", () => {
        const result = computeDefaultsFromProviders(createProviders({ claude: "yes" }))

        expect(result.agents.explore).toEqual({ model: "anthropic/claude-haiku-4-5" })
      })
    })
  })

  describe("#given providers with claude=max20 and no opencode_zen", () => {
    describe("#when computing defaults", () => {
      test("#then explore should resolve to anthropic/claude-haiku-4-5, NOT opencode/minimax-m2.5-free", () => {
        const result = computeDefaultsFromProviders(createProviders({ claude: "max20" }))

        expect(result.agents.explore).toEqual({ model: "anthropic/claude-haiku-4-5" })
      })
    })
  })

  test("preserves provider-specific model transforms", () => {
    const result = computeDefaultsFromProviders(createProviders({ gemini: true }))

    expect(result.categories.quick).toEqual({
      model: "google/gemini-3-flash-preview",
    })
  })

  test("includes researcher defaults from kimi provider snapshot", () => {
    const result = computeDefaultsFromProviders(createProviders({ kimi_for_coding: true }))

    expect(result.agents.researcher).toEqual({
      model: "kimi-for-coding/k2p6",
    })
    expect(result.agents["researcher-junior"]).toEqual({
      model: "kimi-for-coding/k2p6",
    })
  })

  test("downgrades unspecified-high to unspecified-low outside max plans", () => {
    const result = computeDefaultsFromProviders(createProviders({ openai: true }))

    expect(result.categories["unspecified-high"]).toEqual({
      model: "openai/gpt-5.3-codex",
      variant: "medium",
    })
  })

  test("prefers OpenAI over Claude and Kimi for the requested mixed-provider defaults", () => {
    const result = computeDefaultsFromProviders(
      createProviders({ claude: "yes", openai: true, kimi_for_coding: true }),
    )

    expect(result.agents.planner).toEqual({
      model: "openai/gpt-5.4",
      variant: "high",
    })
    expect(result.agents.explore).toEqual({
      model: "openai/gpt-5.4-nano",
      variant: "low",
    })
    expect(result.categories.quick).toEqual({
      model: "openai/gpt-5.4-mini",
      variant: "low",
    })
    expect(result.categories["unspecified-low"]).toEqual({
      model: "openai/gpt-5.3-codex",
      variant: "medium",
    })
    expect(result.categories["unspecified-high"]).toEqual({
      model: "openai/gpt-5.3-codex",
      variant: "medium",
    })
  })
})
