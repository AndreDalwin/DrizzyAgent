/**
 * Cross-platform check if a path is inside .drizzy/ directory.
 * Handles both forward slashes (Unix) and backslashes (Windows).
 * Uses path segment matching (not substring) to avoid false positives like "not-coder/file.txt"
 */
export function isCoderPath(filePath: string): boolean {
  return /\.drizzy[/\\]/.test(filePath)
}
