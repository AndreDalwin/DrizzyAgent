import * as fs from "fs"
import * as os from "os"
import * as path from "path"

import type { InstallDefaultsSnapshot } from "./shared/install-defaults-contract"
import { clearConfigLoadErrors } from "./shared"

export class PluginConfigFixture {
  readonly rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "drizzy-agent-plugin-config-"))
  readonly userConfigDir = path.join(this.rootDir, "user-config")
  readonly projectDir = path.join(this.rootDir, "project")

  constructor() {
    fs.mkdirSync(this.userConfigDir, { recursive: true })
    fs.mkdirSync(path.join(this.projectDir, ".opencode"), { recursive: true })
  }

  writeUserConfig(config: Record<string, unknown>): void {
    this.writeConfig(path.join(this.userConfigDir, "drizzy-agent.json"), config)
  }

  writeProjectConfig(config: Record<string, unknown>): void {
    this.writeConfig(path.join(this.projectDir, ".opencode", "drizzy-agent.json"), config)
  }

  cleanup(): void {
    clearConfigLoadErrors()
    fs.rmSync(this.rootDir, { recursive: true, force: true })
  }

  private writeConfig(filePath: string, config: Record<string, unknown>): void {
    fs.writeFileSync(filePath, JSON.stringify(config, null, 2))
  }
}

export function createInstallDefaultsSnapshot(
  overrides: Record<string, unknown> = {},
): InstallDefaultsSnapshot {
  return {
    snapshot_version: 1,
    providers: {
      claude: "no",
      openai: false,
      gemini: false,
      copilot: false,
      opencode_zen: false,
      zai_coding_plan: false,
      kimi_for_coding: false,
      ...overrides,
    },
  }
}
