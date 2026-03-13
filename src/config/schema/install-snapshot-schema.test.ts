import { describe, test, expect } from "bun:test";
import { InstallDefaultsSnapshotSchema } from "./install-defaults";
import { INSTALL_DEFAULTS_SNAPSHOT_VERSION } from "../../shared/install-defaults-contract";

describe("install-snapshot-schema", () => {
  test("valid minimal snapshot passes", () => {
    const validSnapshot = {
      snapshot_version: INSTALL_DEFAULTS_SNAPSHOT_VERSION,
      providers: {
        claude: "yes",
        openai: false,
        gemini: false,
        copilot: false,
        opencode_zen: false,
        zai_coding_plan: false,
        kimi_for_coding: false,
      },
    };

    const result = InstallDefaultsSnapshotSchema.safeParse(validSnapshot);
    expect(result.success).toBe(true);
  });

  test("rejects expanded generated defaults masquerading as snapshot", () => {
    // Snapshot with agents field (expanded generated defaults) should be rejected
    const snapshotWithAgents = {
      snapshot_version: INSTALL_DEFAULTS_SNAPSHOT_VERSION,
      providers: {
        claude: "yes",
        openai: false,
        gemini: false,
        copilot: false,
        opencode_zen: false,
        zai_coding_plan: false,
        kimi_for_coding: false,
      },
      agents: {
        coder: {
          model: "claude-opus-4",
        },
      },
    };

    const result = InstallDefaultsSnapshotSchema.safeParse(snapshotWithAgents);
    expect(result.success).toBe(false);
  });
});
