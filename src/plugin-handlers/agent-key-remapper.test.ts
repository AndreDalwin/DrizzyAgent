import { describe, it, expect } from "bun:test"
import { remapAgentKeysToDisplayNames } from "./agent-key-remapper"

describe("remapAgentKeysToDisplayNames", () => {
  it("remaps known agent keys to display names", () => {
    // given agents with lowercase keys
    const agents = {
      coder: { prompt: "test", mode: "primary" },
      oracle: { prompt: "test", mode: "subagent" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then known agents get display name keys only
    expect(result["Coder"]).toBeDefined()
    expect(result["oracle"]).toBeDefined()
    expect(result["coder"]).toBeUndefined()
  })

  it("preserves unknown agent keys unchanged", () => {
    // given agents with a custom key
    const agents = {
      "custom-agent": { prompt: "custom" },
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then custom key is unchanged
    expect(result["custom-agent"]).toBeDefined()
  })

  it("remaps all core agents to display names", () => {
    // given all core agents
    const agents = {
      coder: {},
      gptcoder: {},
      planner: {},
      orchestrator: {},
      planConsultant: {},
      planReviewer: {},
      "coder-junior": {},
    }

    // when remapping
    const result = remapAgentKeysToDisplayNames(agents)

    // then all get display name keys without lowercase duplicates
    expect(result["Coder"]).toBeDefined()
    expect(result["coder"]).toBeUndefined()
    expect(result["GPTCoder"]).toBeDefined()
    expect(result["gptcoder"]).toBeUndefined()
    expect(result["Planner"]).toBeDefined()
    expect(result["planner"]).toBeUndefined()
    expect(result["Orchestrator"]).toBeDefined()
    expect(result["orchestrator"]).toBeUndefined()
    expect(result["Plan Consultant"]).toBeDefined()
    expect(result["planConsultant"]).toBeUndefined()
    expect(result["Plan Reviewer"]).toBeDefined()
    expect(result["planReviewer"]).toBeUndefined()
    expect(result["Coder Junior"]).toBeDefined()
    expect(result["coder-junior"]).toBeUndefined()
  })
})
