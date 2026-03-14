import * as fs from "fs";
import * as path from "path";
import { synthesizeComputedDefaultsConfig } from "./computed-install-defaults";
import { DrizzyAgentConfigSchema, type DrizzyAgentConfig } from "./config";
import { registerConfigProvenance } from "./shared/config-provenance"
import {
  log,
  deepMerge,
  getOpenCodeConfigDir,
  addConfigLoadError,
  parseJsonc,
  detectConfigFile,
  migrateConfigFile,
} from "./shared";

const PARTIAL_STRING_ARRAY_KEYS = new Set([
  "disabled_mcps",
  "disabled_agents",
  "disabled_skills",
  "disabled_hooks",
  "disabled_commands",
  "disabled_tools",
]);

export function parseConfigPartially(
  rawConfig: Record<string, unknown>
): DrizzyAgentConfig | null {
  const fullResult = DrizzyAgentConfigSchema.safeParse(rawConfig);
  if (fullResult.success) {
    return fullResult.data;
  }

  const partialConfig: Record<string, unknown> = {};
  const invalidSections: string[] = [];

  for (const key of Object.keys(rawConfig)) {
    if (PARTIAL_STRING_ARRAY_KEYS.has(key)) {
      const sectionValue = rawConfig[key];
      if (Array.isArray(sectionValue) && sectionValue.every((value) => typeof value === "string")) {
        partialConfig[key] = sectionValue;
      }
      continue;
    }

    const sectionResult = DrizzyAgentConfigSchema.safeParse({ [key]: rawConfig[key] });
    if (sectionResult.success) {
      const parsed = sectionResult.data as Record<string, unknown>;
      if (parsed[key] !== undefined) {
        partialConfig[key] = parsed[key];
      }
    } else {
      const sectionErrors = sectionResult.error.issues
        .filter((i) => i.path[0] === key)
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      if (sectionErrors) {
        invalidSections.push(`${key}: ${sectionErrors}`);
      }
    }
  }

  if (invalidSections.length > 0) {
    log("Partial config loaded — invalid sections skipped:", invalidSections);
  }

  return partialConfig as DrizzyAgentConfig;
}

export function loadConfigFromPath(
  configPath: string,
  _ctx: unknown
): DrizzyAgentConfig | null {
  try {
    if (fs.existsSync(configPath)) {
      const content = fs.readFileSync(configPath, "utf-8");
      const rawConfig = parseJsonc<Record<string, unknown>>(content);

      migrateConfigFile(configPath, rawConfig, { writeToDisk: false });

      const result = DrizzyAgentConfigSchema.safeParse(rawConfig);

      if (result.success) {
        log(`Config loaded from ${configPath}`, { agents: result.data.agents });
        return result.data;
      }

      const errorMsg = result.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join(", ");
      log(`Config validation error in ${configPath}:`, result.error.issues);
      addConfigLoadError({
        path: configPath,
        error: `Partial config loaded — invalid sections skipped: ${errorMsg}`,
      });

      const partialResult = parseConfigPartially(rawConfig);
      if (partialResult) {
        log(`Partial config loaded from ${configPath}`, { agents: partialResult.agents });
        return partialResult;
      }

      return null;
    }
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    log(`Error loading config from ${configPath}:`, err);
    addConfigLoadError({ path: configPath, error: errorMsg });
  }
  return null;
}

export function mergeConfigs(
  base: DrizzyAgentConfig,
  override: DrizzyAgentConfig
): DrizzyAgentConfig {
  return {
    ...base,
    ...override,
    _install_defaults: override._install_defaults ?? base._install_defaults,
    agents: deepMerge(base.agents, override.agents),
    categories: deepMerge(base.categories, override.categories),
    disabled_agents: [
      ...new Set([
        ...(base.disabled_agents ?? []),
        ...(override.disabled_agents ?? []),
      ]),
    ],
    disabled_mcps: [
      ...new Set([
        ...(base.disabled_mcps ?? []),
        ...(override.disabled_mcps ?? []),
      ]),
    ],
    disabled_hooks: [
      ...new Set([
        ...(base.disabled_hooks ?? []),
        ...(override.disabled_hooks ?? []),
      ]),
    ],
    disabled_commands: [
      ...new Set([
        ...(base.disabled_commands ?? []),
        ...(override.disabled_commands ?? []),
      ]),
    ],
    disabled_skills: [
      ...new Set([
        ...(base.disabled_skills ?? []),
        ...(override.disabled_skills ?? []),
      ]),
    ],
    claude_code: deepMerge(base.claude_code, override.claude_code),
  };
}

