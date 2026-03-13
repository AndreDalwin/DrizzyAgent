import type { InstallConfig } from "../types"
import { generateModelConfig } from "../model-fallback"

export function generateDrizzyConfig(installConfig: InstallConfig): Record<string, unknown> {
  return generateModelConfig(installConfig)
}
