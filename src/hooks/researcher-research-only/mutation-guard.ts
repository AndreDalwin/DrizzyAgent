import {
  ALWAYS_BLOCKED_MUTATION_TOOLS,
  CONDITIONALLY_BLOCKED_MUTATION_TOOLS,
  GUARDED_PATH_TOOLS,
} from "./constants"
import { isAllowedResearcherFile } from "./path-policy"

function getCandidatePaths(args: Record<string, unknown>): string[] {
  return [args.filePath, args.path, args.file, args.rename].filter(
    (value): value is string => typeof value === "string" && value.length > 0
  )
}

export function getResearcherMutationViolation(
  toolName: string,
  args: Record<string, unknown>,
  workspaceRoot: string
): string | null {
  if ((ALWAYS_BLOCKED_MUTATION_TOOLS as readonly string[]).includes(toolName)) {
    return `${toolName} is not allowed for Researcher agents because it can mutate arbitrary workspace files.`
  }

  if (
    (CONDITIONALLY_BLOCKED_MUTATION_TOOLS as readonly string[]).includes(toolName) &&
    args.dryRun === false
  ) {
    return `${toolName} with dryRun=false is not allowed for Researcher agents because it mutates files outside the report-writing flow.`
  }

  if (!(GUARDED_PATH_TOOLS as readonly string[]).includes(toolName)) {
    return null
  }

  const invalidPath = getCandidatePaths(args).find(
    (targetPath) => !isAllowedResearcherFile(targetPath, workspaceRoot)
  )

  if (invalidPath) {
    return `Researcher agents can only write/edit .md files inside .drizzy/research/. Attempted path: ${invalidPath}`
  }

  return null
}