function isValidUserSnapshot(snapshot: unknown): snapshot is { snapshot_version: number; providers: Record<string, unknown> } {
  if (typeof snapshot !== "object" || snapshot === null) {
    return false;
  }
  const s = snapshot as Record<string, unknown>;
  if (s.snapshot_version !== 1) {
    return false;
  }
  if (typeof s.providers !== "object" || s.providers === null) {
    return false;
  }
  return true;
}

function stripInvalidUserInstallDefaults(
  config: DrizzyAgentConfig,
  configPath: string
): DrizzyAgentConfig {
  if (!config._install_defaults) {
    return config;
  }

  if (isValidUserSnapshot(config._install_defaults)) {
    return config;
  }

  log(`Ignoring invalid _install_defaults from ${configPath}`);
  addConfigLoadError({
    path: configPath,
    error: "Ignoring invalid _install_defaults section, falling back to built-in defaults",
  });

  const { _install_defaults: _ignored, ...explicitConfig } = config;
  return explicitConfig;
}

function stripProjectInstallDefaults(
  config: DrizzyAgentConfig | null,
  configPath: string
): DrizzyAgentConfig | null {
  if (!config?._install_defaults) {
    return config;
  }

  log(`Ignoring project _install_defaults from ${configPath}`);
  addConfigLoadError({
    path: configPath,
    error: "Ignoring project _install_defaults, snapshot defaults are user-config only",
  });

  const { _install_defaults: _ignored, ...explicitConfig } = config;
  return explicitConfig;
}

export function loadPluginConfig(
  directory: string,
  ctx: unknown
): DrizzyAgentConfig {
  const configDir = getOpenCodeConfigDir({ binary: "opencode" });
  const userBasePath = path.join(configDir, "drizzy-agent");
  const userDetected = detectConfigFile(userBasePath);
  const userConfigPath =
    userDetected.format !== "none"
      ? userDetected.path
      : userBasePath + ".json";

  const projectBasePath = path.join(directory, ".opencode", "drizzy-agent");
  const projectDetected = detectConfigFile(projectBasePath);
  const projectConfigPath =
    projectDetected.format !== "none"
      ? projectDetected.path
      : projectBasePath + ".json";

  const rawUserConfig = loadConfigFromPath(userConfigPath, ctx) ?? {};
  const userConfig = stripInvalidUserInstallDefaults(rawUserConfig, userConfigPath);
  const computedDefaultsConfig = synthesizeComputedDefaultsConfig(userConfig._install_defaults)
  let explicitConfig = userConfig
  let config = mergeConfigs(computedDefaultsConfig, userConfig);

  const projectConfig = stripProjectInstallDefaults(
    loadConfigFromPath(projectConfigPath, ctx),
    projectConfigPath
  );
  if (projectConfig) {
    explicitConfig = mergeConfigs(explicitConfig, projectConfig)
    config = mergeConfigs(config, projectConfig);
  }

  registerConfigProvenance({
    effectiveAgents: config.agents,
    effectiveCategories: config.categories,
    explicitAgents: explicitConfig.agents,
    explicitCategories: explicitConfig.categories,
  })

  config = {
    ...config,
  };

  log("Final merged config", {
    agents: config.agents,
    disabled_agents: config.disabled_agents,
    disabled_mcps: config.disabled_mcps,
    disabled_hooks: config.disabled_hooks,
    claude_code: config.claude_code,
  });
  return config;
}
