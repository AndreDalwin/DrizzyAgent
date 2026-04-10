import { describe, expect, test } from "bun:test"
import { resolvePromptReplayAgent } from "./prompt-replay-agent"

describe("resolvePromptReplayAgent", () => {
  test("returns undefined for undefined input", () => {
    expect(resolvePromptReplayAgent(undefined)).toBeUndefined()
  })

  test("returns undefined for empty string", () => {
    expect(resolvePromptReplayAgent("")).toBeUndefined()
  })

  test("returns undefined for compaction agent", () => {
    expect(resolvePromptReplayAgent("compaction")).toBeUndefined()
    expect(resolvePromptReplayAgent("Compaction")).toBeUndefined()
  })

  test("canonicalizes GPTCoder display name to gptcoder", () => {
    expect(resolvePromptReplayAgent("GPTCoder")).toBe("gptcoder")
  })

  test("canonicalizes planConsultant config key to plan-consultant", () => {
    expect(resolvePromptReplayAgent("planConsultant")).toBe("plan-consultant")
  })

  test("canonicalizes planReviewer config key to plan-reviewer", () => {
    expect(resolvePromptReplayAgent("planReviewer")).toBe("plan-reviewer")
  })

  test("canonicalizes Plan Consultant display name to plan-consultant", () => {
    expect(resolvePromptReplayAgent("Plan Consultant")).toBe("plan-consultant")
  })

  test("canonicalizes orchestrator to orchestrator", () => {
    expect(resolvePromptReplayAgent("orchestrator")).toBe("orchestrator")
    expect(resolvePromptReplayAgent("Orchestrator")).toBe("orchestrator")
  })

  test("preserves custom agent names as-is", () => {
    expect(resolvePromptReplayAgent("custom-agent-123")).toBe("custom-agent-123")
    expect(resolvePromptReplayAgent("MyCustomAgent")).toBe("MyCustomAgent")
  })
})
