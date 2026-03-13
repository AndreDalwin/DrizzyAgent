export type { ConfigContext } from "./config-manager/config-context"
export {
  initConfigContext,
  getConfigContext,
  resetConfigContext,
} from "./config-manager/config-context"

export { fetchNpmDistTags } from "./config-manager/npm-dist-tags"
export { getPluginNameWithVersion } from "./config-manager/plugin-name-with-version"
export { addPluginToOpenCodeConfig } from "./config-manager/add-plugin-to-opencode-config"

export { generateDrizzyConfig } from "./config-manager/generate-drizzy-config"
export { writeDrizzyConfig } from "./config-manager/write-drizzy-config"

export { isOpenCodeInstalled, getOpenCodeVersion } from "./config-manager/opencode-binary"

export { detectCurrentConfig } from "./config-manager/detect-current-config"

export type { BunInstallResult } from "./config-manager/bun-install"
export { runBunInstall, runBunInstallWithDetails } from "./config-manager/bun-install"

export type { OmoDetectionResult } from "./config-manager/detect-and-remove-oh-my-opencode"
export {
  detectOhMyOpencode,
  removeOhMyOpencodeFromOpenCodeConfig,
  removeOhMyOpencodeConfig,
} from "./config-manager/detect-and-remove-oh-my-opencode"
