const { describe, expect, mock, test } = require("bun:test")

mock.module("../../shared", () => ({
  getMessageDir: () => null,
  isSqliteBackend: () => true,
  normalizeSDKResponse: <TData>(response: { data?: TData }, fallback: TData): TData => response.data ?? fallback,
}))

const { getLastAgentFromSession } = await import("./session-last-agent")

function createMockClient(messages: Array<{ info?: { agent?: string } }>) {
  return {
    session: {
      messages: async () => ({ data: messages }),
    },
  }
}

describe("getLastAgentFromSession sqlite branch", () => {
  test("should skip compaction and return the previous real agent from sqlite messages", async () => {
    // given
    const client = createMockClient([
      { info: { agent: "orchestrator" } },
      { info: { agent: "compaction" } },
    ])

    // when
    const result = await getLastAgentFromSession("ses_sqlite_compaction", client)

    // then
    expect(result).toBe("orchestrator")
  })

  test("should return null when sqlite history contains only compaction", async () => {
    // given
    const client = createMockClient([{ info: { agent: "compaction" } }])

    // when
    const result = await getLastAgentFromSession("ses_sqlite_only_compaction", client)

    // then
    expect(result).toBeNull()
  })
})

export {}
