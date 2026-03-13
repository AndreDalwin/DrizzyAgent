import * as z from "zod"
import { DrizzyAgentConfigSchema } from "../src/config/schema"

export function createDrizzyAgentJsonSchema(): Record<string, unknown> {
  const jsonSchema = z.toJSONSchema(DrizzyAgentConfigSchema, {
    target: "draft-7",
    unrepresentable: "any",
  })

  return {
    $schema: "http://json-schema.org/draft-07/schema#",
    $id: "https://raw.githubusercontent.com/AndreDalwin/DrizzyAgent/dev/assets/drizzy-agent.schema.json",
    title: "DrizzyAgent Configuration",
    description: "Configuration schema for the drizzy-agent plugin",
    ...jsonSchema,
  }
}
