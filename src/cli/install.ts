import type { InstallArgs } from "./types"
import { runCliInstaller } from "./cli-installer"
import { runTuiInstaller } from "./tui-installer"

export async function install(args: InstallArgs): Promise<number> {
  return args.tui ? runTuiInstaller(args) : runCliInstaller(args)
}
