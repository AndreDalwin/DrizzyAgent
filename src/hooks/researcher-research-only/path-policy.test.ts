import { describe, expect, test } from "bun:test"
import { randomUUID } from "node:crypto"
import { tmpdir } from "node:os"
import { join } from "node:path"

import { isAllowedResearcherFile } from "./path-policy"

describe("isAllowedResearcherFile", () => {
  const workspaceRoot = join(tmpdir(), `researcher-test-${randomUUID()}`)

  test("#given a markdown file inside .drizzy/research #then it is allowed", () => {
    expect(isAllowedResearcherFile(".drizzy/research/topic/report.md", workspaceRoot)).toBe(true)
    expect(isAllowedResearcherFile(".drizzy/research/report.MD", workspaceRoot)).toBe(true)
  })

  test("#given a file outside research output #then it is blocked", () => {
    expect(isAllowedResearcherFile("src/index.ts", workspaceRoot)).toBe(false)
    expect(isAllowedResearcherFile(".drizzy/plans/plan.md", workspaceRoot)).toBe(false)
  })

  test("#given traversal attempts #then they are blocked", () => {
    expect(isAllowedResearcherFile(".drizzy/research/../../etc/passwd", workspaceRoot)).toBe(false)
    expect(isAllowedResearcherFile("/etc/passwd", workspaceRoot)).toBe(false)
  })

  test("#given wrong extensions #then they are blocked", () => {
    expect(isAllowedResearcherFile(".drizzy/research/topic/data.json", workspaceRoot)).toBe(false)
    expect(isAllowedResearcherFile(".drizzy/research/topic/script.ts", workspaceRoot)).toBe(false)
  })
})
