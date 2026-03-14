export const OMO_INTERNAL_INITIATOR_MARKER = "<!-- Drizzy Agent Internal Initiator -->"

export function createInternalAgentTextPart(text: string): {
  type: "text"
  text: string
} {
  return {
    type: "text",
    text: `${text}\n${OMO_INTERNAL_INITIATOR_MARKER}`,
  }
}
