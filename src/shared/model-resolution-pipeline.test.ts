import { describe, expect, test } from "bun:test"
import { resolveModelPipeline } from "./model-resolution-pipeline"

describe("resolveModelPipeline", () => {
  test("does not return unused explicit user config metadata in override result", () => {
    // given
    const result = resolveModelPipeline({
      intent: {
        userModel: "openai/gpt-5.3-codex",
      },
      constraints: {
        availableModels: new Set<string>(),
      },
    })

    // when
    const hasExplicitUserConfigField = result
      ? Object.prototype.hasOwnProperty.call(result, "explicitUserConfig")
      : false

    // then
    expect(result).toEqual({ model: "openai/gpt-5.3-codex", provenance: "override" })
    expect(hasExplicitUserConfigField).toBe(false)
  })

  test("returns override provenance before category and fallback candidates", () => {
    const result = resolveModelPipeline({
      intent: {
        uiSelectedModel: " openai/gpt-5.4 ",
        userModel: "anthropic/claude-opus-4-6",
        categoryDefaultModel: "google/gemini-3.1-pro",
      },
      constraints: {
        availableModels: new Set(["openai/gpt-5.4", "google/gemini-3.1-pro"]),
      },
      policy: {
        fallbackChain: [{ providers: ["anthropic"], model: "claude-opus-4-6", variant: "max" }],
        systemDefaultModel: "opencode/glm-4.7-free",
      },
    })

    expect(result).toEqual({
      model: "openai/gpt-5.4",
      provenance: "override",
    })
  })

  test("returns category-default provenance when the computed default is available", () => {
    const result = resolveModelPipeline({
      intent: {
        categoryDefaultModel: "openai/gpt-5.4",
      },
      constraints: {
        availableModels: new Set(["openai/gpt-5.4-preview"]),
      },
      policy: {
        systemDefaultModel: "opencode/glm-4.7-free",
      },
    })

    expect(result).toEqual({
      model: "openai/gpt-5.4-preview",
      provenance: "category-default",
      attempted: ["openai/gpt-5.4"],
    })
  })

  test("returns provider-fallback provenance with the fallback variant", () => {
    const result = resolveModelPipeline({
      constraints: {
        availableModels: new Set(["openai/gpt-5.4"]),
      },
      policy: {
        fallbackChain: [{ providers: ["openai"], model: "gpt-5.4", variant: "medium" }],
        systemDefaultModel: "opencode/glm-4.7-free",
      },
    })

    expect(result).toEqual({
      model: "openai/gpt-5.4",
      provenance: "provider-fallback",
      variant: "medium",
      attempted: [],
    })
  })

  test("returns system-default provenance after recording attempted computed defaults", () => {
    const result = resolveModelPipeline({
      intent: {
        categoryDefaultModel: "openai/gpt-5.4",
      },
      constraints: {
        availableModels: new Set(["anthropic/claude-opus-4-6"]),
      },
      policy: {
        fallbackChain: [{ providers: ["google"], model: "gemini-3.1-pro", variant: "high" }],
        systemDefaultModel: "opencode/glm-4.7-free",
      },
    })

    expect(result).toEqual({
      model: "opencode/glm-4.7-free",
      provenance: "system-default",
      attempted: ["openai/gpt-5.4"],
    })
  })
})
