---
name: visualizer
description: Launch the isometric agent visualizer — shows animated characters for all running claude-flow agents with real-time progress and interactions
---

## Agent Visualizer

Launches a local web server and opens a browser window showing an isometric tech-lab visualization of all running agents.

### Launch

Run the following to start the visualizer:

```bash
cd /Users/r33hab/Documents/git/claude-agent-visualizer && npm run build && npx tsx server/index.ts
```

For development with hot reload:

```bash
cd /Users/r33hab/Documents/git/claude-agent-visualizer && npm start
```

This starts both the WebSocket bridge server (connects to claude-flow MCP) and the Vite dev server, then opens your browser automatically.

### What it shows

- Each agent as an animated isometric character at a category-specific workstation
- Real-time progress rings and workspace evolution
- Physical movement animations for major agent interactions (task handoffs, reviews)
- Connection beams for background communication (status updates, memory sharing)
- Reactive environment that responds to swarm state (lighting, particles, screen shake)
- Click any agent for detailed panel: progress, task, logs, dependencies

### Controls

- **Pan:** Click and drag
- **Zoom:** Mouse scroll wheel
- **Select agent:** Click on character
- **Filter:** Use category filter in bottom-left
- **Reset view:** Click Reset button

### Agent Categories (10)

Core: Coder, Reviewer, Planner, Security, Researcher, Coordinator
Extended: Tester, DevOps, Debugger, Designer
