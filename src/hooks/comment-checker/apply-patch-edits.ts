import { existsSync, readFileSync } from "node:fs"
import { applyPatch, parsePatch, reversePatch } from "diff"

import type { ApplyPatchEdit } from "./cli-runner"

export type ApplyPatchMetadataFile = {
  filePath?: string
  movePath?: string
  before?: string
  after?: string
  patch?: string
  type?: string
}

function normalizePatchFilePath(filePath: string | undefined): string | undefined {
  if (!filePath || filePath === "/dev/null") {
    return undefined
  }

  return filePath.replace(/^[ab]\//, "")
}

function getFilePathFromPatch(patch: string | undefined): string | undefined {
  if (!patch) {
    return undefined
  }

  try {
    const parsedPatch = parsePatch(patch)[0]
    return normalizePatchFilePath(parsedPatch?.newFileName)
      ?? normalizePatchFilePath(parsedPatch?.oldFileName)
  } catch {
    return undefined
  }
}

function reconstructBeforeContent(after: string, patch: string | undefined): string | undefined {
  if (!patch) {
    return undefined
  }

  try {
    const parsedPatch = parsePatch(patch)[0]
    if (!parsedPatch) {
      return undefined
    }

    const reversedPatch = reversePatch(parsedPatch)
    const reconstructed = applyPatch(after, reversedPatch)
    return typeof reconstructed === "string" ? reconstructed : undefined
  } catch {
    return undefined
  }
}

function resolveCurrentFilePath(file: ApplyPatchMetadataFile): string | undefined {
  return file.movePath ?? file.filePath ?? getFilePathFromPatch(file.patch)
}

export function resolveApplyPatchEdits(
  files: ApplyPatchMetadataFile[],
  debugLog: (...args: unknown[]) => void,
): ApplyPatchEdit[] {
  const edits: ApplyPatchEdit[] = []

  for (const file of files) {
    if (file.type === "delete") {
      continue
    }

    const filePath = resolveCurrentFilePath(file)
    if (!filePath) {
      debugLog("apply_patch metadata missing file path, skipping file")
      continue
    }

    if (typeof file.after === "string") {
      edits.push({
        filePath,
        after: file.after,
        ...(typeof file.before === "string" ? { before: file.before } : {}),
      })
      continue
    }

    if (!existsSync(filePath)) {
      debugLog("apply_patch output file missing on disk, skipping file", { filePath })
      continue
    }

    const after = readFileSync(filePath, "utf8")
    const before = typeof file.before === "string"
      ? file.before
      : reconstructBeforeContent(after, file.patch)

    edits.push({
      filePath,
      after,
      ...(typeof before === "string" ? { before } : {}),
    })
  }

  return edits
}
