import type { DrizzyAgentConfig } from "../config";
import { getAgentDisplayName } from "../shared/agent-display-names";

type AgentWithPermission = { permission?: Record<string, unknown> };

function getConfigQuestionPermission(): string | null {
  const configContent = process.env.OPENCODE_CONFIG_CONTENT;
  if (!configContent) return null;
  try {
    const parsed = JSON.parse(configContent);
    return parsed?.permission?.question ?? null;
  } catch {
    return null;
  }
}

function agentByKey(agentResult: Record<string, unknown>, key: string): AgentWithPermission | undefined {
  return (agentResult[key] ?? agentResult[getAgentDisplayName(key)]) as
    | AgentWithPermission
    | undefined;
}

export function applyToolConfig(params: {
  config: Record<string, unknown>;
  pluginConfig: DrizzyAgentConfig;
  agentResult: Record<string, unknown>;
}): void {
  const denyTodoTools = params.pluginConfig.experimental?.task_system
    ? { todowrite: "deny", todoread: "deny" }
    : {}

  params.config.tools = {
    ...(params.config.tools as Record<string, unknown>),
    "grep_app_*": false,
    LspHover: false,
    LspCodeActions: false,
    LspCodeActionResolve: false,
    "task_*": false,
    teammate: false,
    ...(params.pluginConfig.experimental?.task_system
      ? { todowrite: false, todoread: false }
      : {}),
  };

  const isCliRunMode = process.env.OPENCODE_CLI_RUN_MODE === "true";
  const configQuestionPermission = getConfigQuestionPermission();
  const questionPermission =
    configQuestionPermission === "deny" ? "deny" :
    isCliRunMode ? "deny" :
    "allow";

  const librarian = agentByKey(params.agentResult, "librarian");
  if (librarian) {
    librarian.permission = { ...librarian.permission, "grep_app_*": "allow" };
  }
  const looker = agentByKey(params.agentResult, "multimodal-looker");
  if (looker) {
    looker.permission = { ...looker.permission, task: "deny", look_at: "deny" };
  }
  const orchestrator = agentByKey(params.agentResult, "orchestrator");
  if (orchestrator) {
      orchestrator.permission = {
        ...orchestrator.permission,
        task: "allow",
        call_drizzy_agent: "deny",
        "task_*": "allow",
        teammate: "allow",
        ...denyTodoTools,
      };
  }
  const coder = agentByKey(params.agentResult, "coder");
  if (coder) {
      coder.permission = {
        ...coder.permission,
        call_drizzy_agent: "deny",
        task: "allow",
        question: questionPermission,
        "task_*": "allow",
        teammate: "allow",
        ...denyTodoTools,
      };
  }
  const gptcoder = agentByKey(params.agentResult, "gptcoder");
  if (gptcoder) {
      gptcoder.permission = {
        ...gptcoder.permission,
        call_drizzy_agent: "deny",
        task: "allow",
        question: questionPermission,
        ...denyTodoTools,
      };
  }
  const planner = agentByKey(params.agentResult, "planner");
  if (planner) {
      planner.permission = {
        ...planner.permission,
        call_drizzy_agent: "deny",
        task: "allow",
        question: questionPermission,
        "task_*": "allow",
        teammate: "allow",
        ...denyTodoTools,
      };
  }
  const researcher = agentByKey(params.agentResult, "researcher");
  if (researcher) {
    researcher.permission = {
      ...researcher.permission,
      task: "allow",
      ...denyTodoTools,
    };
  }
  const junior = agentByKey(params.agentResult, "coder-junior");
  if (junior) {
    junior.permission = {
      ...junior.permission,
      task: "allow",
      "task_*": "allow",
      teammate: "allow",
      ...denyTodoTools,
    };
  }

  params.config.permission = {
    webfetch: "allow",
    external_directory: "allow",
    ...(params.config.permission as Record<string, unknown>),
    task: "deny",
  };
}
