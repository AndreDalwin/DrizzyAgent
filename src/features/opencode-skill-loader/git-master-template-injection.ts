import { assertValidGitEnvPrefix, type GitMasterConfig } from "../../config/schema"

const BASH_CODE_BLOCK_PATTERN = /```bash\r?\n([\s\S]*?)```/g
const LEADING_GIT_COMMAND_PATTERN = /^([ \t]*(?:[A-Za-z_][A-Za-z0-9_]*=[^ \t]+\s+)*)git(?=[ \t]|$)/gm
const INLINE_GIT_COMMAND_PATTERN = /([;&|()][ \t]*)git(?=[ \t]|$)/g
const DEFAULT_COMMIT_FOOTER =
	"Ultraworked with [DrizzyAgent](https://github.com/AndreDalwin/DrizzyAgent)"
const DEFAULT_CO_AUTHORED_BY =
	"Co-authored-by: DrizzyBot <263155900+DrizzyBot@users.noreply.github.com>"

export function injectGitMasterConfig(template: string, config?: GitMasterConfig): string {
	const commitFooter = config?.commit_footer ?? true
	const includeCoAuthoredBy = config?.include_co_authored_by ?? true
	const gitEnvPrefix = assertValidGitEnvPrefix(config?.git_env_prefix ?? "GIT_MASTER=1")

	let result = gitEnvPrefix ? injectGitEnvPrefix(template, gitEnvPrefix) : template

	if (commitFooter || includeCoAuthoredBy) {
		const injection = buildCommitFooterInjection(commitFooter, includeCoAuthoredBy)
		const insertionPoint = result.indexOf("```\n</execution>")

		result =
			insertionPoint !== -1
				? result.slice(0, insertionPoint) +
					"```\n\n" +
					injection +
					"\n</execution>" +
					result.slice(insertionPoint + "```\n</execution>".length)
				: result + "\n\n" + injection
	}

	return gitEnvPrefix ? prefixGitCommandsInBashCodeBlocks(result, gitEnvPrefix) : result
}

function injectGitEnvPrefix(template: string, prefix: string): string {
	const envPrefixSection = [
		"## GIT COMMAND PREFIX (MANDATORY)",
		"",
		`<git_env_prefix>`,
		`**EVERY git command MUST be prefixed with \`${prefix}\`.**`,
		"",
		"This allows custom git hooks to detect when git-master skill is active.",
		"",
		"```bash",
		`${prefix} git status`,
		`${prefix} git add <files>`,
		`${prefix} git commit -m "message"`,
		`${prefix} git push`,
		`${prefix} git rebase ...`,
		`${prefix} git log ...`,
		"```",
		"",
		"**NO EXCEPTIONS. Every `git` invocation must include this prefix.**",
		`</git_env_prefix>`,
	].join("\n")

	const modeDetectionMarker = "## MODE DETECTION (FIRST STEP)"
	const markerIndex = template.indexOf(modeDetectionMarker)
	if (markerIndex !== -1) {
		return (
			template.slice(0, markerIndex) +
			envPrefixSection +
			"\n\n---\n\n" +
			template.slice(markerIndex)
		)
	}

	return envPrefixSection + "\n\n---\n\n" + template
}

function prefixGitCommandsInBashCodeBlocks(template: string, prefix: string): string {
	return template.replace(BASH_CODE_BLOCK_PATTERN, (block, codeBlock: string) => {
		return block.replace(codeBlock, prefixGitCommandsInCodeBlock(codeBlock, prefix))
	})
}

function prefixGitCommandsInCodeBlock(codeBlock: string, prefix: string): string {
	return codeBlock
		.replace(LEADING_GIT_COMMAND_PATTERN, `$1${prefix} git`)
		.replace(INLINE_GIT_COMMAND_PATTERN, `$1${prefix} git`)
}

function buildCommitFooterInjection(
	commitFooter: boolean | string,
	includeCoAuthoredBy: boolean,
): string {
	const sections: string[] = []

	sections.push("### 5.5 Commit Footer & Co-Author")
	sections.push("")
	sections.push("Add DrizzyAgent attribution to EVERY commit:")
	sections.push("")

	if (commitFooter) {
		const footerText =
			typeof commitFooter === "string"
				? commitFooter
				: DEFAULT_COMMIT_FOOTER
		sections.push("1. **Footer in commit body:**")
		sections.push("```")
		sections.push(footerText)
		sections.push("```")
		sections.push("")
	}

	if (includeCoAuthoredBy) {
		sections.push(`${commitFooter ? "2" : "1"}. **Co-authored-by trailer:**`)
		sections.push("```")
		sections.push(DEFAULT_CO_AUTHORED_BY)
		sections.push("```")
		sections.push("")
	}

	if (commitFooter && includeCoAuthoredBy) {
		const footerText =
			typeof commitFooter === "string"
				? commitFooter
				: DEFAULT_COMMIT_FOOTER
		sections.push("**Example (both enabled):**")
		sections.push("```bash")
		sections.push(
			`git commit -m "{Commit Message}" -m "${footerText}" -m "${DEFAULT_CO_AUTHORED_BY}"`
		)
		sections.push("```")
	} else if (commitFooter) {
		const footerText =
			typeof commitFooter === "string"
				? commitFooter
				: DEFAULT_COMMIT_FOOTER
		sections.push("**Example:**")
		sections.push("```bash")
		sections.push(`git commit -m "{Commit Message}" -m "${footerText}"`)
		sections.push("```")
	} else if (includeCoAuthoredBy) {
		sections.push("**Example:**")
		sections.push("```bash")
		sections.push(`git commit -m "{Commit Message}" -m "${DEFAULT_CO_AUTHORED_BY}"`)
		sections.push("```")
	}

	return sections.join("\n")
}
