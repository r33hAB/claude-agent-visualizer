import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useCursor } from '@react-three/drei';
import type { Group } from 'three';
import type { AgentState, AnimationState } from '../types/agent';
import VoxelCharacter from './VoxelCharacter';
import Station3D from './Station3D';
import ProgressRing3D from './ProgressRing3D';
import AgentLabel from './AgentLabel';

interface AgentNodeProps {
  agentState: AgentState;
  position: [number, number, number];
  onSelect?: (agent: AgentState) => void;
}

const STATUS_TO_ANIMATION: Record<AgentState['status'], AnimationState> = {
  active: 'working',
  idle: 'idle',
  complete: 'celebrating',
  error: 'error',
  spawning: 'entering',
  terminated: 'exiting',
};

export default function AgentNode({ agentState, position, onSelect }: AgentNodeProps) {
  const groupRef = useRef<Group>(null);
  const timeRef = useRef(0);
  const [hovered, setHovered] = useState(false);

  useCursor(hovered);

  useFrame((_, delta) => {
    timeRef.current += delta;
  });

  const animationState = STATUS_TO_ANIMATION[agentState.status];
  const speedMultiplier = 0.5 + (agentState.progress / 100) * 1.5;

  const handlePointerDown = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      onSelect?.(agentState);
    },
    [onSelect, agentState],
  );

  const handlePointerOver = useCallback(
    (e: { stopPropagation: () => void }) => {
      e.stopPropagation();
      setHovered(true);
    },
    [],
  );

  const handlePointerOut = useCallback(() => {
    setHovered(false);
  }, []);

  return (
    <group
      ref={groupRef}
      position={position}
      onPointerDown={handlePointerDown}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* Station platform at ground level */}
      <group position={[0, 0, 0]}>
        <Station3D
          category={agentState.category}
          progress={agentState.progress}
          time={timeRef.current}
        />
      </group>

      {/* Progress ring just above ground */}
      <group position={[0, 0.05, 0]}>
        <ProgressRing3D progress={agentState.progress} />
      </group>

      {/* Character standing on the platform */}
      <group position={[0, 0.6, 0]}>
        <VoxelCharacter
          category={agentState.category}
          animationState={animationState}
          speedMultiplier={speedMultiplier}
        />
      </group>

      {/* Floating label above the character */}
      <group position={[0, 2.8, 0]}>
        <AgentLabel
          name={agentState.name}
          progress={agentState.progress}
          status={agentState.status}
        />
      </group>
    </group>
  );
}
