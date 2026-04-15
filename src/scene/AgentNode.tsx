import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import type { AgentState, AnimationState } from '../types/agent';
import VoxelCharacter from './VoxelCharacter';
import Station3D from './Station3D';
import ProgressRing3D from './ProgressRing3D';
import AgentLabel from './AgentLabel';
import WalkingAgent from './WalkingAgent';
import { InteractionEffect } from './effects/InteractionEffect';

interface AgentNodeProps {
  agentState: AgentState;
  position: [number, number, number];
  walkTarget: [number, number, number] | null;
  interactionColor?: string;
  onSelect?: (agent: AgentState) => void;
  onWalkComplete?: () => void;
}

const STATUS_TO_ANIMATION: Record<AgentState['status'], AnimationState> = {
  active: 'working',
  idle: 'idle',
  complete: 'celebrating',
  error: 'error',
  spawning: 'entering',
  terminated: 'exiting',
};

export default function AgentNode({
  agentState,
  position,
  walkTarget,
  interactionColor = '#60a5fa',
  onSelect,
  onWalkComplete,
}: AgentNodeProps) {
  const timeRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  useFrame((_, delta) => { timeRef.current += delta; });

  const baseAnimState = STATUS_TO_ANIMATION[agentState.status];
  const speedMultiplier = 0.5 + (agentState.progress / 100) * 1.5;

  const handlePointerDown = useCallback(
    (e: { stopPropagation: () => void }) => { e.stopPropagation(); onSelect?.(agentState); },
    [onSelect, agentState],
  );
  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => { e.stopPropagation(); setHovered(true); },
    [],
  );
  const handlePointerOut = useCallback(() => setHovered(false), []);

  return (
    <group
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Station stays at home — doesn't walk */}
      <group position={position}>
        <Station3D
          category={agentState.category}
          progress={agentState.progress}
          time={timeRef.current}
        />
        <group position={[0, 0.05, 0]}>
          <ProgressRing3D progress={agentState.progress} />
        </group>
      </group>

      {/* Character walks via WalkingAgent */}
      <WalkingAgent
        homePosition={position}
        targetPosition={walkTarget}
        onReturned={onWalkComplete}
      >
        {({ animationState: walkAnim, isWalking, interactPhase }) => {
          const finalAnim = isWalking ? walkAnim : baseAnimState;

          return (
            <>
              <group position={[0, 0.6, 0]}>
                <VoxelCharacter
                  category={agentState.category}
                  animationState={finalAnim}
                  speedMultiplier={speedMultiplier}
                />
                {/* Label follows the character */}
                <group position={[0, 2.2, 0]}>
                  <AgentLabel
                    name={agentState.name}
                    progress={agentState.progress}
                    status={isWalking ? (interactPhase > 0 ? 'interacting' : 'walking') : agentState.status}
                  />
                </group>
              </group>

              {/* Interaction visual effect — plays during the interaction phase */}
              <InteractionEffect
                active={interactPhase > 0}
                phase={interactPhase}
                color={interactionColor}
              />
            </>
          );
        }}
      </WalkingAgent>
    </group>
  );
}
