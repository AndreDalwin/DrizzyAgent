import { z } from "zod"

export const BuiltinAgentNameSchema = z.enum([
  "coder",
  "gptcoder",
  "planner",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "metis",
  "momus",
  "atlas",
  "coder-junior",
])

export const BuiltinSkillNameSchema = z.enum([
  "playwright",
  "agent-browser",
  "dev-browser",
  "frontend-ui-ux",
  "git-master",
])

export const OverridableAgentNameSchema = z.enum([
  "build",
  "plan",
  "coder",
  "gptcoder",
  "coder-junior",
  "OpenCode-Builder",
  "planner",
  "metis",
  "momus",
  "oracle",
  "librarian",
  "explore",
  "multimodal-looker",
  "atlas",
])

export const AgentNameSchema = BuiltinAgentNameSchema
export type AgentName = z.infer<typeof AgentNameSchema>

export type BuiltinSkillName = z.infer<typeof BuiltinSkillNameSchema>
