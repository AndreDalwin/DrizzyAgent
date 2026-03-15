import { describe, expect, test } from "bun:test"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomUUID } from "node:crypto"

import { isAllowedResearcherFile } from "./path-policy"
import { isResearcherAgent } from "./agent-matcher"

describe("researcher-research-only", () => {
  describe("#given isAllowedResearcherFile", () => {
    const workspaceRoot = join(tmpdir(), `researcher-test-${randomUUID()}`)

    describe("#when path is inside .drizzy/research/ with .md extension", () => {
      test("#then should allow .drizzy/research/topic/report.md", () => {
        //#given
        const filePath = ".drizzy/research/topic/report.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(true)
      })

      test("#then should allow .drizzy/research/report.md at research root", () => {
        //#given
        const filePath = ".drizzy/research/report.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(true)
      })

      test("#then should allow deeply nested .drizzy/research/a/b/c/notes.md", () => {
        //#given
        const filePath = ".drizzy/research/a/b/c/notes.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(true)
      })

      test("#then should allow uppercase .MD extension", () => {
        //#given
        const filePath = ".drizzy/research/topic/REPORT.MD"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(true)
      })
    })

    describe("#when path is outside .drizzy/research/", () => {
      test("#then should block src/index.ts", () => {
        //#given
        const filePath = "src/index.ts"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block package.json", () => {
        //#given
        const filePath = "package.json"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/plans/plan.md (outside research/)", () => {
        //#given
        const filePath = ".drizzy/plans/plan.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/drafts/notes.md (outside research/)", () => {
        //#given
        const filePath = ".drizzy/drafts/notes.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })
    })

    describe("#when path contains traversal attack", () => {
      test("#then should block .drizzy/research/../../etc/passwd", () => {
        //#given
        const filePath = ".drizzy/research/../../etc/passwd"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/research/../../../etc/shadow", () => {
        //#given
        const filePath = ".drizzy/research/../../../etc/shadow"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/research/../secrets.md (escapes research/)", () => {
        //#given
        const filePath = ".drizzy/research/../secrets.md"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block absolute path /etc/passwd", () => {
        //#given
        const filePath = "/etc/passwd"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })
    })

    describe("#when file has wrong extension", () => {
      test("#then should block .drizzy/research/topic/data.json", () => {
        //#given
        const filePath = ".drizzy/research/topic/data.json"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/research/topic/script.ts", () => {
        //#given
        const filePath = ".drizzy/research/topic/script.ts"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })

      test("#then should block .drizzy/research/topic/config.yaml", () => {
        //#given
        const filePath = ".drizzy/research/topic/config.yaml"

        //#when
        const result = isAllowedResearcherFile(filePath, workspaceRoot)

        //#then
        expect(result).toBe(false)
      })
    })
  })

  describe("#given isResearcherAgent", () => {
    describe("#when agent name matches researcher pattern", () => {
      test("#then should return true for 'researcher'", () => {
        //#given //#when
        const result = isResearcherAgent("researcher")

        //#then
        expect(result).toBe(true)
      })

      test("#then should return true for 'researcher-junior'", () => {
        //#given //#when
        const result = isResearcherAgent("researcher-junior")

        //#then
        expect(result).toBe(true)
      })

      test("#then should return true for uppercase 'RESEARCHER'", () => {
        //#given //#when
        const result = isResearcherAgent("RESEARCHER")

        //#then
        expect(result).toBe(true)
      })

      test("#then should return true for display name 'Researcher (Research Agent)'", () => {
        //#given //#when
        const result = isResearcherAgent("Researcher (Research Agent)")

        //#then
        expect(result).toBe(true)
      })
    })

    describe("#when agent name does not match researcher pattern", () => {
      test("#then should return false for 'coder'", () => {
        //#given //#when
        const result = isResearcherAgent("coder")

        //#then
        expect(result).toBe(false)
      })

      test("#then should return false for 'planner'", () => {
        //#given //#when
        const result = isResearcherAgent("planner")

        //#then
        expect(result).toBe(false)
      })

      test("#then should return false for undefined", () => {
        //#given //#when
        const result = isResearcherAgent(undefined)

        //#then
        expect(result).toBe(false)
      })

      test("#then should return false for empty string", () => {
        //#given //#when
        const result = isResearcherAgent("")

        //#then
        expect(result).toBe(false)
      })
    })
  })
})
