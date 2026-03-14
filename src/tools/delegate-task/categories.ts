import type { CategoryConfig, CategoriesConfig } from "../../config/schema"
import { DEFAULT_CATEGORIES, CATEGORY_PROMPT_APPENDS } from "./constants"
import { resolveModel } from "../../shared/model-resolver"
import { isModelAvailable } from "../../shared/model-availability"
import { CATEGORY_MODEL_REQUIREMENTS } from "../../shared/model-requirements"
import {
  getEffectiveCategoryConfig,
  getExplicitCategoryConfig,
  hasExplicitCategoryConfig,
} from "../../shared/config-provenance"
import { log } from "../../shared/logger"

export interface ResolveCategoryConfigOptions {
  userCategories?: CategoriesConfig
  inheritedModel?: string
  systemDefaultModel?: string
  availableModels?: Set<string>
}

export interface ResolveCategoryConfigResult {
  config: CategoryConfig
  promptAppend: string
  model: string | undefined
}

/**
 * Resolve the configuration for a given category name.
 * Merges default and user configurations, handles model resolution.
 */
export function resolveCategoryConfig(
  categoryName: string,
  options: ResolveCategoryConfigOptions
): ResolveCategoryConfigResult | null {
  const { userCategories, inheritedModel: _inheritedModel, systemDefaultModel, availableModels } = options

  const defaultConfig = DEFAULT_CATEGORIES[categoryName]
  const userConfig = getEffectiveCategoryConfig(userCategories, categoryName)
  const explicitUserConfig = getExplicitCategoryConfig(userCategories, categoryName)
  const hasExplicitUserConfig = hasExplicitCategoryConfig(userCategories, categoryName)

  if (userConfig?.disable) {
    return null
  }

  const categoryReq = CATEGORY_MODEL_REQUIREMENTS[categoryName]
  if (categoryReq?.requiresModel && availableModels && !hasExplicitUserConfig) {
    if (!isModelAvailable(categoryReq.requiresModel, availableModels)) {
      log(`[resolveCategoryConfig] Category ${categoryName} requires ${categoryReq.requiresModel} but not available`)
      return null
    }
  }
  const defaultPromptAppend = CATEGORY_PROMPT_APPENDS[categoryName] ?? ""

  if (!defaultConfig && !userConfig) {
    return null
  }

  // Model priority for categories: user override > category default > system default
  // Categories have explicit models - no inheritance from parent session
  const model = resolveModel({
    userModel: explicitUserConfig?.model,
    inheritedModel: userConfig?.model ?? defaultConfig?.model,
    systemDefault: systemDefaultModel,
  })
  const config: CategoryConfig = {
    ...defaultConfig,
    ...userConfig,
    model,
    variant: explicitUserConfig?.variant ?? userConfig?.variant ?? defaultConfig?.variant,
  }

  let promptAppend = defaultPromptAppend
  if (userConfig?.prompt_append) {
    promptAppend = defaultPromptAppend
      ? defaultPromptAppend + "\n\n" + userConfig.prompt_append
      : userConfig.prompt_append
  }

  return { config, promptAppend, model }
}
