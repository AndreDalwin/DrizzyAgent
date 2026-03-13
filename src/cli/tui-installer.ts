import * as p from "@clack/prompts"
import color from "picocolors"
import type { InstallArgs } from "./types"
import {
  addPluginToOpenCodeConfig,
  detectCurrentConfig,
  detectOhMyOpencode,
  getOpenCodeVersion,
  isOpenCodeInstalled,
  removeOhMyOpencodeConfig,
  removeOhMyOpencodeFromOpenCodeConfig,
  writeDrizzyConfig,
} from "./config-manager"
import { detectedToInitialValues, formatBanner, formatConfigSummary, SYMBOLS } from "./install-validators"
import { promptInstallConfig, promptOhMyOpencodeConfirmation } from "./tui-install-prompts"

export async function runTuiInstaller(args: InstallArgs, version: string): Promise<number> {
  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    console.error("Error: Interactive installer requires a TTY. Use --non-interactive or set environment variables directly.")
    return 1
  }

  const detected = detectCurrentConfig()
  const isUpdate = detected.isInstalled

  p.intro(formatBanner(isUpdate ? "Update" : "Install"))

  if (isUpdate) {
    const initial = detectedToInitialValues(detected)
    const enabledProviders = [
      initial.claude !== "no" && `Claude=${initial.claude}`,
      initial.openai !== "no" && `OpenAI`,
      initial.gemini !== "no" && `Gemini`,
      initial.copilot !== "no" && `Copilot`,
      initial.opencodeZen !== "no" && `OpenCodeZen`,
      initial.zaiCodingPlan !== "no" && `Zai`,
      initial.kimiForCoding !== "no" && `Kimi`,
    ].filter(Boolean).join(", ") || "none"
    p.log.info(`Existing configuration detected: ${enabledProviders}`)
  }

  const spinner = p.spinner()
  spinner.start("Checking OpenCode installation")

  const installed = await isOpenCodeInstalled()
  const openCodeVersion = await getOpenCodeVersion()
  if (!installed) {
    spinner.stop(`OpenCode binary not found ${color.yellow("[!]")}`)
    p.log.warn("OpenCode binary not found. Plugin will be configured, but you'll need to install OpenCode to use it.")
    p.note("Visit https://opencode.ai/docs for installation instructions", "Installation Guide")
  } else {
    spinner.stop(`OpenCode ${openCodeVersion ?? "installed"} ${color.green("[OK]")}`)
  }

  // Check for oh-my-opencode conflict
  const omoDetected = detectOhMyOpencode()
  if (omoDetected.isInstalled) {
    const shouldReplace = await promptOhMyOpencodeConfirmation(omoDetected)
    if (!shouldReplace) return 1

    spinner.start("Removing Oh My OpenCode")

    // Remove from OpenCode config
    const removePluginResult = removeOhMyOpencodeFromOpenCodeConfig()
    if (!removePluginResult.success) {
      spinner.stop(`Warning: Could not remove Oh My OpenCode plugin: ${removePluginResult.error}`)
    }

    // Remove config files
    const removeConfigResult = removeOhMyOpencodeConfig()
    if (!removeConfigResult.success) {
      spinner.stop(`Warning: Could not remove Oh My OpenCode config: ${removeConfigResult.error}`)
    } else if (removeConfigResult.removedPaths.length > 0) {
      spinner.stop(`Removed Oh My OpenCode ${color.green("[OK]")}`)
    } else {
      spinner.stop(`Oh My OpenCode removed ${color.green("[OK]")}`)
    }
  }

  const config = await promptInstallConfig(detected)
  if (!config) return 1

  spinner.start("Adding drizzy-agent to OpenCode config")
  const pluginResult = await addPluginToOpenCodeConfig(version)
  if (!pluginResult.success) {
    spinner.stop(`Failed to add plugin: ${pluginResult.error}`)
    p.outro(color.red("Installation failed."))
    return 1
  }
  spinner.stop(`Plugin added to ${color.cyan(pluginResult.configPath)}`)

  spinner.start("Writing drizzy-agent configuration")
  const drizzyResult = writeDrizzyConfig(config)
  if (!drizzyResult.success) {
    spinner.stop(`Failed to write config: ${drizzyResult.error}`)
    p.outro(color.red("Installation failed."))
    return 1
  }
  spinner.stop(`Config written to ${color.cyan(drizzyResult.configPath)}`)

  if (!config.hasClaude) {
    console.log()
    console.log(color.bgRed(color.white(color.bold(" CRITICAL WARNING "))))
    console.log()
    console.log(color.red(color.bold("  Coder agent is STRONGLY optimized for Claude Opus 4.5.")))
    console.log(color.red("  Without Claude, you may experience significantly degraded performance:"))
    console.log(color.dim("    • Reduced orchestration quality"))
    console.log(color.dim("    • Weaker tool selection and delegation"))
    console.log(color.dim("    • Less reliable task completion"))
    console.log()
    console.log(color.yellow("  Consider subscribing to Claude Pro/Max for the best experience."))
    console.log()
  }

  if (!config.hasClaude && !config.hasOpenAI && !config.hasGemini && !config.hasCopilot && !config.hasOpencodeZen) {
    p.log.warn("No model providers configured. Using opencode/big-pickle as fallback.")
  }

  p.note(formatConfigSummary(config), isUpdate ? "Updated Configuration" : "Installation Complete")

  p.log.success(color.bold(isUpdate ? "Configuration updated!" : "Installation complete!"))
  p.log.message(`Run ${color.cyan("opencode")} to start!`)

  p.note(
    `Include ${color.cyan("ultrawork")} (or ${color.cyan("ulw")}) in your prompt.\n` +
      `All features work like magic—parallel agents, background tasks,\n` +
      `deep exploration, and relentless execution until completion.`,
    "The Magic Word",
  )

  p.log.message(`${color.yellow("★")} If you found this helpful, consider starring the repo!`)
  p.log.message(
    `  ${color.dim("gh api --silent --method PUT /user/starred/AndreDalwin/DrizzyAgent >/dev/null 2>&1 || true")}`,
  )

  p.outro(color.green("DrizzyAgent is ready."))

  if ((config.hasClaude || config.hasGemini || config.hasCopilot) && !args.skipAuth) {
    const providers: string[] = []
    if (config.hasClaude) providers.push(`Anthropic ${color.gray("→ Claude Pro/Max")}`)
    if (config.hasGemini) providers.push(`Google ${color.gray("→ Gemini")}`)
    if (config.hasCopilot) providers.push(`GitHub ${color.gray("→ Copilot")}`)

    console.log()
    console.log(color.bold("Authenticate Your Providers"))
    console.log()
    console.log(`   Run ${color.cyan("opencode auth login")} and select:`)
    for (const provider of providers) {
      console.log(`   ${SYMBOLS.bullet} ${provider}`)
    }
    console.log()
  }

  return 0
}
