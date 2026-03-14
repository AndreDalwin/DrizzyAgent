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

  test("preserves explore provider preference order", () => {
    const result = computeDefaultsFromProviders(
      createProviders({ claude: "yes", copilot: true, opencode_zen: true }),
    )

    expect(result.agents.explore).toEqual({ model: "anthropic/claude-haiku-4-5" })
  })

  test("preserves provider-specific model transforms", () => {
    const result = computeDefaultsFromProviders(createProviders({ gemini: true }))

    expect(result.categories.quick).toEqual({
      model: "google/gemini-3-flash-preview",
    })
  })

  test("downgrades unspecified-high to unspecified-low outside max plans", () => {
    const result = computeDefaultsFromProviders(createProviders({ openai: true }))

    expect(result.categories["unspecified-high"]).toEqual({
      model: "openai/gpt-5.4",
      variant: "medium",
    })
  })
})
