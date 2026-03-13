import type { CategoryConfig } from "../config/schema";
import { deepMerge } from "../shared";
import { DEFAULT_CATEGORIES } from "../tools/delegate-task/constants";

export function resolveCategoryConfig(
  categoryName: string,
  userCategories?: Record<string, CategoryConfig>,
): CategoryConfig | undefined {
  return deepMerge(DEFAULT_CATEGORIES[categoryName], userCategories?.[categoryName]);
}
