import type { InstallConfig } from "../types"
import { INSTALL_DEFAULTS_SNAPSHOT_VERSION } from "../../shared/install-defaults-contract"
import { toInstallDefaultsProviders } from "../provider-availability"

// Generate minimal install-defaults snapshot for persistence.

export function generateDrizzyConfig(installConfig: InstallConfig): Record<string, unknown> {
  // Build install-defaults snapshot from the current install configuration.
  const providers = toInstallDefaultsProviders(installConfig)

  const installDefaults = {
    snapshot_version: INSTALL_DEFAULTS_SNAPSHOT_VERSION,
    providers,
  }

  const schemaUrl = "https://raw.githubusercontent.com/AndreDalwin/DrizzyAgent/dev/assets/drizzy-agent.schema.json"
  return {
    $schema: schemaUrl,
    _install_defaults: installDefaults,
  } as const
}
