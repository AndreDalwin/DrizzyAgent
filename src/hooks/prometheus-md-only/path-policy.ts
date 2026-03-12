import { relative, resolve, isAbsolute } from "node:path"

import { ALLOWED_EXTENSIONS } from "./constants"

/**
 * Cross-platform path validator for Prometheus file writes.
 * Uses path.resolve/relative instead of string matching to handle:
 * - Windows backslashes (e.g., .drizzy\\plans\\x.md)
 * - Mixed separators (e.g., .drizzy\\plans/x.md)
 * - Case-insensitive directory/extension matching
 * - Workspace confinement (blocks paths outside root or via traversal)
 * - Nested project paths (e.g., parent/.drizzy/... when ctx.directory is parent)
 */
export function isAllowedFile(filePath: string, workspaceRoot: string): boolean {
  // 1. Resolve to absolute path
  const resolved = resolve(workspaceRoot, filePath)

  // 2. Get relative path from workspace root
  const rel = relative(workspaceRoot, resolved)

  // 3. Reject if escapes root (starts with ".." or is absolute)
  if (rel.startsWith("..") || isAbsolute(rel)) {
    return false
  }

  // 4. Check if .drizzy/ or .drizzy\ exists anywhere in the path (case-insensitive)
  // This handles both direct paths (.drizzy/x.md) and nested paths (project/.drizzy/x.md)
  if (!/\.drizzy[/\\]/i.test(rel)) {
    return false
  }

  // 5. Check extension matches one of ALLOWED_EXTENSIONS (case-insensitive)
  const hasAllowedExtension = ALLOWED_EXTENSIONS.some(
    ext => resolved.toLowerCase().endsWith(ext.toLowerCase())
  )
  if (!hasAllowedExtension) {
    return false
  }

  return true
}
