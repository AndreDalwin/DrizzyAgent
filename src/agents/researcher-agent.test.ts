/// <reference types="bun-types" />

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

    test("#then prompt uses phased reasoning and dynamic researcher-junior deployment", () => {
      expect(prompt).toContain('<reasoning_phase name="planning">')
      expect(prompt).toContain('<reasoning_phase name="execution">')
      expect(prompt).toContain('<reasoning_phase name="verification">')
      expect(prompt).toContain("Tree-of-Thoughts")
      expect(prompt).toContain("<complexity_check>")
      expect(prompt).toContain("STRAIGHTFORWARD")
      expect(prompt).toContain("STANDARD")
      expect(prompt).toContain("DEEP")
      expect(prompt).toContain("3-4 Researcher-Junior agents")
      expect(prompt).toContain("5-6 Researcher-Junior agents")
      expect(prompt).toContain("7-10 Researcher-Junior agents")
      expect(prompt).toContain("do NOT count toward the Researcher-Junior target range")
      expect(prompt).not.toContain("at least 5 Researcher-Junior subagents")
      expect(prompt).not.toContain("at least 5 focused sub-questions")
    })

    test("#then prompt includes explicit conflict resolution guidance", () => {
      expect(prompt).toContain("<conflict_resolution>")
      expect(prompt).toContain("Credibility")
      expect(prompt).toContain("Recency")
      expect(prompt).toContain("Confidence")
      expect(prompt).toContain("Context")
      expect(prompt).toContain("conflicting findings")
      expect(prompt).toContain("no upper limit")
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

    test("#then GPT prompt mirrors phased reasoning and dynamic researcher-junior deployment", () => {
      expect(prompt).toContain("Planning phase:")
      expect(prompt).toContain("Execution phase:")
      expect(prompt).toContain("Verification phase:")
      expect(prompt).toContain("Tree-of-Thoughts")
      expect(prompt).toContain("Complexity check:")
      expect(prompt).toContain("STRAIGHTFORWARD")
      expect(prompt).toContain("STANDARD")
      expect(prompt).toContain("DEEP")
      expect(prompt).toContain("3-4 Researcher-Junior agents")
      expect(prompt).toContain("5-6 Researcher-Junior agents")
      expect(prompt).toContain("7-10 Researcher-Junior agents")
      expect(prompt).toContain("do not count toward the Researcher-Junior target range")
      expect(prompt).not.toContain("at least 5 Researcher-Junior subagents")
      expect(prompt).not.toContain("at least 5 focused sub-questions")
    })

    test("#then GPT prompt includes prose-only conflict resolution guidance", () => {
      expect(prompt).toContain("Conflict resolution protocol:")
      expect(prompt).toContain("credibility, recency, confidence, context")
      expect(prompt).toContain("conflicting findings")
      expect(prompt).toContain("no upper limit")
    })
  })
})
