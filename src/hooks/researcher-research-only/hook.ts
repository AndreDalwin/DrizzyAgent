import type { PluginInput } from "@opencode-ai/plugin"

import { HOOK_NAME, BLOCKED_TOOLS } from "./constants"
import { log } from "../../shared/logger"
import { getAgentDisplayName } from "../../shared/agent-display-names"
import { getAgentFromSession } from "../planner-md-only/agent-resolution"
import { isResearcherAgent } from "./agent-matcher"
import { isAllowedResearcherFile } from "./path-policy"

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

      if (!BLOCKED_TOOLS.includes(toolName)) {
        return
      }

      const filePath = (output.args.filePath ?? output.args.path ?? output.args.file) as string | undefined
      if (!filePath) {
        return
      }

      if (!isAllowedResearcherFile(filePath, ctx.directory)) {
        const displayName = getAgentDisplayName(agentName ?? "researcher")
        log(`[${HOOK_NAME}] Blocked: Researcher can only write to .drizzy/research/**/*.md`, {
          sessionID: input.sessionID,
          tool: toolName,
          filePath,
          agent: agentName,
        })
        throw new Error(
          `[${HOOK_NAME}] ${displayName} can only write/edit .md files inside .drizzy/research/ directory. ` +
          `Attempted to modify: ${filePath}. ` +
          `Researchers are restricted to research output only.`
        )
      }

      log(`[${HOOK_NAME}] Allowed: .drizzy/research/*.md write permitted`, {
        sessionID: input.sessionID,
        tool: toolName,
        filePath,
        agent: agentName,
      })
    },
  }
}
