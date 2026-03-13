import { computeDefaultsFromProviders, toComputedProviderAvailability } from "../../shared/computed-install-defaults"
import { applyOpenAiOnlyModelCatalog, isOpenAiOnlyAvailability } from "../openai-only-model-catalog"
import { toInstallDefaultsProviders } from "../provider-availability"
import type { InstallConfig } from "../types"

type ConfigRecord = Record<string, unknown>
type GeneratedDefaults = Record<string, { model?: string; variant?: string }>
type GeneratedScope = "agents" | "categories"

export interface LegacyGeneratedConfigAdoptionAnalysis {
  hasLegacyGeneratedPins: boolean
  mismatchReport?: string
  strippedConfig?: ConfigRecord
}

export function analyzeLegacyGeneratedConfigForAdoption(
  existingConfig: ConfigRecord,
  installConfig: InstallConfig,
): LegacyGeneratedConfigAdoptionAnalysis {
  const strippedConfig = structuredClone(existingConfig)
  const defaults = getCurrentGeneratedDefaults(installConfig)
  const mismatches: string[] = []
  let hasLegacyGeneratedPins = false

  for (const scope of ["agents", "categories"] as const) {
    const scopeResult = analyzeGeneratedScope({
      existingConfig,
      strippedConfig,
      defaults: defaults[scope],
      scope,
    })

    hasLegacyGeneratedPins ||= scopeResult.hasLegacyGeneratedPins
    mismatches.push(...scopeResult.mismatches)
  }

  if (!hasLegacyGeneratedPins) {
    return { hasLegacyGeneratedPins: false }
  }

  if (mismatches.length > 0) {
    return {
      hasLegacyGeneratedPins: true,
      mismatchReport: formatMismatchReport(mismatches),
    }
  }

  return {
    hasLegacyGeneratedPins: true,
    strippedConfig,
  }
}

function getCurrentGeneratedDefaults(installConfig: InstallConfig): {
  agents: GeneratedDefaults
  categories: GeneratedDefaults
} {
  const providers = toInstallDefaultsProviders(installConfig)
  const availability = toComputedProviderAvailability(providers, { isMaxPlan: installConfig.isMax20 })
  const generatedConfig = computeDefaultsFromProviders(providers, { isMaxPlan: installConfig.isMax20 })

  if (!isOpenAiOnlyAvailability(availability)) {
    return generatedConfig
  }

  const openAiOnlyConfig = applyOpenAiOnlyModelCatalog({
    $schema: "",
    ...generatedConfig,
  })

  return {
    agents: openAiOnlyConfig.agents ?? {},
    categories: openAiOnlyConfig.categories ?? {},
  }
}

function analyzeGeneratedScope({
  existingConfig,
  strippedConfig,
  defaults,
  scope,
}: {
  existingConfig: ConfigRecord
  strippedConfig: ConfigRecord
  defaults: GeneratedDefaults
  scope: GeneratedScope
}): { hasLegacyGeneratedPins: boolean; mismatches: string[] } {
  const existingScope = getRecord(existingConfig[scope])
  const strippedScope = getRecord(strippedConfig[scope])
  const mismatches: string[] = []
  let hasLegacyGeneratedPins = false

  for (const [entryName, entryValue] of Object.entries(existingScope)) {
    const existingEntry = getRecord(entryValue)
    if (Object.keys(existingEntry).length === 0) {
      continue
    }

    const defaultEntry = defaults[entryName]
    const strippedEntry = getRecord(strippedScope[entryName])

    for (const field of ["model", "variant"] as const) {
      if (!(field in existingEntry)) {
        continue
      }

      hasLegacyGeneratedPins = true
      const actualValue = existingEntry[field]
      const expectedValue = defaultEntry?.[field]

      if (typeof actualValue !== "string" || actualValue !== expectedValue) {
        mismatches.push(
          `${scope}.${entryName}.${field}: expected ${formatValue(expectedValue)}, found ${formatValue(actualValue)}`,
        )
        continue
      }

      delete strippedEntry[field]
    }

    if (Object.keys(strippedEntry).length === 0) {
      delete strippedScope[entryName]
    }
  }

  if (Object.keys(strippedScope).length === 0) {
    delete strippedConfig[scope]
  }

  return { hasLegacyGeneratedPins, mismatches }
}

function getRecord(value: unknown): ConfigRecord {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as ConfigRecord
  }

  return {}
}

function formatMismatchReport(mismatches: string[]): string {
  return [
    "Legacy generated config adoption aborted.",
    "Generated model pins differ from the current install defaults:",
    ...mismatches.map((mismatch) => `- ${mismatch}`),
  ].join("\n")
}

function formatValue(value: string | undefined | unknown): string {
  if (typeof value === "string") {
    return `"${value}"`
  }

  if (value === undefined) {
    return "<missing>"
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}
