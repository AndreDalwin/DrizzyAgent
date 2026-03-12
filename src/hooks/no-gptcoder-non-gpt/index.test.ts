/// <reference types="bun-types" />

import { describe, expect, spyOn, test } from "bun:test"
import { _resetForTesting, updateSessionAgent } from "../../features/claude-code-session-state"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { createNoGptcoderNonGptHook } from "./index"

const GPTCODER_DISPLAY = getAgentDisplayName("gptcoder")
const CODER_DISPLAY = getAgentDisplayName("coder")

function createOutput() {
  return {
    message: {} as { agent?: string; [key: string]: unknown },
    parts: [],
  }
}

describe("no-gptcoder-non-gpt hook", () => {
  test("shows toast on every chat.message when GPTCoder uses non-gpt model", async () => {
    // given - GPTCoder with claude model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoGptcoderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output1 = createOutput()
    const output2 = createOutput()

    // when - chat.message is called repeatedly
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: GPTCODER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output1)
    await hook["chat.message"]?.({
      sessionID: "ses_1",
      agent: GPTCODER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output2)

    // then - toast is shown and agent is switched to coder
    expect(showToast).toHaveBeenCalledTimes(2)
    expect(output1.message.agent).toBe(CODER_DISPLAY)
    expect(output2.message.agent).toBe(CODER_DISPLAY)
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
        title: "NEVER Use GPTCoder with Non-GPT",
        message: expect.stringContaining("GPTCoder falls apart on non-GPT inputs."),
        variant: "error",
      },
    })
  })

  test("shows warning and does not switch agent when allow_non_gpt_model is enabled", async () => {
    // given - GPTCoder with claude model and opt-out enabled
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoGptcoderNonGptHook({
      client: { tui: { showToast } },
    } as any, {
      allowNonGptModel: true,
    })

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_opt_out",
        agent: GPTCODER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - warning toast is shown but agent is not switched
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBeUndefined()
    expect(showToast.mock.calls[0]?.[0]).toMatchObject({
      body: {
      title: "NEVER Use GPTCoder with Non-GPT",
        variant: "warning",
      },
    })
  })

  test("does not show toast when GPTCoder uses gpt model", async () => {
    // given - GPTCoder with gpt model
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoGptcoderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_2",
      agent: GPTCODER_DISPLAY,
      model: { providerID: "openai", modelID: "gpt-5.3-codex" },
    }, output)

    // then - no toast, agent unchanged
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("does not show toast for non-gptcoder agent", async () => {
    // given - coder with claude model (non-gpt)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoGptcoderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs
    await hook["chat.message"]?.({
      sessionID: "ses_3",
      agent: CODER_DISPLAY,
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - no toast
    expect(showToast).toHaveBeenCalledTimes(0)
    expect(output.message.agent).toBeUndefined()
  })

  test("uses session agent fallback when input agent is missing", async () => {
    // given - session agent saved as GPTCoder
    _resetForTesting()
    updateSessionAgent("ses_4", GPTCODER_DISPLAY)
    const showToast = spyOn({ fn: async (_input: unknown) => ({}) }, "fn")
    const hook = createNoGptcoderNonGptHook({
      client: { tui: { showToast } },
    } as any)

    const output = createOutput()

    // when - chat.message runs without input.agent
    await hook["chat.message"]?.({
      sessionID: "ses_4",
      model: { providerID: "anthropic", modelID: "claude-opus-4-6" },
    }, output)

    // then - toast shown via session-agent fallback, switched to coder
    expect(showToast).toHaveBeenCalledTimes(1)
    expect(output.message.agent).toBe(CODER_DISPLAY)
  })
})
