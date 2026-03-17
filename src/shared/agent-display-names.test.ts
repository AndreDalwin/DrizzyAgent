/// <reference types="bun-types" />
import { describe, it, expect } from "bun:test"
import { AGENT_DISPLAY_NAMES, getAgentDisplayName, getAgentConfigKey } from "./agent-display-names"

describe("getAgentDisplayName", () => {
  it("returns display name for lowercase config key (new format)", () => {
    // given config key "coder"
    const configKey = "coder"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Coder"
    expect(result).toBe("Coder")
  })

  it("returns display name for uppercase config key (old format - case-insensitive)", () => {
    // given config key "Coder" (old format)
    const configKey = "Coder"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Coder" (case-insensitive lookup)
    expect(result).toBe("Coder")
  })

  it("returns original key for unknown agents (fallback)", () => {
    // given config key "custom-agent"
    const configKey = "custom-agent"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "custom-agent" (original key unchanged)
    expect(result).toBe("custom-agent")
  })

  it("returns display name for atlas", () => {
    // given config key "atlas"
    const configKey = "atlas"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

     // then returns "Atlas (Plan Executor)"
    expect(result).toBe("Atlas (Plan Executor)")
  })

  it("returns display name for planner", () => {
    // given config key "planner"
    const configKey = "planner"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Planner"
    expect(result).toBe("Planner")
  })

  it("returns display name for coder-junior", () => {
    // given config key "coder-junior"
    const configKey = "coder-junior"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Coder Junior"
    expect(result).toBe("Coder Junior")
  })

  it("returns display name for planConsultant", () => {
    // given config key "planConsultant"
    const configKey = "planConsultant"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "Plan Consultant"
    expect(result).toBe("Plan Consultant")
  })

  it("returns display name for planReviewer", () => {
    // given config key "planReviewer"
    const configKey = "planReviewer"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

     // then returns "Plan Reviewer"
    expect(result).toBe("Plan Reviewer")
  })

  it("returns display name for oracle", () => {
    // given config key "oracle"
    const configKey = "oracle"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "oracle"
    expect(result).toBe("oracle")
  })

  it("returns display name for librarian", () => {
    // given config key "librarian"
    const configKey = "librarian"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "librarian"
    expect(result).toBe("librarian")
  })

  it("returns display name for explore", () => {
    // given config key "explore"
    const configKey = "explore"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "explore"
    expect(result).toBe("explore")
  })

  it("returns display name for multimodal-looker", () => {
    // given config key "multimodal-looker"
    const configKey = "multimodal-looker"

    // when getAgentDisplayName called
    const result = getAgentDisplayName(configKey)

    // then returns "multimodal-looker"
    expect(result).toBe("multimodal-looker")
  })
})

describe("getAgentConfigKey", () => {
  it("resolves display name to config key", () => {
    // given display name "Coder"
    // when getAgentConfigKey called
    // then returns "coder"
    expect(getAgentConfigKey("Coder")).toBe("coder")
  })

  it("resolves display name case-insensitively", () => {
    // given display name in different case
    // when getAgentConfigKey called
    // then returns "atlas"
    expect(getAgentConfigKey("atlas (plan executor)")).toBe("atlas")
  })

  it("passes through lowercase config keys unchanged", () => {
    // given lowercase config key "planner"
    // when getAgentConfigKey called
    // then returns "planner"
    expect(getAgentConfigKey("planner")).toBe("planner")
  })

  it("returns lowercased unknown agents", () => {
    // given unknown agent name
    // when getAgentConfigKey called
    // then returns lowercased
    expect(getAgentConfigKey("Custom-Agent")).toBe("custom-agent")
  })

  it("resolves all core agent display names", () => {
    // given all core display names
    // when/then each resolves to its config key
    expect(getAgentConfigKey("GPTCoder")).toBe("gptcoder")
    expect(getAgentConfigKey("Planner")).toBe("planner")
    expect(getAgentConfigKey("Atlas (Plan Executor)")).toBe("atlas")
    expect(getAgentConfigKey("Plan Consultant")).toBe("planConsultant")
    expect(getAgentConfigKey("Plan Reviewer")).toBe("planReviewer")
    expect(getAgentConfigKey("Coder Junior")).toBe("coder-junior")
  })

  it("resolves kebab-case plan-consultant to camelCase", () => {
    // given kebab-case agent name
    // when getAgentConfigKey called
    // then returns camelCase config key for AGENT_MODEL_REQUIREMENTS lookup
    expect(getAgentConfigKey("plan-consultant")).toBe("planConsultant")
  })

  it("resolves kebab-case plan-reviewer to camelCase", () => {
    // given kebab-case agent name
    // when getAgentConfigKey called
    // then returns camelCase config key for AGENT_MODEL_REQUIREMENTS lookup
    expect(getAgentConfigKey("plan-reviewer")).toBe("planReviewer")
  })
})

describe("AGENT_DISPLAY_NAMES", () => {
  it("contains all expected agent mappings", () => {
    // given expected mappings
    const expectedMappings = {
      coder: "Coder",
      gptcoder: "GPTCoder",
      planner: "Planner",
      atlas: "Atlas (Plan Executor)",
      "coder-junior": "Coder Junior",
      researcher: "Researcher",
      "researcher-junior": "Researcher Junior",
      planConsultant: "Plan Consultant",
      planReviewer: "Plan Reviewer",
      oracle: "oracle",
      librarian: "librarian",
      explore: "explore",
      "multimodal-looker": "multimodal-looker",
    }

    // when checking the constant
    // then contains all expected mappings
    expect(AGENT_DISPLAY_NAMES).toEqual(expectedMappings)
  })
})
