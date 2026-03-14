import type { FallbackEntry } from "../shared/model-requirements"
import type { ProviderAvailability } from "./model-fallback-types"
import { CLI_AGENT_MODEL_REQUIREMENTS } from "./model-fallback-requirements"
import { isProviderAvailable } from "./provider-availability"
import { transformModelForProvider } from "./provider-model-id-transform"

export function resolveModelFromChain(
	fallbackChain: FallbackEntry[],
	availability: ProviderAvailability
): { model: string; variant?: string } | null {
	for (const entry of fallbackChain) {
		// Always available entries are last-resort fallbacks that don't require provider auth
		if (entry.alwaysAvailable) {
			const provider = entry.providers[0]
			const transformedModel = transformModelForProvider(provider, entry.model)
			return {
				model: `${provider}/${transformedModel}`,
				variant: entry.variant,
			}
		}
		for (const provider of entry.providers) {
			if (isProviderAvailable(provider, availability)) {
				const transformedModel = transformModelForProvider(provider, entry.model)
				return {
					model: `${provider}/${transformedModel}`,
					variant: entry.variant,
				}
			}
		}
	}
	return null
}

export function getCoderFallbackChain(): FallbackEntry[] {
	return CLI_AGENT_MODEL_REQUIREMENTS.coder.fallbackChain
}

export function isAnyFallbackEntryAvailable(
	fallbackChain: FallbackEntry[],
	availability: ProviderAvailability
): boolean {
	return fallbackChain.some((entry) =>
		entry.alwaysAvailable || entry.providers.some((provider) => isProviderAvailable(provider, availability))
	)
}

export function isRequiredModelAvailable(
	requiresModel: string,
	fallbackChain: FallbackEntry[],
	availability: ProviderAvailability
): boolean {
	const matchingEntry = fallbackChain.find((entry) => entry.model === requiresModel)
	if (!matchingEntry) return false
	// Always available models are considered available regardless of provider auth
	if (matchingEntry.alwaysAvailable) return true
	return matchingEntry.providers.some((provider) => isProviderAvailable(provider, availability))
}

export function isRequiredProviderAvailable(
	requiredProviders: string[],
	availability: ProviderAvailability
): boolean {
	return requiredProviders.some((provider) => isProviderAvailable(provider, availability))
}
