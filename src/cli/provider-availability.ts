import type { InstallConfig } from "./types"
import type { ProviderAvailability } from "./model-fallback-types"
import type { InstallDefaultsProviders } from "../shared/install-defaults-contract"
import { toComputedProviderAvailability } from "../shared/computed-install-defaults"

export function toInstallDefaultsProviders(config: InstallConfig): InstallDefaultsProviders {
	return {
		claude: config.hasClaude ? (config.isMax20 ? "max20" : "yes") : "no",
		openai: config.hasOpenAI,
		gemini: config.hasGemini,
		copilot: config.hasCopilot,
		opencode_zen: config.hasOpencodeZen,
		zai_coding_plan: config.hasZaiCodingPlan,
		kimi_for_coding: config.hasKimiForCoding,
	}
}

export function toProviderAvailability(config: InstallConfig): ProviderAvailability {
	return toComputedProviderAvailability(toInstallDefaultsProviders(config))
}

export function isProviderAvailable(provider: string, availability: ProviderAvailability): boolean {
	const mapping: Record<string, boolean> = {
		anthropic: availability.native.claude,
		openai: availability.native.openai,
		google: availability.native.gemini,
		"github-copilot": availability.copilot,
		opencode: availability.opencodeZen,
		"zai-coding-plan": availability.zai,
		"kimi-for-coding": availability.kimiForCoding,
	}
	return mapping[provider] ?? false
}
