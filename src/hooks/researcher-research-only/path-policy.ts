import { relative, resolve, isAbsolute } from "node:path"

import { ALLOWED_BASE_PATH, ALLOWED_EXTENSIONS } from "./constants"

/**
 * Validates that a file path is within `.drizzy/research/` and ends with `.md`.
 * Uses path.resolve/relative for cross-platform safety:
 * - Handles Windows backslashes and mixed separators
 * - Blocks path traversal (`..` in resolved path)
 * - Case-insensitive extension matching
 */
export function isAllowedResearcherFile(filePath: string, workspaceRoot: string): boolean {
  const resolved = resolve(workspaceRoot, filePath)
  const rel = relative(workspaceRoot, resolved)

  // Reject if escapes workspace root
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false
  }

  // Normalize to forward slashes for consistent matching
  const normalizedRel = rel.replace(/\\/g, "/").toLowerCase()

  // Must be inside .drizzy/research/ (not just .drizzy/)
  if (!normalizedRel.startsWith(ALLOWED_BASE_PATH.toLowerCase() + "/")) {
    return false
  }

  // Must have allowed extension
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(
    ext => resolved.toLowerCase().endsWith(ext.toLowerCase())
  )
  if (!hasAllowedExtension) {
    return false
  }

  return true
}
