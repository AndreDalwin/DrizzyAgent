import { getConfigDir, getConfigJson, getConfigJsonc } from "./config-context"

export interface OmoConfigPaths {
  configDir: string
  configJson: string
  configJsonc: string
}

export function getOmoConfigPaths(): OmoConfigPaths {
  return {
    configDir: getConfigDir(),
    configJson: getConfigJson(),
    configJsonc: getConfigJsonc(),
  }
}
