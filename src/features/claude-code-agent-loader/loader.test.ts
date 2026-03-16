/// <reference types="bun-types" />

import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadProjectAgents } from "./loader"

const createdDirs: string[] = []

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("loadProjectAgents", () => {
  it("returns string model values for Claude frontmatter models", () => {
    const projectDir = mkdtempSync(join(tmpdir(), "claude-agent-loader-"))
    createdDirs.push(projectDir)

    const agentsDir = join(projectDir, ".claude", "agents")
    mkdirSync(agentsDir, { recursive: true })
    writeFileSync(
      join(agentsDir, "reviewer.md"),
      `---
name: Reviewer
description: Reviews code
model: sonnet
tools: read, grep
---
Review the code carefully.
`
    )

    const agents = loadProjectAgents(projectDir)

    expect(agents.Reviewer?.model).toBe("anthropic/claude-sonnet-4-6")
    expect(typeof agents.Reviewer?.model).toBe("string")
  })
})
