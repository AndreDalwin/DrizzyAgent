import type { PluginInput } from "@opencode-ai/plugin"

import { HOOK_NAME } from "./constants"
import { log } from "../../shared/logger"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { getAgentFromSession } from "../planner-md-only/agent-resolution"
import { isResearcherAgent } from "./agent-matcher"
import { getResearcherMutationViolation } from "./mutation-guard"

export function createResearcherResearchOnlyHook(ctx: PluginInput) {
  return {
    "tool.execute.before": async (
      input: { tool: string; sessionID: string; callID: string },
      output: { args: Record<string, unknown>; message?: string }
    ): Promise<void> => {
      const agentName = await getAgentFromSession(input.sessionID, ctx.directory, ctx.client)

      if (!isResearcherAgent(agentName)) {
        return
      }

      const toolName = input.tool

      const violation = getResearcherMutationViolation(
        toolName,
        output.args,
        ctx.directory
      )

      if (violation) {
        const displayName = getAgentDisplayName(agentName ?? "researcher")
        log(`[${HOOK_NAME}] Blocked researcher mutation`, {
          sessionID: input.sessionID,
          tool: toolName,
          args: output.args,
          agent: agentName,
        })
        throw new Error(
          `[${HOOK_NAME}] ${displayName} is restricted to research output only. ${violation}`
        )
      }

      log(`[${HOOK_NAME}] Allowed researcher mutation within research directory`, {
        sessionID: input.sessionID,
        tool: toolName,
        args: output.args,
        agent: agentName,
      })
    },
  }
}
