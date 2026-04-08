function getModelRecord(message: Record<string, unknown>): Record<string, unknown> | undefined {
  const model = message["model"]
  if (typeof model !== "object" || model === null) {
    return undefined
  }

  return model as Record<string, unknown>
}

function getOrCreateModelRecord(message: Record<string, unknown>): Record<string, unknown> {
  const existingModel = getModelRecord(message)
  if (existingModel) {
    return existingModel
  }

  const model: Record<string, unknown> = {}
  message["model"] = model
  return model
}

export function getUserMessageVariant(message: Record<string, unknown>): string | undefined {
  const model = getModelRecord(message)
  if (typeof model?.["variant"] === "string") {
    return model["variant"]
  }

  return typeof message["variant"] === "string" ? message["variant"] : undefined
}

export function setUserMessageVariant(message: Record<string, unknown>, variant: string): void {
  const model = getOrCreateModelRecord(message)
  model["variant"] = variant
  delete message["variant"]
}

export function clearUserMessageVariant(message: Record<string, unknown>): void {
  const model = getModelRecord(message)
  if (model) {
    delete model["variant"]
  }

  delete message["variant"]
}

export function getInputVariant(input: {
  model?: { variant?: string }
  variant?: string
}): string | undefined {
  return input.model?.variant ?? input.variant
}
