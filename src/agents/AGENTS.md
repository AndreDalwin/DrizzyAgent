# src/agents/ — 11 Agent Definitions

**Generated:** 2026-03-06

## OVERVIEW

Agent factories following `createXXXAgent(model) → AgentConfig` pattern. Each has static `mode` property. Built via `buildAgent()` compositing factory + categories + skills.

## AGENT INVENTORY

| Agent | Model | Temp | Mode | Fallback Chain | Purpose |
|-------|-------|------|------|----------------|---------|
| **Coder** | claude-opus-4-6 max | 0.1 | all | k2p5 → kimi-k2.5 → gpt-5.4 medium → glm-5 → big-pickle | Main orchestrator, plans + delegates |
| **GPTCoder** | gpt-5.3-codex medium | 0.1 | all | gpt-5.4 medium (copilot) | Autonomous deep worker |
| **Oracle** | gpt-5.4 high | 0.1 | subagent | gemini-3.1-pro high → claude-opus-4-6 max | Read-only consultation |
| **Librarian** | gemini-3-flash | 0.1 | subagent | minimax-m2.5-free → big-pickle | External docs/code search |
| **Explore** | grok-code-fast-1 | 0.1 | subagent | minimax-m2.5-free → claude-haiku-4-5 → gpt-5-nano | Contextual grep |
| **Multimodal-Looker** | gpt-5.3-codex medium | 0.1 | subagent | k2p5 → gemini-3-flash → glm-4.6v → gpt-5-nano | PDF/image analysis |
| **Plan Consultant** | claude-opus-4-6 max | **0.3** | subagent | gpt-5.4 high → gemini-3.1-pro high | Pre-planning consultant |
| **Plan Reviewer** | gpt-5.4 xhigh | 0.1 | subagent | claude-opus-4-6 max → gemini-3.1-pro high | Plan reviewer |
| **Orchestrator** | claude-sonnet-4-6 | 0.1 | primary | gpt-5.4 medium | Todo-list orchestrator |
| **Planner** | claude-opus-4-6 max | 0.1 | — | gpt-5.4 high → gemini-3.1-pro | Strategic planner (internal) |
| **Coder-Junior** | claude-sonnet-4-6 | 0.1 | all | user-configurable | Category-spawned executor |

## TOOL RESTRICTIONS

| Agent | Denied Tools |
|-------|-------------|
| Oracle | write, edit, task, call_drizzy_agent |
| Librarian | write, edit, task, call_drizzy_agent |
| Explore | write, edit, task, call_drizzy_agent |
| Multimodal-Looker | ALL except read |
| Orchestrator | task, call_drizzy_agent |
| Plan Reviewer | write, edit, task |

## STRUCTURE

```
agents/
├── coder.ts            # 559 LOC, main orchestrator
├── gptcoder/              # 507 LOC, autonomous worker
├── oracle.ts              # Read-only consultant
├── librarian.ts           # External search
├── explore.ts             # Codebase grep
├── multimodal-looker.ts   # Vision/PDF
├── plan-consultant.ts               # Pre-planning
├── plan-reviewer.ts       # Plan review
├── orchestrator/agent.ts         # Todo orchestrator
├── types.ts               # AgentFactory, AgentMode
├── agent-builder.ts       # buildAgent() composition
├── utils.ts               # Agent utilities
├── builtin-agents.ts      # createBuiltinAgents() registry
└── builtin-agents/        # maybeCreateXXXConfig conditional factories
    ├── coder-agent.ts
    ├── gptcoder-agent.ts
    ├── orchestrator-agent.ts
    ├── general-agents.ts  # collectPendingBuiltinAgents
    └── available-skills.ts
```

## FACTORY PATTERN

```typescript
const createXXXAgent: AgentFactory = (model: string) => ({
  instructions: "...",
  model,
  temperature: 0.1,
  // ...config
})
createXXXAgent.mode = "subagent" // or "primary" or "all"
```

Model resolution: unified fallback chains. Defined in `src/shared/agent-model-defaults.ts`.

## Model Resolution

Agent models are determined by unified fallback chains defined in `src/shared/agent-model-defaults.ts`.

### Unified Chain Approach

Each agent has exactly **one canonical fallback chain** used by both runtime and install:

1. **Install** writes only `_install_defaults` provider snapshot (no model pins)
2. **Runtime** reads provider snapshot and filters unified chain
3. **First available** model in chain is selected
4. **Explicit user config** (`agents.{name}.model`) overrides computed default

Example with coder agent:
```
Unified Chain:    [claude-opus-4-6, k2p5, kimi-k2.5, gpt-5.4, glm-5, big-pickle]
Provider Snapshot: { kimi: true }
Selected Model:   kimi-for-coding/k2p5
```

### Provider Prefixes

All model identifiers include provider prefixes:
- `anthropic/claude-opus-4-6`
- `kimi-for-coding/k2p5`
- `openai/gpt-5.4`

### Custom Overrides

Users can override any agent's model in their config:
```json
{
  "agents": {
    "coder": {
      "model": "openai/gpt-5.4"
    }
  }
}
```

### See Also

- `src/shared/agent-model-defaults.ts` - Canonical model chains

## MODES

- **primary**: Respects UI-selected model, uses fallback chain
- **subagent**: Uses own fallback chain, ignores UI selection
- **all**: Available in both contexts (Coder-Junior)
