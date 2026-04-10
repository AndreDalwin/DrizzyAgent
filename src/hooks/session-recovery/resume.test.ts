declare const require: (name: string) => any
const { describe, expect, test } = require("bun:test")
import { extractResumeConfig, resumeSession } from "./resume"
import { OMO_INTERNAL_INITIATOR_MARKER } from "../../shared/internal-initiator-marker"
import type { MessageData } from "./types"

describe("session-recovery resume", () => {
  test("extractResumeConfig carries tools from last user message", () => {
    // given
    const userMessage: MessageData = {
      info: {
        agent: "GPTCoder",
        model: { providerID: "openai", modelID: "gpt-5.3-codex" },
        tools: { question: false, bash: true },
      },
    }

    // when
    const config = extractResumeConfig(userMessage, "ses_resume_tools")

    // then
    expect(config.tools).toEqual({ question: false, bash: true })
  })

  test("extractResumeConfig canonicalizes built-in agent names", () => {
    // given
    const userMessage: MessageData = {
      info: {
        agent: "GPTCoder",
      },
    }

    // when
    const config = extractResumeConfig(userMessage, "ses_resume_canonical")

    // then
    expect(config.agent).toBe("gptcoder")
  })

  test("extractResumeConfig preserves custom agent names", () => {
    // given
    const userMessage: MessageData = {
      info: {
        agent: "custom-agent-123",
      },
    }

    // when
    const config = extractResumeConfig(userMessage, "ses_resume_custom")

    // then
    expect(config.agent).toBe("custom-agent-123")
  })

  test("extractResumeConfig returns undefined for compaction agent", () => {
    // given
    const userMessage: MessageData = {
      info: {
        agent: "compaction",
      },
    }

    // when
    const config = extractResumeConfig(userMessage, "ses_resume_compaction")

    // then
    expect(config.agent).toBeUndefined()
  })

  test("resumeSession sends inherited tools with continuation prompt", async () => {
    // given
    let promptBody: Record<string, unknown> | undefined
    const client = {
      session: {
        promptAsync: async (input: { body: Record<string, unknown> }) => {
          promptBody = input.body
          return {}
        },
      },
    }

    // when
    const ok = await resumeSession(client as never, {
      sessionID: "ses_resume_prompt",
      agent: "GPTCoder",
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
      tools: { question: false, bash: true },
    })

    // then
    expect(ok).toBe(true)
    expect(promptBody?.tools).toEqual({ question: false, bash: true })
    expect(Array.isArray(promptBody?.parts)).toBe(true)
    const firstPart = (promptBody?.parts as Array<{ text?: string }>)?.[0]
    expect(firstPart?.text).toContain(OMO_INTERNAL_INITIATOR_MARKER)
  })
})
