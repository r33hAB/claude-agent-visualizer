import type { InteractionEvent, InteractionType } from '../types/agent';
import type { AgentEntity } from './AgentEntity';
import { findPath } from './Pathfinder';

const MAX_PHYSICAL_CONCURRENT = 3;
const BEAM_MAX_LIFE = 1.5; // seconds
const INTERACT_DURATION = 0.8; // seconds

interface ActiveBeam {
  event: InteractionEvent;
  life: number;
  maxLife: number;
}

type PhysicalPhase = 'walking_to' | 'interacting' | 'walking_back';

interface PhysicalAnimation {
  event: InteractionEvent;
  agentId: string;
  phase: PhysicalPhase;
  originalGridPos: { gridX: number; gridY: number };
  phaseTimer: number;
}

export class InteractionManager {
  private beams: ActiveBeam[] = [];
  private physicals: PhysicalAnimation[] = [];
  private pendingPhysicals: InteractionEvent[] = [];

  processEvents(events: InteractionEvent[], agents: Map<string, AgentEntity>): void {
    for (const event of events) {
      if (event.priority === 'beam') {
        this.beams.push({ event, life: 0, maxLife: BEAM_MAX_LIFE });
        continue;
      }

      // Physical interaction
      const sourceAgent = agents.get(event.sourceAgentId);
      const targetAgent = agents.get(event.targetAgentId);

      if (!sourceAgent || !targetAgent) {
        // Downgrade to beam if agent not found
        this.beams.push({ event, life: 0, maxLife: BEAM_MAX_LIFE });
        continue;
      }

      if (this.physicals.length < MAX_PHYSICAL_CONCURRENT) {
        this.startPhysical(event, sourceAgent, targetAgent, agents);
      } else {
        this.pendingPhysicals.push(event);
      }
    }
  }

  update(dt: number, agents: Map<string, AgentEntity>): void {
    // Age beams and remove expired
    for (let i = this.beams.length - 1; i >= 0; i--) {
      this.beams[i].life += dt;
      if (this.beams[i].life >= this.beams[i].maxLife) {
        this.beams.splice(i, 1);
      }
    }

    // Advance physical phases
    for (let i = this.physicals.length - 1; i >= 0; i--) {
      const phys = this.physicals[i];
      const agent = agents.get(phys.agentId);

      if (!agent) {
        this.physicals.splice(i, 1);
        continue;
      }

      switch (phys.phase) {
        case 'walking_to':
          if (!agent.isWalking()) {
            phys.phase = 'interacting';
            phys.phaseTimer = 0;
          }
          break;

        case 'interacting':
          phys.phaseTimer += dt;
          if (phys.phaseTimer >= INTERACT_DURATION) {
            phys.phase = 'walking_back';
            agent.walkTo(phys.originalGridPos);
          }
          break;

        case 'walking_back':
          if (!agent.isWalking()) {
            this.physicals.splice(i, 1);
          }
          break;
      }
    }

    // Dequeue pending physicals
    if (this.pendingPhysicals.length > 3) {
      // Downgrade excess to beams
      const excess = this.pendingPhysicals.splice(3);
      for (const event of excess) {
        this.beams.push({ event, life: 0, maxLife: BEAM_MAX_LIFE });
      }
    }

    while (
      this.pendingPhysicals.length > 0 &&
      this.physicals.length < MAX_PHYSICAL_CONCURRENT
    ) {
      const event = this.pendingPhysicals.shift()!;
      const sourceAgent = agents.get(event.sourceAgentId);
      const targetAgent = agents.get(event.targetAgentId);

      if (!sourceAgent || !targetAgent) {
        this.beams.push({ event, life: 0, maxLife: BEAM_MAX_LIFE });
        continue;
      }

      this.startPhysical(event, sourceAgent, targetAgent, agents);
    }
  }

  draw(
    ctx: CanvasRenderingContext2D,
    agents: Map<string, AgentEntity>,
    canvasWidth: number,
    canvasHeight: number,
  ): void {
    for (const beam of this.beams) {
      const source = agents.get(beam.event.sourceAgentId);
      const target = agents.get(beam.event.targetAgentId);
      if (!source || !target) continue;

      const srcPos = source.getScreenPosition(canvasWidth, canvasHeight);
      const tgtPos = target.getScreenPosition(canvasWidth, canvasHeight);
      const alpha = Math.max(0, 1 - beam.life / beam.maxLife);

      this.drawBeamByType(ctx, beam.event.type, srcPos, tgtPos, alpha, beam.life);
    }
  }

  private drawBeamByType(
    ctx: CanvasRenderingContext2D,
    type: InteractionType,
    src: { x: number; y: number },
    tgt: { x: number; y: number },
    alpha: number,
    life: number,
  ): void {
    ctx.save();

    switch (type) {
      case 'status_update': {
        ctx.setLineDash([4, 8]);
        ctx.strokeStyle = `rgba(59, 130, 246, ${alpha})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
        break;
      }

      case 'memory_sharing': {
        // Particle stream: 8 dots moving along the line
        const dx = tgt.x - src.x;
        const dy = tgt.y - src.y;
        ctx.fillStyle = `rgba(168, 85, 247, ${alpha})`;
        for (let i = 0; i < 8; i++) {
          const t = ((life * 2 + i / 8) % 1);
          const px = src.x + dx * t;
          const py = src.y + dy * t;
          ctx.beginPath();
          ctx.arc(px, py, 2.5, 0, Math.PI * 2);
          ctx.fill();
        }
        break;
      }

      case 'coordination_sync': {
        // Expanding ripple circle from source
        const radius = (life % 1) * 80;
        ctx.strokeStyle = `rgba(34, 211, 238, ${alpha * (1 - (life % 1))})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(src.x, src.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        break;
      }

      case 'heartbeat': {
        // Very subtle white line
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.05 * alpha})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
        break;
      }

      default: {
        // Generic gray line
        ctx.strokeStyle = `rgba(156, 163, 175, ${alpha * 0.6})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.stroke();
        break;
      }
    }

    ctx.restore();
  }

  private startPhysical(
    event: InteractionEvent,
    sourceAgent: AgentEntity,
    targetAgent: AgentEntity,
    agents: Map<string, AgentEntity>,
  ): void {
    const sourcePos = sourceAgent.getPosition();
    const targetPos = targetAgent.getPosition();

    // Build occupied set from all agents
    const occupied = new Set<string>();
    for (const [, agent] of agents) {
      const pos = agent.getPosition();
      occupied.add(`${pos.gridX},${pos.gridY}`);
    }
    // Remove source and target from occupied so pathfinding works
    occupied.delete(`${sourcePos.gridX},${sourcePos.gridY}`);
    occupied.delete(`${targetPos.gridX},${targetPos.gridY}`);

    const path = findPath(sourcePos, targetPos, occupied);

    // Walk source agent to target position
    if (path.length > 1) {
      sourceAgent.walkTo(path[path.length - 1]);
    }

    this.physicals.push({
      event,
      agentId: event.sourceAgentId,
      phase: 'walking_to',
      originalGridPos: { gridX: sourcePos.gridX, gridY: sourcePos.gridY },
      phaseTimer: 0,
    });
  }

  getActiveBeamCount(): number {
    return this.beams.length;
  }

  getActivePhysicalCount(): number {
    return this.physicals.length;
  }

  getPendingCount(): number {
    return this.pendingPhysicals.length;
  }
}
