import { afterEach, describe, expect, it } from "bun:test"
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { loadPluginAgents } from "./agent-loader"
import type { LoadedPlugin } from "./types"

const createdDirs: string[] = []

afterEach(() => {
  for (const dir of createdDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true })
  }
})

describe("loadPluginAgents", () => {
  it("returns string model values for plugin agent frontmatter models", () => {
    const pluginRoot = mkdtempSync(join(tmpdir(), "claude-plugin-agent-loader-"))
    createdDirs.push(pluginRoot)

    const agentsDir = join(pluginRoot, "agents")
    mkdirSync(agentsDir, { recursive: true })
    writeFileSync(
      join(agentsDir, "helper.md"),
      `---
description: Plugin helper
model: anthropic/claude-opus-4-6
tools: read
---
Help with plugin tasks.
`
    )

    const plugin: LoadedPlugin = {
      name: "demo-plugin",
      version: "1.0.0",
      scope: "local",
      installPath: pluginRoot,
      pluginKey: "demo-plugin@local",
      agentsDir,
    }

    const agents = loadPluginAgents([plugin])

    expect(agents["demo-plugin:helper"]?.model).toBe("anthropic/claude-opus-4-6")
    expect(typeof agents["demo-plugin:helper"]?.model).toBe("string")
  })
})
