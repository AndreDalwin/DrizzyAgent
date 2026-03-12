# DrizzyAgent

**DrizzyAgent** is an AI agent harness built on top of the Oh My OpenCode architecture. It provides a multi-agent orchestration system for coding tasks with specialized agents for different types of work.

Built for those who want the power of multi-model AI agents without the complexity of managing them manually.

## What It Does

DrizzyAgent provides **discipline agents** that work together to complete coding tasks:

| Agent | Purpose | Model |
|-------|---------|-------|
| **Coder** | Main orchestrator - plans, delegates, drives to completion | Claude Opus / Kimi K2.5 / GLM-5 |
| **Hephaestus** | Deep autonomous worker - explores, researches, executes end-to-end | GPT-5.3 Codex |
| **Prometheus** | Strategic planner - interviews, identifies scope, builds plans | Claude Opus / Kimi K2.5 / GLM-5 |
| **Oracle** | Architecture consultant - debugging, complex logic decisions | High-IQ reasoning models |
| **Librarian** | Documentation/code search - external references, OSS examples | Research models |
| **Explore** | Fast codebase grep - pattern discovery, cross-layer search | Fast models |

## Key Features

### `ultrawork` Mode

Type `ultrawork` (or `ulw`). Every agent activates. Doesn't stop until done.

### Agent Categories

When Coder delegates, it picks a **category**, not a model:

| Category | For |
|----------|-----|
| `visual-engineering` | Frontend, UI/UX, design |
| `deep` | Autonomous research + execution |
| `quick` | Single-file changes, typos |
| `ultrabrain` | Hard logic, architecture decisions |

The harness maps categories to the right models automatically.

### Built-in Tools

- **LSP Tools**: `lsp_rename`, `lsp_goto_definition`, `lsp_find_references`, `lsp_diagnostics`
- **AST-Grep**: Pattern-aware code search and rewriting across 25 languages
- **Background Agents**: Fire 5+ specialists in parallel
- **Session Manager**: List, read, search session history
- **Hashline Edit**: Content-hash validated edits (no stale-line errors)
- **Tmux Integration**: Full interactive terminal for REPLs, debuggers, TUIs

### Built-in MCPs

- **Web Search** (Exa): Real-time web search
- **Context7**: Official documentation lookup
- **Grep.app**: GitHub code search

### Commands

| Command | Description |
|---------|-------------|
| `/ultrawork` or `/ulw` | Activate all agents, work until done |
| `/init-deep` | Generate hierarchical AGENTS.md files |
| `/start-work` | Prometheus interview-mode planning |
| `/ralph-loop` | Self-referential development loop |
| `/stop-continuation` | Stop all continuation mechanisms |

### Skills System

Skills bring domain expertise:
- `playwright`: Browser automation
- `git-master`: Atomic commits, rebase surgery
- `frontend-ui-ux`: Design-first UI generation
- Custom skills: Add your own in `.opencode/skills/`

## Installation

```bash
npm install drizzy-agent
```

Or install as an OpenCode plugin:

```json
// ~/.config/opencode/opencode.json
{
  "plugins": ["drizzy-agent"]
}
```

## Configuration

Create `.opencode/drizzy-agent.jsonc` or `~/.config/opencode/drizzy-agent.jsonc`:

```jsonc
{
  "agents": {
    "coder": {
      "model": "claude-opus-4"
    }
  },
  "categories": {
    "visual-engineering": {
      "model": "claude-opus-4"
    }
  },
  "disabled_hooks": []
}
```

## Development

```bash
# Install dependencies
bun install

# Build
bun run build

# Test
bun test
```

## Architecture

```
src/
├── agents/          # 11 agent implementations
├── hooks/           # 46 lifecycle hooks
├── tools/           # 26 built-in tools
├── features/        # Core feature modules
├── cli/             # CLI implementation
└── shared/          # Utilities
```

## License

SUL-1.0 (Source Available License)

---

*Built on the Oh My OpenCode foundation. Forked and customized for specific agent workflows.*
