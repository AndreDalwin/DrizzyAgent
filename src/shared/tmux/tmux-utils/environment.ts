export type SplitDirection = "-h" | "-v"

export function isInsideTmuxWithEnv(env: NodeJS.ProcessEnv): boolean {
	const tmux = env.TMUX
	return typeof tmux === "string" && tmux.length > 0
}

export function isInsideTmux(): boolean {
	return isInsideTmuxWithEnv(process.env)
}

export function getCurrentPaneId(): string | undefined {
	return process.env.TMUX_PANE
}
