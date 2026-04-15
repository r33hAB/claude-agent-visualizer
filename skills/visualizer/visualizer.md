---
name: visualizer
description: Launch the 3D agent visualizer — shows animated voxel characters for all running claude-flow agents in a cyberpunk command center
---

## Agent Visualizer

When this skill is invoked, immediately run the following command to start the visualizer:

```bash
cd /Users/r33hab/Documents/git/claude-agent-visualizer && npm run build && npx tsx server/index.ts --live &
```

Then tell the user: "Visualizer launched at http://localhost:3847 — open it in your browser."

If the user says "mock" or "demo", use this instead (no --live flag):

```bash
cd /Users/r33hab/Documents/git/claude-agent-visualizer && npm run build && npx tsx server/index.ts &
```

To stop the visualizer:

```bash
kill $(lsof -ti:3847) 2>/dev/null
```

### What it shows

- 3D voxel characters with full joint articulation (shoulders, elbows, wrists, hips, knees, ankles)
- 10 agent categories with unique head mods, held props, and workstation equipment
- Agents physically walk to each other during interactions with visual handoff effects
- Cyberpunk command center with neon lighting, holographic displays, and ambient particles
- Adaptive post-processing (bloom, vignette) that scales with GPU performance
- Real-time progress rings, energy beams between interacting agents

### Controls

| Key | Action |
|-----|--------|
| W/A/S/D | Move camera |
| J/L | Rotate left/right |
| I/K | Look up/down |
| Mouse drag | Free look |
| Scroll | Zoom in/out |
| E / Space | Move up |
| Q | Move down |
| Shift | Speed boost |
| Click | Select agent |

### Modes

- `--live` connects to the running claude-flow daemon and shows real agents
- Default (no flag) runs a demo with 8 simulated agents
