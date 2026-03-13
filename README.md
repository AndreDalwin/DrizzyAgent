# DrizzyAgent

**DrizzyAgent** is an AI agent harness that extends Claude Code (OpenCode fork) with multi-agent orchestration. It provides a powerful system for coding tasks with specialized agents for different types of work.

> If you have a stale cached plugin install, clear it with: `rm -rf ~/.cache/opencode/node_modules/drizzy-agent`

Built for those who want the power of multi-model AI agents without the complexity of managing them manually.

## What It Does

DrizzyAgent provides **discipline agents** that work together to complete coding tasks:

| Agent | Purpose | Model |
|-------|---------|-------|
| **Coder** | Main orchestrator - plans, delegates, drives to completion | Claude Opus / Kimi K2.5 / GLM-5 |
| **GPTCoder** | Deep autonomous worker - explores, researches, executes end-to-end | GPT-5.3 Codex |
| **Planner** | Strategic planner - interviews, identifies scope, builds plans | Claude Opus / Kimi K2.5 / GLM-5 |
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
| `/start-work` | Planner interview-mode planning |
| `/ralph-loop` | Self-referential development loop |
| `/stop-continuation` | Stop all continuation mechanisms |

### Skills System

Skills bring domain expertise:
- `playwright`: Browser automation
- `git-master`: Atomic commits, rebase surgery
- `frontend-ui-ux`: Design-first UI generation
- Custom skills: Add your own in `.opencode/skills/`

## Installation

To install drizzy-agent, run:

```bash
npx drizzy-agent install
# or
bunx drizzy-agent install
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

### How Configuration Works (Override-Only Architecture)

DrizzyAgent uses an **override-only** configuration system. Understanding this helps you manage your setup effectively.

#### Fresh Installs (Adopted Configs)

When you run `drizzy-agent install`, the tool creates a minimal config containing only:

```jsonc
{
  "$schema": "...",
  "_install_defaults": {
    "snapshot_version": 1,
    "providers": {
      "claude": "yes",
      "openai": false,
      "gemini": false,
      // ... which providers you selected
    }
  }
}
```

The `_install_defaults` section is **install-managed and read-only**. It captures which providers you selected during installation. The actual `agents` and `categories` configuration is computed at runtime from current fallback rules.

**Key benefits of adopted configs:**
- Your config stays small and focused on your choices
- Model fallbacks automatically improve with each plugin update
- No manual updates needed when better models become available

#### Legacy Configs (Pre-Existing)

If you have an existing config without `_install_defaults`, it is considered **legacy**. Legacy configs:
- Have all `agents` and `categories` explicitly defined
- Stay pinned to whatever models were set
- Do not receive automatic fallback improvements

**To check your status:** Open your config file. If you see `_install_defaults`, you are adopted. If you see explicit `agents` and `categories` without `_install_defaults`, you are legacy.

#### Migration Path

To migrate from legacy to adopted (recommended):

```bash
# Backs up your existing config and creates fresh adopted config
bunx drizzy-agent install
```

Your explicit overrides (if any) will be merged into the new structure.

#### Adding Custom Overrides

You can always add explicit overrides on top of the computed defaults:

```jsonc
{
  "_install_defaults": { /* ... */ },
  "agents": {
    "coder": {
      "model": "claude-opus-4"  // This overrides the computed default
    }
  },
  "categories": {
    "deep": {
      "model": "o3-mini"  // Override for specific category
    }
  }
}
```

Explicit overrides take precedence over computed defaults. Omitting a field means "use the computed default."

#### Future Fallback Updates

When DrizzyAgent releases improvements to model fallback chains:
- **Adopted configs**: Automatically benefit from updates (computed defaults refresh)
- **Legacy configs**: Stay pinned to existing explicit settings (no automatic changes)

To get the latest fallback improvements on a legacy config, rerun `drizzy-agent install`.

### Troubleshooting: Version Display Issues

If you see an old version (like 3.11.2) instead of the current version, clear the cache:

```bash
rm -rf ~/.cache/opencode/node_modules/drizzy-agent
```

This removes cached data from the previous package name.

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

*Named after the author's nickname "Drizzy" — built for developers who want serious AI assistance without the overhead.*
