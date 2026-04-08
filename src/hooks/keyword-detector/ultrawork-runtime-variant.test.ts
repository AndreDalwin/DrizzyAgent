import { describe, expect, test } from "bun:test"
import { createKeywordDetectorHook } from "./index"
import { _resetForTesting, setMainSession } from "../../features/claude-code-session-state"

function createMockPluginInput(toastMessages: string[]) {
  return {
    client: {
      tui: {
        showToast: async (opts: { body: { message: string } }) => {
          toastMessages.push(opts.body.message)
        },
      },
    },
  } as any
}

describe("keyword-detector ultrawork runtime variant gating", () => {
  test("#given runtime max variant #when ultrawork activates #then maximum precision toast is preserved", async () => {
    // given
    _resetForTesting()
    setMainSession("main-session")
    const toastMessages: string[] = []
    const hook = createKeywordDetectorHook(createMockPluginInput(toastMessages))
    const output = {
      message: { model: { variant: "max" } } as Record<string, unknown>,
      parts: [{ type: "text", text: "ultrawork do it" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", model: { providerID: "openai", modelID: "gpt-5.4", variant: "max" } }, output)

    // then
    expect((output.message.model as { variant?: string }).variant).toBe("max")
    expect(toastMessages).toEqual(["Maximum precision engaged. All agents at your disposal."])
    _resetForTesting()
  })

  test("#given runtime non-max variant #when ultrawork activates #then variant stays unchanged and toast does not claim max", async () => {
    // given
    _resetForTesting()
    setMainSession("main-session")
    const toastMessages: string[] = []
    const hook = createKeywordDetectorHook(createMockPluginInput(toastMessages))
    const output = {
      message: { model: { variant: "medium" } } as Record<string, unknown>,
      parts: [{ type: "text", text: "ultrawork do it" }],
    }

    // when
    await hook["chat.message"]({ sessionID: "main-session", model: { providerID: "openai", modelID: "gpt-5.4", variant: "medium" } }, output)

    // then
    expect((output.message.model as { variant?: string }).variant).toBe("medium")
    expect(toastMessages).toEqual(["Runtime variant preserved. All agents at your disposal."])
    _resetForTesting()
  })
})
