import { describe, expect, test } from "bun:test"

import { AGENT_MODEL_DEFAULTS, CATEGORY_MODEL_DEFAULTS } from "./agent-model-defaults"

describe("Agent and Category Model Defaults Chain Ordering", () => {
	describe("#given all agent and category model default chains", () => {
		describe("#when checking alwaysAvailable entry positions", () => {
			test("#then all alwaysAvailable entries should appear after all non-alwaysAvailable entries in agent chains", () => {
				for (const [agentName, agentDefault] of Object.entries(AGENT_MODEL_DEFAULTS)) {
					const chain = agentDefault.chain

					let foundAlwaysAvailable = false
					for (const entry of chain) {
						if (entry.alwaysAvailable) {
							foundAlwaysAvailable = true
						} else if (foundAlwaysAvailable) {
							throw new Error(
								`Agent "${agentName}": non-alwaysAvailable entry found after alwaysAvailable entry. ` +
									`Chain order violation at model "${entry.model}". ` +
									`All alwaysAvailable entries must appear at the end of the chain.`,
							)
						}
					}
				}

				expect(true).toBe(true)
			})

			test("#then all alwaysAvailable entries should appear after all non-alwaysAvailable entries in category chains", () => {
				for (const [categoryName, categoryDefault] of Object.entries(CATEGORY_MODEL_DEFAULTS)) {
					const chain = categoryDefault.chain

					let foundAlwaysAvailable = false
					for (const entry of chain) {
						if (entry.alwaysAvailable) {
							foundAlwaysAvailable = true
						} else if (foundAlwaysAvailable) {
							throw new Error(
								`Category "${categoryName}": non-alwaysAvailable entry found after alwaysAvailable entry. ` +
									`Chain order violation at model "${entry.model}". ` +
									`All alwaysAvailable entries must appear at the end of the chain.`,
							)
						}
					}
				}

				expect(true).toBe(true)
			})
		})
	})
})
