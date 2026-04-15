<p align="center">
  <img src="https://img.shields.io/badge/React%20Three%20Fiber-000?style=for-the-badge&logo=threedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

<h1 align="center">DevStage</h1>
<p align="center"><strong>Watch your project come to life.</strong></p>
<p align="center">A 3D studio where your AI agents perform live — coding, reviewing, planning, and debugging on stage while you watch the show.</p>

---

## What Is This?

Every time Claude Code spawns subagents to work on your project, DevStage puts them on stage. Each agent gets a desk, a chair, tools of their trade, and a role to play. You watch them type, review, gesture at whiteboards, and hand off work to each other — all in real time.

When they finish? They take a bow and walk off stage.

---

## The Cast

10 performer types, each with their own workstation, props, and animation style.

| Performer | Their Stage | What You See |
|-----------|-----------|--------------|
| **Coder** | Triple-monitor L-desk, mechanical keyboard | Hunched typing, head scanning monitors |
| **Reviewer** | Document desk with stamp | Mouse scanning, document review |
| **Planner** | Standing desk + whiteboard | Gesturing at board, pointing at sticky notes |
| **Security** | 4-monitor array, warning light, server rack | Head panning across screens |
| **Researcher** | Round table with data orbs | Leaning forward examining displays |
| **Coordinator** | Elevated command platform, holographic ring | Standing with sweeping gestures |
| **Tester** | Testing bench with indicators | Probing instruments, checking readouts |
| **DevOps** | Server rack cluster + terminal | Typing at console, monitoring LEDs |
| **Debugger** | Messy workbench, circuit board, magnifier | Hunched over examining components |
| **Designer** | Tilted drafting table, mood board | Drawing motions, palette reference |

### Animation System

14-joint skeletal rig with layered animation:

- **Base pose** — idle, working, walking, celebrating, error, enter/exit
- **Role pose** — per-performer overrides (coder hunches, planner gestures, security scans)
- **Ambient motion** — breathing, micro-sway, head drift, weight shifting
- **Seated system** — smooth sit/stand transitions, arms targeting desk
- **Props** — role-specific hand tools that animate with wrist joints
- **Walk-off** — completed agents stand up and exit the stage after 5 seconds

---

## Show Modes

| Mode | Flag | What Happens |
|------|------|-------------|
| **Preview Night** | *(default)* | Demo agents auto-populate with scripted interactions |
| **Live Show** | `--push` | You control the stage — only agents you register appear |
| **Full Production** | `--live` | Bridges to a running [claude-flow](https://github.com/ruvnet/claude-flow) daemon |

---

## Quick Start

```bash
git clone https://github.com/r33hAB/claude-agent-visualizer.git devstage
cd devstage
npm install
npm run build
npx tsx server/index.ts
```

Open **http://localhost:3847** — the preview show starts automatically.

### From a Release

```bash
unzip devstage-v1.0.0.zip
cd devstage-v1.0.0
npm install --production
npx tsx server/index.ts
```

### Development

```bash
npm run dev        # Vite dev server with HMR
npm run server     # Server only
npm run start      # Both concurrently
```

---

## Add to Claude Code

Drop this into your `~/.claude/CLAUDE.md` and every Claude Code session will register its agents on stage:

```markdown
# DevStage

When spawning subagents during ANY task, register them with DevStage.

Start DevStage (if not running):
  curl -s http://localhost:3847/health || (cd /path/to/devstage && npm run build && npx tsx server/index.ts --push &)
  Open http://localhost:3847

Register agent:
  curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
    -d '{"id":"AGENT_ID","name":"NAME","type":"TYPE","status":"active","task":"DESCRIPTION"}'

Update progress (send only what changed):
  curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
    -d '{"id":"AGENT_ID","progress":50,"log":"Halfway done"}'

Agent completes:
  curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
    -d '{"id":"AGENT_ID","status":"complete","progress":100}'

Agent error:
  curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
    -d '{"id":"AGENT_ID","status":"error","log":"Build failed"}'

Interaction between agents:
  curl -s -X POST http://localhost:3847/api/interaction -H "Content-Type: application/json" \
    -d '{"sourceAgentId":"ID1","targetAgentId":"ID2","type":"task_handoff"}'

Types: coder, reviewer, tester, researcher, planner, security-auditor, coordinator, devops, debugger, designer
Statuses: active, idle, complete, error
Interaction types: task_handoff, review_request, review_complete, coordinator_delegation, error_escalation

Stop: kill $(lsof -ti:3847) 2>/dev/null
```

### How It Works

1. Start DevStage in `--push` mode (empty stage, waiting for performers)
2. Claude Code reads your CLAUDE.md instructions
3. When it spawns subagents, it registers each one via the REST API
4. Agents appear on stage, sit at their desks, and start working
5. Progress updates animate in real time
6. When agents complete, they celebrate briefly, then walk off stage
7. Errored agents flash red, then exit

---

## Stage Controls

| Input | Action |
|-------|--------|
| **WASD / Arrow keys** | Move camera |
| **Mouse drag** | Rotate view |
| **Scroll wheel** | Zoom in/out |
| **Click performer** | Open detail panel |
| **Shift** | Fast camera movement |
| **?** | Toggle keybinds overlay |

---

## Visual Effects

- Interaction beams between collaborating performers
- Per-agent progress rings
- Particle field background
- Post-processing bloom and ambient occlusion
- Floor grid with shadows
- Status-reactive lighting (error pulse, completion glow)

---

## Backstage (Architecture)

```
devstage/
  src/
    scene/
      AgentNode.tsx         # Orchestrates performer + station + effects
      VoxelCharacter.tsx    # 14-joint skeletal rig, all animations
      Station3D.tsx         # 10 workstation types + chair + monitor
      WalkingAgent.tsx      # Locomotion state machine
      agentVisuals.ts       # Color palettes per role
      effects/              # Beams, particles, ripples, holo displays
    components/             # UI panels, controls, overlays
    hooks/
      useAgentData.ts       # WebSocket client
    types/
      agent.ts              # Shared types
  server/
    index.ts                # Express + WebSocket server
    mcp-bridge.ts           # claude-flow integration
    agent-categorizer.ts    # Maps agent type strings to roles
    cli-poller.ts           # Daemon status polling
```

---

## REST API Reference

### Register / Update a Performer

```bash
curl -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","name":"Coder","type":"coder","status":"active","task":"Building auth module"}'
```

The API is incremental — only send fields that changed:

```bash
curl -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","progress":75,"log":"Tests passing"}'
```

### Record an Interaction

```bash
curl -X POST http://localhost:3847/api/interaction \
  -H "Content-Type: application/json" \
  -d '{"sourceAgentId":"agent-1","targetAgentId":"agent-2","type":"review_request"}'
```

### Other Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/agents` | List all performers on stage |
| `DELETE` | `/api/agent/:id` | Remove a performer immediately |
| `DELETE` | `/api/agents` | Clear the stage |
| `GET` | `/health` | Server status |

### Performer Types

```
coder  reviewer  planner  security-auditor  researcher
coordinator  tester  devops  debugger  designer
```

### Statuses

```
active  idle  complete  error  spawning  terminated
```

### Interaction Types

```
task_handoff  review_request  review_complete
coordinator_delegation  error_escalation
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| 3D Engine | Three.js via React Three Fiber |
| UI | React 19, Tailwind CSS |
| Server | Express 5, WebSocket (ws) |
| Build | Vite 6, TypeScript 5 |
| Post-processing | pmndrs postprocessing |

---

## License

MIT
