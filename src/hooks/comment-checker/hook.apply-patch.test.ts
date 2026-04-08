import { describe, it, expect, mock, beforeEach } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"

const processApplyPatchEditsWithCli = mock(async () => {})

mock.module("./cli-runner", () => ({
  initializeCommentCheckerCli: () => {},
  getCommentCheckerCliPathPromise: () => Promise.resolve("/tmp/fake-comment-checker"),
  isCliPathUsable: () => true,
  processWithCli: async () => {},
  processApplyPatchEditsWithCli,
}))

const { createCommentCheckerHooks } = await import("./hook")

describe("comment-checker apply_patch integration", () => {
  beforeEach(() => {
    processApplyPatchEditsWithCli.mockClear()
  })

  it("runs comment checker using apply_patch metadata.files", async () => {
    // given
    const hooks = createCommentCheckerHooks()

    const input = { tool: "apply_patch", sessionID: "ses_test", callID: "call_test" }
    const output = {
      title: "ok",
      output: "Success. Updated the following files:\nM src/a.ts",
      metadata: {
        files: [
          {
            filePath: "/repo/src/a.ts",
            before: "const a = 1\n",
            after: "// comment\nconst a = 1\n",
            type: "update",
          },
          {
            filePath: "/repo/src/old.ts",
            movePath: "/repo/src/new.ts",
            before: "const b = 1\n",
            after: "// moved comment\nconst b = 1\n",
            type: "move",
          },
          {
            filePath: "/repo/src/delete.ts",
            before: "// deleted\n",
            after: "",
            type: "delete",
          },
        ],
      },
    }

    // when
    await hooks["tool.execute.after"](input, output)

    // then
    expect(processApplyPatchEditsWithCli).toHaveBeenCalledTimes(1)
    expect(processApplyPatchEditsWithCli).toHaveBeenCalledWith(
      "ses_test",
      [
        { filePath: "/repo/src/a.ts", before: "const a = 1\n", after: "// comment\nconst a = 1\n" },
        { filePath: "/repo/src/new.ts", before: "const b = 1\n", after: "// moved comment\nconst b = 1\n" },
      ],
      expect.any(Object),
      "/tmp/fake-comment-checker",
      undefined,
      expect.any(Function),
    )
  })

  it("skips when apply_patch metadata.files is missing", async () => {
    // given
    const hooks = createCommentCheckerHooks()
    const input = { tool: "apply_patch", sessionID: "ses_test", callID: "call_test" }
    const output = { title: "ok", output: "ok", metadata: {} }

    // when
    await hooks["tool.execute.after"](input, output)

    // then
    expect(processApplyPatchEditsWithCli).toHaveBeenCalledTimes(0)
  })

  it("supports patch-only apply_patch metadata by reading the updated file", async () => {
    const hooks = createCommentCheckerHooks()
    const directory = join(tmpdir(), `comment-checker-${Date.now()}`)
    mkdirSync(directory, { recursive: true })
    const filePath = join(directory, "a.ts")
    writeFileSync(filePath, "// comment\nconst a = 2\n")

    try {
      const input = { tool: "apply_patch", sessionID: "ses_test", callID: "call_test" }
      const output = {
        title: "ok",
        output: "Success. Updated the following files:\nM a.ts",
        metadata: {
          files: [
            {
              filePath,
              patch: `Index: ${filePath}\n===================================================================\n--- ${filePath}\n+++ ${filePath}\n@@ -1,1 +1,2 @@\n-const a = 1\n+// comment\n+const a = 2\n`,
              type: "update",
            },
          ],
        },
      }

      await hooks["tool.execute.after"](input, output)

      expect(processApplyPatchEditsWithCli).toHaveBeenCalledTimes(1)
      expect(processApplyPatchEditsWithCli).toHaveBeenCalledWith(
        "ses_test",
        [
          {
            filePath,
            before: "const a = 1\n",
            after: "// comment\nconst a = 2\n",
          },
        ],
        expect.any(Object),
        "/tmp/fake-comment-checker",
        undefined,
        expect.any(Function),
      )
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  })
})
