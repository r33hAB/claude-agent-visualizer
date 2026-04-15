import { useState, useCallback } from 'react';
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

const CHARACTER_WORLD_Y = 1.92;
const STATION_Z_OFFSET = 1.2;
const STATION_SCALE = 2.5;
const STATION_Y_OFFSET = 0.7;

export default function AgentNode({
  agentState,
  position,
  walkTarget,
  interactionColor = '#60a5fa',
  onSelect,
  onWalkComplete,
}: AgentNodeProps) {
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  const baseAnimState = STATUS_TO_ANIMATION[agentState.status];
  const stationAnimState: AnimationState = walkTarget ? 'idle' : baseAnimState;
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
      <mesh position={[position[0], position[1] + 0.02, position[2] + 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 32]} />
        <meshBasicMaterial color="#020617" transparent opacity={hovered ? 0.24 : 0.16} depthWrite={false} />
      </mesh>

      <group position={[position[0], position[1] + STATION_Y_OFFSET, position[2] + STATION_Z_OFFSET]} scale={STATION_SCALE}>
        <Station3D
          category={agentState.category}
          progress={agentState.progress}
          animationState={stationAnimState}
        />
      </group>

      {/* Progress ring around character */}
      <group position={[position[0], position[1] + 0.05, position[2]]}>
        <ProgressRing3D progress={agentState.progress} />
      </group>

      {/* Character */}
      <WalkingAgent
        homePosition={position}
        targetPosition={walkTarget}
        onReturned={onWalkComplete}
      >
        {({ animationState: walkAnim, isWalking, interactPhase }) => {
          const finalAnim = isWalking ? walkAnim : baseAnimState;

          return (
            <>
              <group position={[0, CHARACTER_WORLD_Y, 0]}>
                <VoxelCharacter
                  category={agentState.category}
                  animationState={finalAnim}
                  speedMultiplier={speedMultiplier}
                  seated={!isWalking && (finalAnim === 'working' || finalAnim === 'idle' || finalAnim === 'interacting')}
                />
                <group position={[0, 7.2, 0.15]}>
                  <AgentLabel
                    name={agentState.name}
                    progress={agentState.progress}
                    status={isWalking ? (interactPhase > 0 ? 'interacting' : 'walking') : agentState.status}
                  />
                </group>
              </group>

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
