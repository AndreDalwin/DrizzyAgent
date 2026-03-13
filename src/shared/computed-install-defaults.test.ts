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
  test("returns global fallback defaults when no providers are available", () => {
    const result = computeDefaultsFromProviders(createProviders())

    expect(result.agents.coder).toBeUndefined()
    expect(result.agents.librarian).toEqual({ model: "opencode/glm-4.7-free" })
    expect(result.categories["visual-engineering"]).toEqual({ model: "opencode/glm-4.7-free" })
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
