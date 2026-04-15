import { useRef, useState, useEffect, useCallback } from 'react';
import type { AgentState, AgentCategory, IsoPosition } from './types/agent';
import type { SpriteSheet } from './canvas/SpriteAnimator';
import { IsometricEngine } from './canvas/IsometricEngine';
import { generateAllSpriteSheets } from './canvas/SpriteGenerator';
import { AgentEntity } from './canvas/AgentEntity';
import { drawStation } from './canvas/StationRenderer';
import { EnvironmentRenderer } from './canvas/EnvironmentRenderer';
import { InteractionManager } from './canvas/InteractionManager';
import { useAgentData } from './hooks/useAgentData';
import { useCanvasResize } from './hooks/useCanvasResize';
import DetailPanel from './components/DetailPanel';
import SwarmOverview from './components/SwarmOverview';
import Controls from './components/Controls';

function assignGridPosition(index: number): IsoPosition {
  if (index === 0) return { gridX: 0, gridY: 0 };

  // Expand in rings using angle-based placement
  const ring = Math.ceil(Math.sqrt(index));
  const spotsInRing = ring * 6;
  const posInRing = (index - 1) % spotsInRing;
  const angle = (posInRing / spotsInRing) * Math.PI * 2;
  const radius = ring * 2;

  return {
    gridX: Math.round(Math.cos(angle) * radius),
    gridY: Math.round(Math.sin(angle) * radius),
  };
}

