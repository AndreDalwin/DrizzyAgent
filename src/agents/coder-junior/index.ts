export { buildDefaultCoderJuniorPrompt } from "./default"
export { buildGptCoderJuniorPrompt } from "./gpt"
export { buildGpt54CoderJuniorPrompt } from "./gpt-5-4"
export { buildGpt53CodexCoderJuniorPrompt } from "./gpt-5-3-codex"
export { buildGeminiCoderJuniorPrompt } from "./gemini"

export {
  CODER_JUNIOR_DEFAULTS,
  getCoderJuniorPromptSource,
  buildCoderJuniorPrompt,
  createCoderJuniorAgentWithOverrides,
} from "./agent"
export type { CoderJuniorPromptSource } from "./agent"
