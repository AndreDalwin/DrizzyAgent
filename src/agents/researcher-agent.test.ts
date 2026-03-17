import { describe, expect, test } from "bun:test"

import { createResearcherAgent, RESEARCHER_PROMPT_METADATA } from "./researcher"

const CLAUDE_MODEL = "anthropic/claude-sonnet-4-5"
const GPT_MODEL = "openai/gpt-5.4"

describe("createResearcherAgent", () => {
  describe("#given a Claude model", () => {
    const agent = createResearcherAgent(CLAUDE_MODEL)
    const permission = agent.permission as Record<string, string>
    const prompt = agent.prompt as string

    test("#then mode is all in both factory and config", () => {
      expect(createResearcherAgent.mode).toBe("all")
      expect(agent.mode).toBe("all")
    })

    test("#then thinking is enabled with expected budget", () => {
      expect(agent.thinking).toEqual({ type: "enabled", budgetTokens: 16000 })
    })

    test("#then it denies unsafe mutation tools but allows task", () => {
      expect(permission["apply_patch"]).toBe("deny")
      expect(permission["ast_grep_replace"]).toBe("deny")
      expect(permission["lsp_rename"]).toBe("deny")
      expect(permission["hashline_edit"]).toBe("deny")
      expect(permission["task"]).toBeUndefined()
      expect(permission["write"]).toBeUndefined()
      expect(permission["edit"]).toBeUndefined()
    })

    test("#then prompt includes the shared run_directory contract", () => {
      expect(prompt).toContain("run_directory")
      expect(prompt).toContain(".drizzy/research/{slug}/")
      expect(prompt).not.toContain("{slug}-{YYYYMMDD-HHmmss}")
      expect(prompt).toContain("coding task")
      expect(prompt).toContain("Launch 1-3 Explore agents")
      expect(prompt).toContain("If no relevant local code, patterns, or prior art exist")
      expect(prompt).toContain("question tool first")
      expect(prompt).toContain("return the clarifying questions to the caller and stop until they are answered")
      expect(prompt).toContain("{run_directory}/report.md")
      expect(prompt).toContain("{run_directory}/findings")
    })

    test("#then metadata is populated", () => {
      expect(RESEARCHER_PROMPT_METADATA.category).toBe("exploration")
      expect(RESEARCHER_PROMPT_METADATA.cost).toBe("CHEAP")
      expect(RESEARCHER_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
      expect(RESEARCHER_PROMPT_METADATA.useWhen?.length).toBeGreaterThan(0)
      expect(RESEARCHER_PROMPT_METADATA.avoidWhen?.length).toBeGreaterThan(0)
    })
  })

  describe("#given a GPT model", () => {
    const agent = createResearcherAgent(GPT_MODEL)
    const prompt = agent.prompt as string

    test("#then it uses GPT reasoning settings", () => {
      expect(agent.reasoningEffort).toBe("medium")
      expect(agent.textVerbosity).toBe("high")
      expect(agent.thinking).toBeUndefined()
    })

    test("#then GPT prompt has no XML tags and keeps the run_directory contract", () => {
      expect(prompt).not.toMatch(/<\w+>/)
      expect(prompt).toContain("run_directory")
      expect(prompt).toContain(".drizzy/research/{slug}/")
      expect(prompt).not.toContain("{slug}-{YYYYMMDD-HHmmss}")
      expect(prompt).toContain("question tool first")
      expect(prompt).toContain("inspect the codebase first")
      expect(prompt).toContain("lightweight grounding pass")
      expect(prompt).toContain("Executive Summary")
      expect(prompt).toContain("Methodology")
    })
  })
})
