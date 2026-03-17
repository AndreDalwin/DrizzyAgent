import { describe, expect, test } from "bun:test"

import { resolveModelFromChain } from "./fallback-chain-resolution"
import type { FallbackEntry } from "../shared/agent-model-defaults"
import type { ProviderAvailability } from "./model-fallback-types"

function createAvailability(overrides: Partial<ProviderAvailability> = {}): ProviderAvailability {
	return {
		native: { claude: false, openai: false, gemini: false },
		opencodeZen: false,
		copilot: false,
		zai: false,
		kimiForCoding: false,
		isMaxPlan: false,
		...overrides,
	}
}

describe("resolveModelFromChain", () => {
	describe("#given a chain where alwaysAvailable entry appears before a provider-gated entry", () => {
		describe("#when resolving with the provider-gated entry's provider available", () => {
			test("#then the provider-gated entry is selected, NOT the alwaysAvailable entry", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["opencode"], model: "free-model", alwaysAvailable: true },
					{ providers: ["anthropic"], model: "paid-model" },
				]

				const availability = createAvailability({ native: { claude: true, openai: false, gemini: false } })

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "anthropic/paid-model" })
			})
		})

		describe("#when no providers are available", () => {
			test("#then alwaysAvailable IS used as last resort", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["opencode"], model: "free-model", alwaysAvailable: true },
					{ providers: ["anthropic"], model: "paid-model" },
				]

				const availability = createAvailability()

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "opencode/free-model" })
			})
		})
	})

	describe("#given a chain with multiple alwaysAvailable entries", () => {
		describe("#when no providers are available", () => {
			test("#then the first alwaysAvailable entry is selected", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["anthropic"], model: "paid-model" },
					{ providers: ["opencode"], model: "first-free", alwaysAvailable: true },
					{ providers: ["opencode"], model: "second-free", alwaysAvailable: true },
				]

				const availability = createAvailability()

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "opencode/first-free" })
			})
		})
	})

	describe("#given a chain with variant information", () => {
		describe("#when resolving a provider-gated entry with variant", () => {
			test("#then the variant is preserved in the result", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["anthropic"], model: "claude-opus-4-6", variant: "max" },
				]

				const availability = createAvailability({ native: { claude: true, openai: false, gemini: false } })

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "anthropic/claude-opus-4-6", variant: "max" })
			})
		})

		describe("#when resolving an alwaysAvailable entry with variant", () => {
			test("#then the variant is preserved in the result", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["opencode"], model: "free-model", variant: "lite", alwaysAvailable: true },
				]

				const availability = createAvailability()

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "opencode/free-model", variant: "lite" })
			})
		})
	})

	describe("#given an empty chain", () => {
		describe("#when resolving", () => {
			test("#then null is returned", () => {
				const chain: FallbackEntry[] = []

				const availability = createAvailability({ native: { claude: true, openai: false, gemini: false } })

				const result = resolveModelFromChain(chain, availability)

				expect(result).toBeNull()
			})
		})
	})

	describe("#given a chain with multiple provider options in a single entry", () => {
		describe("#when the first provider is not available but the second is", () => {
			test("#then the entry is selected using the available provider", () => {
				const chain: FallbackEntry[] = [
					{ providers: ["anthropic", "openai"], model: "gpt-5.4" },
				]

				const availability = createAvailability({ native: { claude: false, openai: true, gemini: false } })

				const result = resolveModelFromChain(chain, availability)

				expect(result).toEqual({ model: "openai/gpt-5.4" })
			})
		})
	})
})
