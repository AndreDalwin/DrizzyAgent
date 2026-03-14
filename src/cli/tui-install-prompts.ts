import * as p from "@clack/prompts"
import type { Option } from "@clack/prompts"
import color from "picocolors"
import type {
  ClaudeSubscription,
  DetectedConfig,
  InstallConfig,
  OmoDetectionResult,
} from "./types"
import { detectedToInitialValues } from "./install-validators"

async function selectOrCancel<TValue extends Readonly<string | boolean | number>>(params: {
  message: string
  options: Option<TValue>[]
  initialValue: TValue
}): Promise<TValue | null> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return null

  const value = await p.select<TValue>({
    message: params.message,
    options: params.options,
    initialValue: params.initialValue,
  })
  if (p.isCancel(value)) {
    p.cancel("Installation cancelled.")
    return null
  }
  return value as TValue
}

export async function promptInstallConfig(detected: DetectedConfig): Promise<InstallConfig | null> {
  const initial = detectedToInitialValues(detected)

  const claude = await selectOrCancel<ClaudeSubscription>({
    message: "Will you use your Claude Pro/Max subscription?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes (standard)", hint: "" },
      { value: "max20", label: "Yes (max20 mode)", hint: "" },
    ],
    initialValue: initial.claude,
  })
  if (!claude) return null

  const openai = await selectOrCancel({
    message: "Will you use your ChatGPT Plus/Pro subscription or API Key?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.openai,
  })
  if (!openai) return null

  const gemini = await selectOrCancel({
    message: "Will you use Google Gemini API Key?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.gemini,
  })
  if (!gemini) return null

  const copilot = await selectOrCancel({
    message: "Will you use your GitHub Copilot subscription?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.copilot,
  })
  if (!copilot) return null

  const opencodeZen = await selectOrCancel({
    message: "Will you use OpenCode Zen (opencode/ models)?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.opencodeZen,
  })
  if (!opencodeZen) return null

  const zaiCodingPlan = await selectOrCancel({
    message: "Will you use your Z.ai Coding Plan subscription?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.zaiCodingPlan,
  })
  if (!zaiCodingPlan) return null

  const kimiForCoding = await selectOrCancel({
    message: "Will you use your Kimi For Coding subscription?",
    options: [
      { value: "no", label: "No", hint: "" },
      { value: "yes", label: "Yes", hint: "" },
    ],
    initialValue: initial.kimiForCoding,
  })
  if (!kimiForCoding) return null

  return {
    hasClaude: claude !== "no",
    isMax20: claude === "max20",
    hasOpenAI: openai === "yes",
    hasGemini: gemini === "yes",
    hasCopilot: copilot === "yes",
    hasOpencodeZen: opencodeZen === "yes",
    hasZaiCodingPlan: zaiCodingPlan === "yes",
    hasKimiForCoding: kimiForCoding === "yes",
  }
}

export async function promptOhMyOpencodeConfirmation(detected: OmoDetectionResult): Promise<boolean> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) return true

  console.log()
  console.log(color.bgYellow(color.black(color.bold(" CONFLICT DETECTED "))))
  console.log()
  console.log(color.yellow("  Oh My OpenCode (oh-my-opencode) is currently installed."))
  console.log(color.yellow("  DrizzyAgent and Oh My OpenCode cannot run simultaneously."))
  console.log()
  console.log(color.dim("  DrizzyAgent will:"))
  console.log(color.dim("    • Replace Oh My OpenCode plugin in OpenCode config"))
  console.log(color.dim("    • Remove oh-my-opencode.json configuration file"))
  console.log(color.dim("    • Install DrizzyAgent as the active plugin"))
  console.log()

  if (detected.configPath) {
    console.log(color.dim(`  Config to remove: ${detected.configPath}`))
  }
  if (detected.pluginEntry) {
    console.log(color.dim(`  Plugin to replace: ${detected.pluginEntry}`))
  }
  console.log()

  const confirm = await p.select({
    message: "Do you want to replace Oh My OpenCode with DrizzyAgent?",
    options: [
      { value: "yes", label: "Yes, replace it", hint: "Oh My OpenCode will be removed" },
      { value: "no", label: "No, cancel installation", hint: "Keep Oh My OpenCode" },
    ],
    initialValue: "yes",
  })

  if (p.isCancel(confirm) || confirm === "no") {
    p.cancel("Installation cancelled. Oh My OpenCode remains installed.")
    return false
  }

  return true
}
