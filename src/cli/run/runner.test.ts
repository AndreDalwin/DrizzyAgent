/// <reference types="bun-types" />

import { describe, it, expect } from "bun:test"
import type { DrizzyAgentConfig } from "../../config"
import { resolveRunAgent, waitForEventProcessorShutdown } from "./runner"

const createConfig = (overrides: Partial<DrizzyAgentConfig> = {}): DrizzyAgentConfig => ({
  ...overrides,
})

describe("resolveRunAgent", () => {
  it("uses CLI agent over env and config", () => {
    // given
    const config = createConfig({ default_run_agent: "planner" })
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" }

    // when
    const agent = resolveRunAgent(
  { message: "test", agent: "GPTCoder" },
      config,
      env
    )

    // then
    expect(agent).toBe("GPTCoder")
  })

  it("uses env agent over config", () => {
    // given
    const config = createConfig({ default_run_agent: "planner" })
    const env = { OPENCODE_DEFAULT_AGENT: "Atlas" }

    // when
    const agent = resolveRunAgent({ message: "test" }, config, env)

    // then
    expect(agent).toBe("Atlas (Plan Executor)")
  })

  it("uses config agent over default", () => {
    // given
    const config = createConfig({ default_run_agent: "Planner" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Planner")
  })

  it("falls back to coder when none set", () => {
    // given
    const config = createConfig()

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Coder")
  })

  it("skips disabled coder for next available core agent", () => {
    // given
    const config = createConfig({ disabled_agents: ["coder"] })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("GPTCoder")
  })

  it("maps display-name style default_run_agent values to canonical display names", () => {
    // given
    const config = createConfig({ default_run_agent: "Coder" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Coder")
  })

  it("resolves Researcher as a selectable main agent", () => {
    // given
    const config = createConfig({ default_run_agent: "Researcher" })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Researcher")
  })

  it("falls back to Researcher after other core agents are disabled", () => {
    // given
    const config = createConfig({
      disabled_agents: ["coder", "gptcoder", "planner", "atlas"],
    })

    // when
    const agent = resolveRunAgent({ message: "test" }, config, {})

    // then
    expect(agent).toBe("Researcher")
  })
})

describe("waitForEventProcessorShutdown", () => {

  it("returns quickly when event processor completes", async () => {
    //#given
    const eventProcessor = new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 25)
    })
    const start = performance.now()

    //#when
    await waitForEventProcessorShutdown(eventProcessor, 200)

    //#then
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(200)
  })

  it("times out and continues when event processor does not complete", async () => {
    //#given
    const eventProcessor = new Promise<void>(() => {})
    const timeoutMs = 200
    const start = performance.now()

    //#when
    await waitForEventProcessorShutdown(eventProcessor, timeoutMs)

    //#then
    const elapsed = performance.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(timeoutMs - 10)
  })
})
