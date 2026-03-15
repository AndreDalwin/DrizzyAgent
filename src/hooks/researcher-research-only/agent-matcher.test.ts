import { describe, expect, test } from "bun:test"

import { isResearcherAgent } from "./agent-matcher"

describe("isResearcherAgent", () => {
  test("#given researcher names #then they match", () => {
    expect(isResearcherAgent("researcher")).toBe(true)
    expect(isResearcherAgent("researcher-junior")).toBe(true)
    expect(isResearcherAgent("RESEARCHER")).toBe(true)
  })

  test("#given other agents #then they do not match", () => {
    expect(isResearcherAgent("coder")).toBe(false)
    expect(isResearcherAgent("planner")).toBe(false)
    expect(isResearcherAgent(undefined)).toBe(false)
    expect(isResearcherAgent("")).toBe(false)
  })
})
