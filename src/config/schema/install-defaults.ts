import { z } from "zod"
import {
  INSTALL_DEFAULTS_ROOT_KEY,
  INSTALL_DEFAULTS_SNAPSHOT_VERSION,
  type InstallDefaultsProviders,
  type InstallDefaultsSnapshot,
} from "../../shared/install-defaults-contract"

export type { InstallDefaultsProviders, InstallDefaultsSnapshot }

export const InstallDefaultsRootKey = INSTALL_DEFAULTS_ROOT_KEY

export const InstallDefaultsClaudeProviderSchema = z.enum(["no", "yes", "max20"])

export const InstallDefaultsProvidersSchema: z.ZodType<InstallDefaultsProviders> = z
  .object({
    claude: InstallDefaultsClaudeProviderSchema,
    openai: z.boolean(),
    gemini: z.boolean(),
    copilot: z.boolean(),
    opencode_zen: z.boolean(),
    zai_coding_plan: z.boolean(),
    kimi_for_coding: z.boolean(),
  })
  .strict()

export const InstallDefaultsSnapshotSchema: z.ZodType<InstallDefaultsSnapshot> = z
  .object({
    snapshot_version: z.literal(INSTALL_DEFAULTS_SNAPSHOT_VERSION),
    providers: InstallDefaultsProvidersSchema,
  })
  .strict()
