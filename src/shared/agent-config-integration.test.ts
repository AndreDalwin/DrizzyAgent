/// <reference types="bun-types" />
import { describe, test, expect } from "bun:test"
import { migrateAgentNames } from "./migration"
import { getAgentDisplayName } from "./agent-display-names"
import { AGENT_MODEL_REQUIREMENTS } from "./model-requirements"

describe("Agent Config Integration", () => {
  describe("Old format config migration", () => {
    test("migrates old format agent keys to lowercase", () => {
      // given - config with old format keys
      const oldConfig = {
        Coder: { model: "anthropic/claude-opus-4-6" },
        Atlas: { model: "anthropic/claude-opus-4-6" },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
        "Plan Consultant": { model: "anthropic/claude-sonnet-4-6" },
        "Plan Reviewer": { model: "anthropic/claude-sonnet-4-6" },
      }

      // when - migration is applied
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("coder")
      expect(result.migrated).toHaveProperty("atlas")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("plan-consultant")
      expect(result.migrated).toHaveProperty("plan-reviewer")

      // then - old keys are removed
      expect(result.migrated).not.toHaveProperty("Coder")
      expect(result.migrated).not.toHaveProperty("Atlas")
      expect(result.migrated).not.toHaveProperty("Prometheus (Planner)")
      expect(result.migrated).not.toHaveProperty("Plan Consultant")
      expect(result.migrated).not.toHaveProperty("Plan Reviewer")

      // then - values are preserved
      expect(result.migrated.drizzy).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.atlas).toEqual({ model: "anthropic/claude-opus-4-6" })
      expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-6" })
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })

    test("preserves already lowercase keys", () => {
      // given - config with lowercase keys
      const config = {
        coder: { model: "anthropic/claude-opus-4-6" },
        oracle: { model: "openai/gpt-5.4" },
        librarian: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(config)

      // then - keys remain unchanged
      expect(result.migrated).toEqual(config)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)
    })

    test("handles mixed case config", () => {
      // given - config with mixed old and new format
      const mixedConfig = {
        Coder: { model: "anthropic/claude-opus-4-6" },
        oracle: { model: "openai/gpt-5.4" },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
        librarian: { model: "opencode/big-pickle" },
      }

      // when - migration is applied
      const result = migrateAgentNames(mixedConfig)

      // then - all keys are lowercase
      expect(result.migrated).toHaveProperty("coder")
      expect(result.migrated).toHaveProperty("oracle")
      expect(result.migrated).toHaveProperty("planner")
      expect(result.migrated).toHaveProperty("librarian")
      expect(Object.keys(result.migrated).every((key) => key === key.toLowerCase())).toBe(true)
      
      // then - changed flag is true
      expect(result.changed).toBe(true)
    })
  })

  describe("Display name resolution", () => {
    test("returns correct display names for all builtin agents", () => {
      // given - lowercase config keys
      const agents = ["coder", "atlas", "planner", "planConsultant", "planReviewer", "oracle", "librarian", "explore", "multimodal-looker"]

      // when - display names are requested
      const displayNames = agents.map((agent) => getAgentDisplayName(agent))

      // then - display names are correct
      expect(displayNames).toContain("Coder (Ultraworker)")
      expect(displayNames).toContain("Atlas (Plan Executor)")
      expect(displayNames).toContain("Planner")
      expect(displayNames).toContain("Plan Consultant")
      expect(displayNames).toContain("Plan Reviewer")
      expect(displayNames).toContain("oracle")
      expect(displayNames).toContain("librarian")
      expect(displayNames).toContain("explore")
      expect(displayNames).toContain("multimodal-looker")
    })

    test("handles lowercase keys case-insensitively", () => {
      // given - various case formats of lowercase keys
      const keys = ["Coder", "Atlas", "CODER", "atlas", "planner", "PLANNER"]

      // when - display names are requested
      const displayNames = keys.map((key) => getAgentDisplayName(key))

      // then - correct display names are returned
      expect(displayNames[0]).toBe("Coder (Ultraworker)")
      expect(displayNames[1]).toBe("Atlas (Plan Executor)")
      expect(displayNames[2]).toBe("Coder (Ultraworker)")
      expect(displayNames[3]).toBe("Atlas (Plan Executor)")
      expect(displayNames[4]).toBe("Planner")
      expect(displayNames[5]).toBe("Planner")
    })

    test("returns original key for unknown agents", () => {
      // given - unknown agent key
      const unknownKey = "custom-agent"

      // when - display name is requested
      const displayName = getAgentDisplayName(unknownKey)

      // then - original key is returned
      expect(displayName).toBe(unknownKey)
    })
  })

  describe("Model requirements integration", () => {
    test("all model requirements use lowercase keys", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking key format
      const allLowercase = agentKeys.every((key) => key === key.toLowerCase())

      // then - all keys are lowercase
      expect(allLowercase).toBe(true)
    })

    test("model requirements include all builtin agents", () => {
      // given - expected builtin agents
      const expectedAgents = ["coder", "atlas", "planner", "planConsultant", "planReviewer", "oracle", "librarian", "explore", "multimodal-looker"]

      // when - checking AGENT_MODEL_REQUIREMENTS
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // then - all expected agents are present
      for (const agent of expectedAgents) {
        expect(agentKeys).toContain(agent)
      }
    })

    test("no uppercase keys in model requirements", () => {
      // given - AGENT_MODEL_REQUIREMENTS object
      const agentKeys = Object.keys(AGENT_MODEL_REQUIREMENTS)

      // when - checking for uppercase keys
      const uppercaseKeys = agentKeys.filter((key) => key !== key.toLowerCase())

      // then - no uppercase keys exist
      expect(uppercaseKeys).toEqual([])
    })
  })

  describe("End-to-end config flow", () => {
    test("old config migrates and displays correctly", () => {
      // given - old format config
      const oldConfig = {
        Coder: { model: "anthropic/claude-opus-4-6", temperature: 0.1 },
        "Prometheus (Planner)": { model: "anthropic/claude-opus-4-6" },
      }

      // when - config is migrated
      const result = migrateAgentNames(oldConfig)

      // then - keys are lowercase
      expect(result.migrated).toHaveProperty("coder")
        expect(result.migrated).toHaveProperty("planner")

      // when - display names are retrieved
      const coderDisplay = getAgentDisplayName("coder")
        const plannerDisplay = getAgentDisplayName("planner")

      // then - display names are correct
      expect(coderDisplay).toBe("Coder (Ultraworker)")
        expect(plannerDisplay).toBe("Planner")

      // then - config values are preserved
      expect(result.migrated.drizzy).toEqual({ model: "anthropic/claude-opus-4-6", temperature: 0.1 })
        expect(result.migrated.planner).toEqual({ model: "anthropic/claude-opus-4-6" })
    })

    test("new config works without migration", () => {
      // given - new format config (already lowercase)
      const newConfig = {
        coder: { model: "anthropic/claude-opus-4-6" },
        atlas: { model: "anthropic/claude-opus-4-6" },
      }

      // when - migration is applied (should be no-op)
      const result = migrateAgentNames(newConfig)

      // then - config is unchanged
      expect(result.migrated).toEqual(newConfig)
      
      // then - changed flag is false
      expect(result.changed).toBe(false)

      // when - display names are retrieved
      const coderDisplay = getAgentDisplayName("coder")
      const atlasDisplay = getAgentDisplayName("atlas")

      // then - display names are correct
      expect(coderDisplay).toBe("Coder (Ultraworker)")
      expect(atlasDisplay).toBe("Atlas (Plan Executor)")
    })
  })
})
