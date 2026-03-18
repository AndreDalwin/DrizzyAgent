import { describe, expect, test } from "bun:test"

import {
  createResearcherJuniorAgent,
  RESEARCHER_JUNIOR_PROMPT_METADATA,
} from "./researcher-junior"

const CLAUDE_MODEL = "anthropic/claude-sonnet-4-5"
const GPT_MODEL = "openai/gpt-5.4"

describe("createResearcherJuniorAgent", () => {
  describe("#given a Claude model", () => {
    const agent = createResearcherJuniorAgent(CLAUDE_MODEL)
    const permission = agent.permission as Record<string, string>
    const prompt = agent.prompt as string

    test("#then mode is subagent in both factory and config", () => {
      expect(createResearcherJuniorAgent.mode).toBe("subagent")
      expect(agent.mode).toBe("subagent")
    })

    test("#then it includes focused worker settings", () => {
      expect(agent.temperature).toBe(0.1)
      expect(agent.color).toBe("#818CF8")
      expect(agent.thinking).toEqual({ type: "enabled", budgetTokens: 8000 })
    })

    test("#then it denies task and unsafe mutation tools", () => {
      expect(permission["task"]).toBe("deny")
      expect(permission["apply_patch"]).toBe("deny")
      expect(permission["ast_grep_replace"]).toBe("deny")
      expect(permission["lsp_rename"]).toBe("deny")
      expect(permission["hashline_edit"]).toBe("deny")
      expect(permission["write"]).toBeUndefined()
      expect(permission["edit"]).toBeUndefined()
    })

    test("#then prompt requires the shared run_directory contract", () => {
      expect(prompt).toContain("{run_directory}/findings/{sub-topic}-findings.md")
      expect(prompt).toContain("exact run_directory")
      expect(prompt).toContain("shared investigation folder")
      expect(prompt).not.toContain("timestamped folder")
      expect(prompt).toContain("missing contract")
    })

    test("#then prompt aligns with Researcher collection format", () => {
      expect(prompt).toContain("<metadata>")
      expect(prompt).toContain("parent_question")
      expect(prompt).toContain("completion_status")
      expect(prompt).toContain("related_sub_topics")
      expect(prompt).toContain("## Source Credibility Summary")
      expect(prompt).toContain("| Source | Authority | Recency | Bias Risk |")
      expect(prompt).toContain("## Contradictions Detected")
      expect(prompt).toContain("## Synthesis Notes for Parent Agent")
    })

    test("#then prompt requires source credibility pre-filtering", () => {
      expect(prompt).toContain("Domain authority")
      expect(prompt).toContain(".edu/.gov/.org")
      expect(prompt).toContain("published or updated within the last 2 years for tech topics")
      expect(prompt).toContain("Bias indicators")
      expect(prompt).toContain("HIGH authority sources first")
    })

    test("#then metadata is populated", () => {
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.category).toBe("exploration")
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.cost).toBe("CHEAP")
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.useWhen?.length).toBeGreaterThan(0)
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.avoidWhen?.length).toBeGreaterThan(0)
    })
  })

  describe("#given a GPT model", () => {
    const agent = createResearcherJuniorAgent(GPT_MODEL)
    const prompt = agent.prompt as string

    test("#then it uses GPT reasoning settings", () => {
      expect(agent.reasoningEffort).toBe("low")
      expect(agent.textVerbosity).toBe("high")
      expect(agent.thinking).toBeUndefined()
    })

    test("#then GPT prompt has no XML tags", () => {
      expect(prompt).not.toMatch(/<\w+>/)
      expect(prompt).toContain("run_directory")
      expect(prompt).toContain("findings")
      expect(prompt).toContain("parent_question")
      expect(prompt).toContain("completion_status")
      expect(prompt).toContain("Source Credibility Summary")
      expect(prompt).toContain("Source, Authority, Recency, Bias Risk")
      expect(prompt).toContain("Contradictions Detected")
      expect(prompt).toContain("Synthesis Notes for Parent Agent")
      expect(prompt).toContain(".edu, .gov, .org")
      expect(prompt).toContain("last 2 years")
      expect(prompt).toContain("marketing pages, sponsored posts, affiliate content")
    })
  })
})
