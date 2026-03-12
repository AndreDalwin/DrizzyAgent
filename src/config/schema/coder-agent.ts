import { z } from "zod"

export const CoderAgentConfigSchema = z.object({
  disabled: z.boolean().optional(),
  default_builder_enabled: z.boolean().optional(),
  planner_enabled: z.boolean().optional(),
  replace_plan: z.boolean().optional(),
})

export type CoderAgentConfig = z.infer<typeof CoderAgentConfigSchema>
