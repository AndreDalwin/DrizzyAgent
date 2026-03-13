import { describe, expect, test, beforeEach, afterEach, mock } from "bun:test"
import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { join } from "node:path"
import { tmpdir } from "node:os"
import { randomUUID } from "node:crypto"
import { SYSTEM_DIRECTIVE_PREFIX } from "../../shared/system-directive"
import { clearSessionAgent, setSessionAgent } from "../../features/claude-code-session-state"
import { clearBoulderState } from "../../features/boulder-state"
// Force stable (JSON) mode for tests that rely on message file storage
mock.module("../../shared/opencode-storage-detection", () => ({
  isSqliteBackend: () => false,
  resetSqliteBackendCache: () => {},
}))

const plannerMdOnlyModulePath = "./index?planner-md-only-test"
const { createPlannerMdOnlyHook }: typeof import("./index") = await import(plannerMdOnlyModulePath)
const { MESSAGE_STORAGE } = await import("../../features/hook-message-injector")

describe("planner-md-only", () => {
  const TEST_SESSION_ID = "ses_test_planner"
  let testMessageDir: string
  let workspaceDir: string

  beforeEach(() => {
    workspaceDir = join(tmpdir(), `planner-md-only-${randomUUID()}`)
    mkdirSync(workspaceDir, { recursive: true })
  })

  function createMockPluginInput() {
    return {
      client: {},
      directory: workspaceDir,
    } as never
  }

  function setupMessageStorage(sessionID: string, agent: string | undefined): void {
    testMessageDir = join(MESSAGE_STORAGE, sessionID)
    mkdirSync(testMessageDir, { recursive: true })
    const messageContent = {
      ...(agent ? { agent } : {}),
      model: { providerID: "test", modelID: "test-model" },
    }
    writeFileSync(
      join(testMessageDir, "msg_001.json"),
      JSON.stringify(messageContent)
    )
  }

  afterEach(() => {
    clearSessionAgent(TEST_SESSION_ID)
    clearBoulderState(workspaceDir)
    if (testMessageDir) {
      try {
        rmSync(testMessageDir, { recursive: true, force: true })
      } catch {
        // ignore
      }
    }
    if (workspaceDir) {
      rmSync(workspaceDir, { recursive: true, force: true })
    }
  })

  describe("agent name matching", () => {
    test("should enforce md-only restriction for exact planner agent name", async () => {
      //#given
      setSessionAgent(TEST_SESSION_ID, "planner")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should enforce md-only restriction for Planner display name Plan Builder", async () => {
      //#given
      setSessionAgent(TEST_SESSION_ID, "Planner (Plan Builder)")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should enforce md-only restriction for Planner display name Planner", async () => {
      //#given
      setSessionAgent(TEST_SESSION_ID, "Planner (Planner)")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should enforce md-only restriction for uppercase PLANNER", async () => {
      //#given
      setSessionAgent(TEST_SESSION_ID, "PLANNER")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should not enforce restriction for non-Planner agent", async () => {
      //#given
      setSessionAgent(TEST_SESSION_ID, "coder")
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not enforce restriction when agent name is undefined", async () => {
      //#given
      setupMessageStorage(TEST_SESSION_ID, undefined)
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      //#when //#then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })
  })

   describe("with Planner agent in message storage", () => {
     beforeEach(() => {
       setSessionAgent(TEST_SESSION_ID, "planner")
     })

    test("should block Planner from writing non-.md files", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should allow Planner to write .md files inside .drizzy/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: join(workspaceDir, ".drizzy/plans/work-plan.md") },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should inject workflow reminder when Planner writes to .drizzy/plans/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output: { args: Record<string, unknown>; message?: string } = {
        args: { filePath: join(workspaceDir, ".drizzy/plans/work-plan.md") },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.message).toContain("PLANNER MANDATORY WORKFLOW REMINDER")
      expect(output.message).toContain("INTERVIEW")
      expect(output.message).toContain("PLAN CONSULTANT")
      expect(output.message).toContain("PLAN REVIEWER")
    })

    test("should NOT inject workflow reminder for .drizzy/drafts/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output: { args: Record<string, unknown>; message?: string } = {
        args: { filePath: join(workspaceDir, ".drizzy/drafts/notes.md") },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.message).toBeUndefined()
    })

    test("should block Planner from writing .md files outside .drizzy/", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/README.md" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files inside .drizzy/")
    })

    test("should block Edit tool for non-.md files", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Edit",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.py" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should allow bash commands from Planner", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "bash",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { command: "echo test" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not affect non-blocked tools", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Read",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should handle missing filePath gracefully", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: {},
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should inject read-only warning when Planner calls task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Analyze this codebase" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
      expect(output.args.prompt).toContain("DO NOT modify any files")
    })

    test("should inject read-only warning when Planner calls task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Research this library" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
    })

    test("should inject read-only warning when Planner calls call_omo_agent", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "call_omo_agent",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { prompt: "Find implementation examples" },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toContain(SYSTEM_DIRECTIVE_PREFIX)
    })

    test("should not double-inject warning if already present", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const promptWithWarning = `Some prompt ${SYSTEM_DIRECTIVE_PREFIX} already here`
      const output = {
        args: { prompt: promptWithWarning },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      const occurrences = (output.args.prompt as string).split(SYSTEM_DIRECTIVE_PREFIX).length - 1
      expect(occurrences).toBe(1)
    })
  })

  describe("with non-Planner agent in message storage", () => {
    beforeEach(() => {
      setupMessageStorage(TEST_SESSION_ID, "coder")
    })

    test("should not affect non-Planner agents", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should not inject warning for non-Planner agents calling task", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "task",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const originalPrompt = "Implement this feature"
      const output = {
        args: { prompt: originalPrompt },
      }

      // when
      await hook["tool.execute.before"](input, output)

      // then
      expect(output.args.prompt).toBe(originalPrompt)
      expect(output.args.prompt).not.toContain(SYSTEM_DIRECTIVE_PREFIX)
    })
  })

  describe("boulder state priority over message files (fixes #927)", () => {
    const BOULDER_DIR = join(tmpdir(), `boulder-test-${randomUUID()}`)
    const BOULDER_FILE = join(BOULDER_DIR, ".drizzy", "boulder.json")

    beforeEach(() => {
      mkdirSync(join(BOULDER_DIR, ".drizzy"), { recursive: true })
    })

    afterEach(() => {
      rmSync(BOULDER_DIR, { recursive: true, force: true })
    })

    //#given session was started with planner (first message), but /start-work set boulder agent to atlas
    //#when user types "continue" after interruption (memory cleared, falls back to message files)
    //#then should use boulder state agent (atlas), not message file agent (planner)
    test("should prioritize boulder agent over message file agent", async () => {
      // given - planner in message files (from /plan)
      setupMessageStorage(TEST_SESSION_ID, "planner")
      
      // given - atlas in boulder state (from /start-work)
      writeFileSync(BOULDER_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: [TEST_SESSION_ID],
        plan_name: "test-plan",
        agent: "atlas"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: BOULDER_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should NOT block because boulder says atlas, not planner
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })

    test("should use planner from boulder state when set", async () => {
      // given - atlas in message files (from some other agent)
      setupMessageStorage(TEST_SESSION_ID, "atlas")
      
      // given - planner in boulder state (edge case, but should honor it)
      writeFileSync(BOULDER_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: [TEST_SESSION_ID],
        plan_name: "test-plan",
        agent: "planner"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: BOULDER_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should block because boulder says planner
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })

    test("should fall back to message files when session not in boulder", async () => {
      // given - planner is still the effective session agent
      setSessionAgent(TEST_SESSION_ID, "planner")
      
      // given - boulder state exists but for different session
      writeFileSync(BOULDER_FILE, JSON.stringify({
        active_plan: "/test/plan.md",
        started_at: new Date().toISOString(),
        session_ids: ["ses_other_session_id"],
        plan_name: "test-plan",
        agent: "atlas"
      }))

      const hook = createPlannerMdOnlyHook({
        client: {},
        directory: BOULDER_DIR,
      } as never)

      const input = {
        tool: "Write",
        sessionID: TEST_SESSION_ID,
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/code.ts" },
      }

      // when / then - should block because falls back to message files (planner)
      await expect(
        hook["tool.execute.before"](input, output)
      ).rejects.toThrow("can only write/edit .md files")
    })
  })

  describe("without message storage", () => {
    test("should handle missing session gracefully (no agent found)", async () => {
      // given
      const hook = createPlannerMdOnlyHook(createMockPluginInput())
      const input = {
        tool: "Write",
        sessionID: "ses_non_existent_session",
        callID: "call-1",
      }
      const output = {
        args: { filePath: "/path/to/file.ts" },
      }

      // when / #then
      await expect(
        hook["tool.execute.before"](input, output)
      ).resolves.toBeUndefined()
    })
  })

  describe("cross-platform path validation", () => {
    beforeEach(() => {
      setSessionAgent(TEST_SESSION_ID, "planner")
    })

     test("should allow Windows-style backslash paths under .drizzy/", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".drizzy\\plans\\work-plan.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow mixed separator paths under .drizzy/", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".drizzy\\plans/work-plan.MD" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow uppercase .MD extension", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".drizzy/plans/work-plan.MD" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block paths outside workspace root even if containing .drizzy", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "/other/project/.drizzy/plans/x.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("can only write/edit .md files inside .drizzy/")
     })

     test("should allow nested .drizzy directories (ctx.directory may be parent)", async () => {
       // given - when ctx.directory is parent of actual project, path includes project name
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "src/.drizzy/plans/x.md" },
       }

       // when / #then - should allow because .drizzy is in path
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block path traversal attempts", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".drizzy/../secrets.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("can only write/edit .md files inside .drizzy/")
     })

     test("should allow case-insensitive .drizzy directory", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: ".drizzy/plans/work-plan.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow nested project path with .drizzy (Windows real-world case)", async () => {
       // given - simulates when ctx.directory is parent of actual project
       // User reported: xauusd-dxy-plan\.drizzy\drafts\supabase-email-templates.md
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "xauusd-dxy-plan\\.drizzy\\drafts\\supabase-email-templates.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should allow nested project path with mixed separators", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "my-project/.drizzy\\plans/task.md" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).resolves.toBeUndefined()
     })

     test("should block nested project path without .drizzy", async () => {
       // given
       const hook = createPlannerMdOnlyHook(createMockPluginInput())
       const input = {
         tool: "Write",
         sessionID: TEST_SESSION_ID,
         callID: "call-1",
       }
       const output = {
         args: { filePath: "my-project\\src\\code.ts" },
       }

       // when / #then
       await expect(
         hook["tool.execute.before"](input, output)
       ).rejects.toThrow("can only write/edit .md files")
     })
  })
})