export function App() {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<IsometricEngine | null>(null);
  const environmentRef = useRef<EnvironmentRenderer>(new EnvironmentRenderer());
  const interactionMgrRef = useRef<InteractionManager>(new InteractionManager());
  const entitiesRef = useRef<Map<string, AgentEntity>>(new Map());
  const spriteSheetsRef = useRef<Map<AgentCategory, SpriteSheet>>(new Map());
  const sizeRef = useRef({ width: 800, height: 600 });

  const [selectedAgent, setSelectedAgent] = useState<AgentState | null>(null);
  const [activeFilters, setActiveFilters] = useState<Set<AgentCategory>>(
    () => new Set(),
  );

  const { agents, interactions, swarm, connected } = useAgentData();

  // Track whether filters have been initialized by the Controls component
  const filtersInitializedRef = useRef(false);

  // Load sprite sheets on mount
  useEffect(() => {
    generateAllSpriteSheets().then((sheets) => {
      spriteSheetsRef.current = sheets;
    });
  }, []);

  // Engine setup with render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const engine = new IsometricEngine(canvas);
    engineRef.current = engine;

    let lastTime = 0;

    engine.setRenderCallback((ctx, _camera, dt) => {
      const time = performance.now() / 1000;
      if (lastTime === 0) lastTime = time;
      lastTime = time;

      const w = sizeRef.current.width;
      const h = sizeRef.current.height;

      // Update systems
      environmentRef.current.update(dt);
      interactionMgrRef.current.update(dt, entitiesRef.current);

      // Draw environment as full-screen background
      ctx.save();
      ctx.resetTransform();
      environmentRef.current.draw(ctx);
      ctx.restore();

      // Collect visible entities for depth-sorted rendering
      const visibleEntities: Array<{ entity: AgentEntity; screenY: number }> = [];

      for (const [, entity] of entitiesRef.current) {
        const state = entity.getState();

        // Apply category filters (if filters set is non-empty, only show matching)
        if (filtersInitializedRef.current && activeFilters.size > 0 && !activeFilters.has(state.category)) {
          continue;
        }

        entity.update(dt);
        const screenPos = entity.getScreenPosition(w, h);
        visibleEntities.push({ entity, screenY: screenPos.y });
      }

      // Sort by screen Y for depth ordering (further = drawn first)
      visibleEntities.sort((a, b) => a.screenY - b.screenY);

      // Draw stations then agents, sorted by depth
      for (const { entity } of visibleEntities) {
        const state = entity.getState();
        const screenPos = entity.getScreenPosition(w, h);

        // Draw station tile behind each agent
        drawStation(ctx, screenPos.x, screenPos.y + 20, state.category, state.progress / 100, time);

        // Draw agent sprite
        entity.draw(ctx, w, h, time);
      }

      // Draw interaction beams/particles on top
      interactionMgrRef.current.draw(ctx, entitiesRef.current, w, h);
    });

    engine.start();

    return () => {
      engine.stop();
      engineRef.current = null;
    };
  }, [activeFilters]);

  // Sync agents from data hook into AgentEntity map
  useEffect(() => {
    const entities = entitiesRef.current;
    const sheets = spriteSheetsRef.current;

    // Track which IDs are in the new data
    const incomingIds = new Set(agents.keys());
    let index = 0;

    for (const [id, agentState] of agents) {
      if (entities.has(id)) {
        // Update existing entity
        entities.get(id)!.updateState(agentState);
      } else {
        // Create new entity
        const sheet = sheets.get(agentState.category);
        if (sheet) {
          const position = assignGridPosition(index);
          entities.set(id, new AgentEntity(agentState, position, sheet));
        }
      }
      index++;
    }

    // Remove agents that no longer exist
    for (const existingId of entities.keys()) {
      if (!incomingIds.has(existingId)) {
        entities.delete(existingId);
      }
    }

    // Update selected agent if it still exists
    if (selectedAgent) {
      const updated = agents.get(selectedAgent.id);
      if (updated) {
        setSelectedAgent(updated);
      } else {
        setSelectedAgent(null);
      }
    }
  }, [agents]); // eslint-disable-line react-hooks/exhaustive-deps

  // Process interaction events
  useEffect(() => {
    if (interactions.length > 0) {
      interactionMgrRef.current.processEvents(interactions, entitiesRef.current);
    }
  }, [interactions]);

  // Sync environment state from swarm
  useEffect(() => {
    environmentRef.current.setState(swarm.environment);
  }, [swarm.environment]);

  // Canvas resize handler
  const handleResize = useCallback((width: number, height: number) => {
    sizeRef.current = { width, height };
    environmentRef.current.resize(width, height);
    engineRef.current?.resize(width, height);
  }, []);

  useCanvasResize(containerRef, canvasRef, handleResize);

  // Click handler: select/deselect agents
  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const sx = e.clientX - rect.left;
    const sy = e.clientY - rect.top;
    const w = sizeRef.current.width;
    const h = sizeRef.current.height;

    for (const [, entity] of entitiesRef.current) {
      if (entity.containsPoint(sx, sy, w, h)) {
        setSelectedAgent(entity.getState());
        return;
      }
    }

    setSelectedAgent(null);
  }, []);

  // Pan handlers
  const isDraggingRef = useRef(false);
  const lastMouseRef = useRef({ x: 0, y: 0 });

  const handleMouseDown = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    isDraggingRef.current = true;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current) return;

    const dx = e.clientX - lastMouseRef.current.x;
    const dy = e.clientY - lastMouseRef.current.y;
    lastMouseRef.current = { x: e.clientX, y: e.clientY };

    engineRef.current?.pan(dx, dy);
  }, []);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  // Zoom handler
  const handleWheel = useCallback((e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    engineRef.current?.zoomBy(-e.deltaY * 0.001);
  }, []);

  // Filter change handler from Controls
  const handleFilterChange = useCallback((categories: Set<AgentCategory>) => {
    filtersInitializedRef.current = true;
    setActiveFilters(categories);
  }, []);

  return (
    <div className="w-screen h-screen relative">
      <div ref={containerRef} className="w-full h-full">
        <canvas
          ref={canvasRef}
          onClick={handleCanvasClick}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="cursor-grab active:cursor-grabbing"
        />
      </div>
      <SwarmOverview swarm={swarm} connected={connected} />
      <Controls
        onZoomIn={() => engineRef.current?.zoomBy(0.2)}
        onZoomOut={() => engineRef.current?.zoomBy(-0.2)}
        onResetView={() => {
          engineRef.current?.zoomTo(1);
          engineRef.current?.pan(
            -(engineRef.current?.getCamera().offsetX ?? 0),
            -(engineRef.current?.getCamera().offsetY ?? 0),
          );
        }}
        onFilterChange={handleFilterChange}
      />
      <DetailPanel agent={selectedAgent} onClose={() => setSelectedAgent(null)} />
    </div>
  );
}
