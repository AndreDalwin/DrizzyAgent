import { describe, test, expect } from "bun:test"
import {
  createResearcherAgent,
  RESEARCHER_PROMPT_METADATA,
} from "./researcher"
import {
  createResearcherJuniorAgent,
  RESEARCHER_JUNIOR_PROMPT_METADATA,
} from "./researcher-junior"

const CLAUDE_MODEL = "anthropic/claude-sonnet-4-5"
const GPT_MODEL = "openai/gpt-5.4"

describe("createResearcherAgent", () => {
  describe("#given a Claude model", () => {
    const agent = createResearcherAgent(CLAUDE_MODEL)

    describe("#when inspecting agent config", () => {
      test("#then mode is subagent", () => {
        expect(createResearcherAgent.mode).toBe("subagent")
      })

      test("#then temperature is 0.1", () => {
        expect(agent.temperature).toBe(0.1)
      })

      test("#then thinking is enabled", () => {
        expect(agent.thinking).toEqual({
          type: "enabled",
          budgetTokens: 16000,
        })
      })
    })

    describe("#when inspecting prompt content", () => {
      const prompt = agent.prompt as string

      test("#then contains Executive Summary section", () => {
        expect(prompt).toContain("Executive Summary")
      })

      test("#then contains sub-question planning", () => {
        expect(prompt).toContain("sub-question")
      })

      test("#then contains confidence tagging", () => {
        expect(prompt).toContain("confidence")
      })

      test("#then contains Sources section", () => {
        expect(prompt).toContain("Sources")
      })

      test("#then contains Methodology section", () => {
        expect(prompt).toContain("Methodology")
      })

      test("#then uses XML tags for Claude", () => {
        expect(prompt).toContain("<workflow>")
      })
    })

    describe("#when inspecting tool permissions", () => {
      const permission = agent.permission as Record<string, string>

      test("#then denies apply_patch", () => {
        expect(permission["apply_patch"]).toBe("deny")
      })

      test("#then denies call_omo_agent", () => {
        expect(permission["call_omo_agent"]).toBe("deny")
      })

      test("#then denies interactive_bash", () => {
        expect(permission["interactive_bash"]).toBe("deny")
      })

      test("#then denies Bash", () => {
        expect(permission["Bash"]).toBe("deny")
      })

      test("#then does NOT deny write/edit tools", () => {
        expect(permission["write"]).toBeUndefined()
        expect(permission["edit"]).toBeUndefined()
      })

      test("#then does NOT deny task tool (can delegate)", () => {
        expect(permission["task"]).toBeUndefined()
      })
    })
  })

  describe("#given a GPT model", () => {
    const agent = createResearcherAgent(GPT_MODEL)

    describe("#when inspecting agent config", () => {
      test("#then has reasoningEffort instead of thinking", () => {
        expect((agent as Record<string, unknown>).reasoningEffort).toBe(
          "medium"
        )
        expect(agent.thinking).toBeUndefined()
      })

      test("#then temperature is 0.1", () => {
        expect(agent.temperature).toBe(0.1)
      })
    })

    describe("#when inspecting prompt content", () => {
      const prompt = agent.prompt as string

      test("#then has no XML tags", () => {
        expect(prompt).not.toMatch(/<\w+>/)
        expect(prompt).not.toMatch(/<\/\w+>/)
      })

      test("#then still contains key research sections", () => {
        expect(prompt).toContain("Executive Summary")
        expect(prompt).toContain("Sources")
        expect(prompt).toContain("Methodology")
      })
    })
  })
})

describe("createResearcherJuniorAgent", () => {
  describe("#given a default model", () => {
    const agent = createResearcherJuniorAgent(CLAUDE_MODEL)

    describe("#when inspecting agent config", () => {
      test("#then mode is subagent", () => {
        expect(createResearcherJuniorAgent.mode).toBe("subagent")
      })

      test("#then temperature is 0.1", () => {
        expect(agent.temperature).toBe(0.1)
      })
    })

    describe("#when inspecting prompt content", () => {
      const prompt = agent.prompt as string

      test("#then contains findings", () => {
        expect(prompt).toContain("findings")
      })
    })

    describe("#when inspecting tool permissions", () => {
      const permission = agent.permission as Record<string, string>

      test("#then denies task tool (no sub-sub-delegation)", () => {
        expect(permission["task"]).toBe("deny")
      })

      test("#then denies apply_patch", () => {
        expect(permission["apply_patch"]).toBe("deny")
      })

      test("#then denies call_omo_agent", () => {
        expect(permission["call_omo_agent"]).toBe("deny")
      })

      test("#then denies interactive_bash", () => {
        expect(permission["interactive_bash"]).toBe("deny")
      })

      test("#then denies Bash", () => {
        expect(permission["Bash"]).toBe("deny")
      })

      test("#then does NOT deny write/edit tools", () => {
        expect(permission["write"]).toBeUndefined()
        expect(permission["edit"]).toBeUndefined()
      })
    })
  })
})

describe("Researcher prompt metadata", () => {
  describe("#given RESEARCHER_PROMPT_METADATA", () => {
    test("#then category is exploration", () => {
      expect(RESEARCHER_PROMPT_METADATA.category).toBe("exploration")
    })

    test("#then cost is CHEAP", () => {
      expect(RESEARCHER_PROMPT_METADATA.cost).toBe("CHEAP")
    })

    test("#then has non-empty triggers", () => {
      expect(RESEARCHER_PROMPT_METADATA.triggers.length).toBeGreaterThan(0)
    })

    test("#then has non-empty useWhen", () => {
      expect(RESEARCHER_PROMPT_METADATA.useWhen!.length).toBeGreaterThan(0)
    })

    test("#then has non-empty avoidWhen", () => {
      expect(RESEARCHER_PROMPT_METADATA.avoidWhen!.length).toBeGreaterThan(0)
    })
  })

  describe("#given RESEARCHER_JUNIOR_PROMPT_METADATA", () => {
    test("#then category is exploration", () => {
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.category).toBe("exploration")
    })

    test("#then cost is CHEAP", () => {
      expect(RESEARCHER_JUNIOR_PROMPT_METADATA.cost).toBe("CHEAP")
    })

    test("#then has non-empty triggers", () => {
      expect(
        RESEARCHER_JUNIOR_PROMPT_METADATA.triggers.length
      ).toBeGreaterThan(0)
    })

    test("#then has non-empty useWhen", () => {
      expect(
        RESEARCHER_JUNIOR_PROMPT_METADATA.useWhen!.length
      ).toBeGreaterThan(0)
    })

    test("#then has non-empty avoidWhen", () => {
      expect(
        RESEARCHER_JUNIOR_PROMPT_METADATA.avoidWhen!.length
      ).toBeGreaterThan(0)
    })
  })
})
