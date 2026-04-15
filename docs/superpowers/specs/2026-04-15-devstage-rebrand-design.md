# DevStage Rebrand + Performance Fix

**Date:** 2026-04-15
**Status:** Approved

## Overview

Rebrand "Claude Agent Visualizer" to **DevStage** — "Watch your project come to life." Shift the tone from developer-tool documentation to a live studio/behind-the-scenes experience. Fix critical performance issue where completed agents accumulate indefinitely by adding a 5-second TTL with walk-off animation.

---

## 1. Rebrand: DevStage

### Name & Tagline
- **Name:** DevStage
- **Tagline:** "Watch your project come to life"
- **GitHub description:** "Watch your AI agents build your project live — a 3D studio where coders, reviewers, and planners perform on stage"

### Package Changes
- `package.json`: name → `devstage`, version → `1.0.0`
- No changes to internal module names or imports (cosmetic rename only)

### README Rewrite
Complete rewrite of `README.md` with:
- Studio/stage metaphor throughout ("performers", "on stage", "the show")
- Same technical content, reframed with personality
- Dedicated **"Add to Claude Code"** section with copy-paste CLAUDE.md block
- Modes renamed in description: Demo → "Preview Night", Push → "Live Show", Live → "Full Production"
- Keep architecture section but frame it as "backstage"

### GitHub Metadata
- Update repo description via `gh repo edit`
- Add topics: `3d`, `ai-agents`, `visualization`, `claude-code`, `react-three-fiber`, `threejs`, `devtools`, `simulation`

---

## 2. Performance Fix: Agent Walk-Off (5s TTL)

### Problem
Agents with `complete` or `error` status remain in both server state and the 3D scene forever. At 20+ agents, the accumulated Three.js objects (skeletal rigs, materials, effects, workstations) cause significant frame drops.

### Solution: Server-Side TTL + Client Walk-Off

#### Server (server/index.ts)
- When an agent's status is set to `complete` or `error`, record a removal timestamp: `now + 5000ms`
- In the poll/broadcast loop, check timestamps and delete expired agents from `pushedAgents`
- Before deletion, set agent status to `terminated` so the client gets one final broadcast with the exit signal
- New Map: `agentRemovalTimers: Map<string, NodeJS.Timeout>`

#### Client Flow
1. Agent status changes to `complete` → plays celebrating animation (existing)
2. Agent status changes to `error` → plays error animation (existing)  
3. After ~3 seconds, server sets status to `terminated`
4. Client receives `terminated` status → AgentNode maps to `'exiting'` animation
5. Existing exit animation plays (~0.83s): character descends, fades out
6. After ~2 more seconds, server removes agent from state entirely
7. Next broadcast omits the agent → client's Map removes it → React unmounts the component

#### Timeline
```
0s    Agent completes (status='complete', celebrating animation)
3s    Server sets status='terminated' (exit animation begins)  
~3.8s Exit animation finishes (character faded out)
5s    Server deletes agent from state (React unmounts)
```

#### Why Server-Side
- Single source of truth — no client/server state divergence
- Works for all clients (multiple browser tabs, reconnecting clients)
- Simple: no new WebSocket events needed, just existing status transitions

### Files Changed
- `server/index.ts`: Add TTL tracking in POST `/api/agent` handler and cleanup in broadcast loop
- No client changes needed — existing `terminated` → `exiting` animation mapping already works

---

## 3. GitHub Release v1.0.0

### Release Contents
- Git tag `v1.0.0`
- Zip file: `devstage-v1.0.0.zip` containing:
  - `dist/` (built frontend)
  - `server/` (server source — runs via tsx)
  - `package.json` + `package-lock.json`
  - `README.md`
- Release notes matching DevStage branding

### Installation from Release
```bash
unzip devstage-v1.0.0.zip
cd devstage-v1.0.0
npm install --production
npx tsx server/index.ts
```

---

## 4. Claude Code Integration Instructions

The README includes a copy-paste block for `~/.claude/CLAUDE.md`:

```markdown
# DevStage — Watch Your Project Come to Life

When spawning subagents, register them on stage:

Start: `cd /path/to/devstage && npm install && npx tsx server/index.ts --push &`
Open: http://localhost:3847

Register agent:
curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
  -d '{"id":"AGENT_ID","name":"NAME","type":"TYPE","status":"active","task":"DESCRIPTION"}'

Update progress:
curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
  -d '{"id":"AGENT_ID","progress":50,"log":"Halfway done"}'

Complete:
curl -s -X POST http://localhost:3847/api/agent -H "Content-Type: application/json" \
  -d '{"id":"AGENT_ID","status":"complete","progress":100}'
```

---

## Non-Goals
- No renaming of internal source files, components, or imports
- No changes to the 3D scene, workstation designs, or animation system (beyond walk-off)
- No new features — this is rebrand + perf fix only
