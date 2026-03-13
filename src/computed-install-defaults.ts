import type { InstallConfig } from "./cli/types"
import { generateModelConfig } from "./cli/model-fallback"
import type { DrizzyAgentConfig } from "./config"
import type { InstallDefaultsSnapshot } from "./shared/install-defaults-contract"

function toInstallConfig(snapshot: InstallDefaultsSnapshot): InstallConfig {
  return {
    hasClaude: snapshot.providers.claude !== "no",
    isMax20: snapshot.providers.claude === "max20",
    hasOpenAI: snapshot.providers.openai,
    hasGemini: snapshot.providers.gemini,
    hasCopilot: snapshot.providers.copilot,
    hasOpencodeZen: snapshot.providers.opencode_zen,
    hasZaiCodingPlan: snapshot.providers.zai_coding_plan,
    hasKimiForCoding: snapshot.providers.kimi_for_coding,
  }
}

export function synthesizeComputedDefaultsConfig(
  snapshot: InstallDefaultsSnapshot | undefined,
): DrizzyAgentConfig {
  if (!snapshot) {
    return {}
  }

  const generatedConfig = generateModelConfig(toInstallConfig(snapshot))

  return {
    _install_defaults: snapshot,
    agents: generatedConfig.agents,
    categories: generatedConfig.categories,
  }
}
