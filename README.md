<p align="center">
  <img src="https://img.shields.io/badge/React%20Three%20Fiber-000?style=for-the-badge&logo=threedotjs&logoColor=white" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/WebSocket-010101?style=for-the-badge&logo=socketdotio&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
</p>

# Claude Agent Visualizer

A real-time 3D visualization of AI agent swarms. Watch voxel characters sit at workstations, type on keyboards, scan monitors, and collaborate through animated interaction beams -- all driven by live agent data over WebSocket.

Built with React Three Fiber, Three.js, and Express.

---

## Features

### 10 Specialized Agent Types

Each agent category has a unique workstation, color palette, head mod, hand tools, and animation style.

| Agent | Workstation | Behavior |
|-------|------------|----------|
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

### Skeletal Animation System

14-joint character rig with layered animation:

- **Base pose** -- idle, working, walking, celebrating, error, enter/exit
- **Category pose** -- per-role overrides (coder hunches, planner gestures, security scans)
- **Ambient motion** -- breathing, micro-sway, head drift, weight shifting
- **Seated system** -- smooth sit/stand transitions, bent legs, arms targeting desk surface
- **Hand tools** -- role-specific items that animate with the character's wrist joints

### Real-Time Agent Tracking

Three operating modes:

| Mode | Flag | Source |
|------|------|--------|
| **Demo** | *(default)* | Auto-seeds sample agents with scripted interactions |
| **Push** | `--push` | Register agents via REST API -- only shows what you send |
| **Live** | `--live` | Bridges to a running claude-flow daemon via MCP |

### Visual Effects

- Interaction beams between collaborating agents
- Per-agent progress rings
- Particle field background
- Post-processing bloom and ambient occlusion
- Floor grid with agent shadows
- Status-reactive lighting (error pulse, completion glow)

---

## Quick Start

```bash
npm install
npm run build
npx tsx server/index.ts
```

Open **http://localhost:3847** -- demo agents appear automatically.

### Development

```bash
npm run dev        # Vite dev server with HMR
npm run server     # Server only
npm run start      # Both concurrently
```

---

## API

### Push Mode

Start with `--push` to accept agents via REST:

```bash
npx tsx server/index.ts --push
```

#### Register / Update an Agent

```bash
# Create
curl -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","name":"Coder","type":"coder","status":"active","task":"Building auth module"}'

# Update (incremental -- only send changed fields)
curl -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","progress":75,"log":"Tests passing"}'

# Complete
curl -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"agent-1","status":"complete","progress":100}'
```

#### Record an Interaction

```bash
curl -X POST http://localhost:3847/api/interaction \
  -H "Content-Type: application/json" \
  -d '{"sourceAgentId":"agent-1","targetAgentId":"agent-2","type":"task_handoff"}'
```

#### Agent Types

```
coder  reviewer  planner  security-auditor  researcher
coordinator  tester  devops  debugger  designer
```

#### Statuses

```
active  idle  complete  error  spawning  terminated
```

#### Interaction Types

```
task_handoff  review_request  review_complete
coordinator_delegation  error_escalation
```

### Live Mode

Connects to a running [claude-flow](https://github.com/ruvnet/claude-flow) daemon:

```bash
npx tsx server/index.ts --live
```

Polls agent state and swarm status via MCP bridge every 1.5s.

---

## Controls

| Input | Action |
|-------|--------|
| **WASD / Arrow keys** | Move camera |
| **Mouse drag** | Rotate view |
| **Scroll wheel** | Zoom in/out |
| **Click agent** | Open detail panel |
| **Shift** | Fast camera movement |
| **?** | Toggle keybinds overlay |

---

## Architecture

```
claude-agent-visualizer/
  src/
    scene/
      AgentNode.tsx         # Orchestrates character + station + effects
      VoxelCharacter.tsx    # 14-joint skeletal rig, all animations
      Station3D.tsx         # 10 workstation types + chair + monitor
      WalkingAgent.tsx      # Locomotion state machine
      agentVisuals.ts       # Color palettes per category
      effects/              # Beams, particles, ripples, holo displays
    components/             # UI panels, controls, overlays
    hooks/
      useAgentData.ts       # WebSocket client
    types/
      agent.ts              # Shared types for agent, interaction, swarm
  server/
    index.ts                # Express + WebSocket server
    mcp-bridge.ts           # claude-flow MCP integration
    agent-categorizer.ts    # Maps agent type strings to categories
    cli-poller.ts           # Daemon status polling
```

---

## Integration with Claude Code

Add to your `~/.claude/CLAUDE.md` to register subagents with the visualizer during any task:

```markdown
## Agent Visualizer

Register agents:
curl -s -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"AGENT_ID","name":"NAME","type":"TYPE","status":"active","task":"DESCRIPTION"}'

Update progress:
curl -s -X POST http://localhost:3847/api/agent \
  -H "Content-Type: application/json" \
  -d '{"id":"AGENT_ID","progress":50,"log":"Halfway done"}'
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
