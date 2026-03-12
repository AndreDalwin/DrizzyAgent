import { describe, expect, test } from "bun:test"
import { createCoderAgent } from "./coder"
import { createGptcoderAgent } from "./gptcoder"
import { buildCoderJuniorPrompt } from "./coder-junior/agent"
import {
  buildAntiDuplicationSection,
  buildExploreSection,
  type AvailableAgent,
} from "./dynamic-agent-prompt-builder"

const exploreAgent = {
  name: "explore",
  description: "Contextual grep specialist",
  metadata: {
    category: "advisor",
    cost: "FREE",
    promptAlias: "Explore",
    triggers: [],
    useWhen: ["Multiple search angles needed"],
    avoidWhen: ["Single keyword search is enough"],
  },
} satisfies AvailableAgent

describe("delegation trust prompt rules", () => {
  test("buildAntiDuplicationSection explains overlap is forbidden", () => {
    // given
    const section = buildAntiDuplicationSection()

    // when / then
    expect(section).toContain("DO NOT perform the same search yourself")
    expect(section).toContain("non-overlapping work")
    expect(section).toContain("End your response")
  })

  test("buildExploreSection includes delegation trust rule", () => {
    // given
    const agents = [exploreAgent]

    // when
    const section = buildExploreSection(agents)

    // then
    expect(section).toContain("Delegation Trust Rule")
    expect(section).toContain("do **not** manually perform that same search yourself")
  })

  test("Coder prompt forbids duplicate delegated exploration", () => {
    // given
    const agent = createCoderAgent("anthropic/claude-sonnet-4-6", [exploreAgent])

    // when
    const prompt = agent.prompt

    // then
    expect(prompt).toContain("Continue only with non-overlapping work")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("GPTCoder prompt forbids duplicate delegated exploration", () => {
    // given
    const agent = createGptcoderAgent("openai/gpt-5.2", [exploreAgent])

    // when
    const prompt = agent.prompt

    // then
    expect(prompt).toContain("Continue only with non-overlapping work after launching background agents")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("GPTCoder GPT-5.4 prompt forbids duplicate delegated exploration", () => {
    // given
    const agent = createGptcoderAgent("openai/gpt-5.4", [exploreAgent])

    // when
    const prompt = agent.prompt

    // then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("Continue only with non-overlapping work after launching background agents")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("GPTCoder GPT-5.3 Codex prompt forbids duplicate delegated exploration", () => {
    // given
    const agent = createGptcoderAgent("openai/gpt-5.3-codex", [exploreAgent])

    // when
    const prompt = agent.prompt

    // then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("Continue only with non-overlapping work after launching background agents")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("Coder-Junior GPT prompt forbids duplicate delegated exploration", () => {
    // given
    const prompt = buildCoderJuniorPrompt("openai/gpt-5.2", false)

    // when / then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("Coder GPT-5.4 prompt forbids duplicate delegated exploration", () => {
    // given
    const agent = createCoderAgent("openai/gpt-5.4", [exploreAgent])

    // when
    const prompt = agent.prompt

    // then
    expect(prompt).toContain("do only non-overlapping work simultaneously")
    expect(prompt).toContain("Continue only with non-overlapping work")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("Coder-Junior GPT-5.4 prompt forbids duplicate delegated exploration", () => {
    // given
    const prompt = buildCoderJuniorPrompt("openai/gpt-5.4", false)

    // when / then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("Coder-Junior GPT-5.3 Codex prompt forbids duplicate delegated exploration", () => {
    // given
    const prompt = buildCoderJuniorPrompt("openai/gpt-5.3-codex", false)

    // when / then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })

  test("Coder-Junior Gemini prompt forbids duplicate delegated exploration", () => {
    // given
    const prompt = buildCoderJuniorPrompt("google/gemini-3.1-pro", false)

    // when / then
    expect(prompt).toContain("continue only with non-overlapping work while they search")
    expect(prompt).toContain("DO NOT perform the same search yourself")
  })
})
