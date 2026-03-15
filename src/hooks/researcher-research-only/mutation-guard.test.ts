import { describe, expect, test } from "bun:test"

import { getResearcherMutationViolation } from "./mutation-guard"

const WORKSPACE_ROOT = "/workspace"

describe("getResearcherMutationViolation", () => {
  test("#given write/edit paths inside research output #then they are allowed", () => {
    expect(
      getResearcherMutationViolation(
        "Edit",
        { filePath: ".drizzy/research/topic/report.md" },
        WORKSPACE_ROOT
      )
    ).toBeNull()
  })

  test("#given edit rename escaping research output #then it is blocked", () => {
    expect(
      getResearcherMutationViolation(
        "Edit",
        {
          filePath: ".drizzy/research/topic/report.md",
          rename: "src/index.ts",
        },
        WORKSPACE_ROOT
      )
    ).toContain("Attempted path")
  })

  test("#given lsp_rename #then it is always blocked", () => {
    expect(
      getResearcherMutationViolation(
        "lsp_rename",
        { filePath: "src/index.ts", line: 1, character: 0, newName: "x" },
        WORKSPACE_ROOT
      )
    ).toContain("lsp_rename")
  })

  test("#given ast_grep_replace with dryRun false #then it is blocked", () => {
    expect(
      getResearcherMutationViolation(
        "ast_grep_replace",
        { pattern: "foo($X)", rewrite: "bar($X)", dryRun: false },
        WORKSPACE_ROOT
      )
    ).toContain("ast_grep_replace")
  })

  test("#given ast_grep_replace dry run #then it is allowed", () => {
    expect(
      getResearcherMutationViolation(
        "ast_grep_replace",
        { pattern: "foo($X)", rewrite: "bar($X)", dryRun: true },
        WORKSPACE_ROOT
      )
    ).toBeNull()
  })

  test("#given hashline_edit rename escaping research output #then it is blocked", () => {
    expect(
      getResearcherMutationViolation(
        "hashline_edit",
        {
          filePath: ".drizzy/research/topic/report.md",
          rename: ".drizzy/plans/plan.md",
          edits: [],
        },
        WORKSPACE_ROOT
      )
    ).toContain("Attempted path")
  })
})
