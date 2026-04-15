import { useRef, useEffect, useState, useCallback, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import type { AnimationState } from '../types/agent';

interface WalkingAgentProps {
  homePosition: [number, number, number];
  targetPosition: [number, number, number] | null;
  onArrived?: () => void;
  onReturned?: () => void;
  children: (props: {
    currentPosition: [number, number, number];
    animationState: AnimationState;
    isWalking: boolean;
  }) => ReactNode;
}

type WalkPhase = 'home' | 'walking_to' | 'interacting' | 'walking_back';

const WALK_SPEED = 3;
const ARRIVAL_THRESHOLD = 0.3;
const INTERACT_DURATION = 1.2;
const MAX_DELTA = 0.05;

export default function WalkingAgent({
  homePosition,
  targetPosition,
  onArrived,
  onReturned,
  children,
}: WalkingAgentProps) {
  const groupRef = useRef<THREE.Group>(null);
  const phaseRef = useRef<WalkPhase>('home');
  const interactTimerRef = useRef(0);
  const posRef = useRef(new THREE.Vector3(...homePosition));

  // State used to communicate animation info to render-prop children.
  // Updated each frame only when the value actually changes, to avoid
  // unnecessary re-renders while still keeping children in sync.
  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [isWalking, setIsWalking] = useState(false);

  // Keep stable references for callbacks so we don't trigger extra effects.
  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;
  const onReturnedRef = useRef(onReturned);
  onReturnedRef.current = onReturned;

  // Keep homePosition ref up to date without re-running the effect.
  const homeRef = useRef(homePosition);
  homeRef.current = homePosition;

  // When targetPosition goes from null to a value, begin the walk.
  // When it goes back to null, we let the current phase finish naturally.
  useEffect(() => {
    if (targetPosition) {
      phaseRef.current = 'walking_to';
      interactTimerRef.current = 0;
    }
  }, [targetPosition]);

  // Helper to batch state updates only when changed.
  const prevAnimRef = useRef<AnimationState>('idle');
  const prevWalkingRef = useRef(false);

  const syncState = useCallback((anim: AnimationState, walking: boolean) => {
    if (anim !== prevAnimRef.current) {
      prevAnimRef.current = anim;
      setAnimState(anim);
    }
    if (walking !== prevWalkingRef.current) {
      prevWalkingRef.current = walking;
      setIsWalking(walking);
    }
  }, []);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const pos = posRef.current;
    const group = groupRef.current;

    switch (phaseRef.current) {
      case 'walking_to': {
        if (!targetPosition) {
          // Target cleared while walking — go home immediately.
          phaseRef.current = 'walking_back';
          break;
        }
        const target = new THREE.Vector3(...targetPosition);
        const dir = target.clone().sub(pos);
        const dist = dir.length();

        if (dist < ARRIVAL_THRESHOLD) {
          pos.copy(target);
          phaseRef.current = 'interacting';
          interactTimerRef.current = 0;
          syncState('interacting', true);
          onArrivedRef.current?.();
        } else {
          dir.normalize().multiplyScalar(WALK_SPEED * delta);
          pos.add(dir);
          syncState(dir.x >= 0 ? 'walking_right' : 'walking_left', true);
        }
        break;
      }

      case 'interacting': {
        interactTimerRef.current += delta;
        syncState('interacting', true);
        if (interactTimerRef.current >= INTERACT_DURATION) {
          phaseRef.current = 'walking_back';
        }
        break;
      }

      case 'walking_back': {
        const home = new THREE.Vector3(...homeRef.current);
        const dir = home.clone().sub(pos);
        const dist = dir.length();

        if (dist < ARRIVAL_THRESHOLD) {
          pos.copy(home);
          phaseRef.current = 'home';
          syncState('idle', false);
          onReturnedRef.current?.();
        } else {
          dir.normalize().multiplyScalar(WALK_SPEED * delta);
          pos.add(dir);
          syncState(dir.x >= 0 ? 'walking_right' : 'walking_left', true);
        }
        break;
      }

      case 'home':
      default: {
        // Snap to current home position (it may have shifted).
        pos.set(...homeRef.current);
        syncState('idle', false);
        break;
      }
    }

    // Apply position to the group ref directly — no React re-render needed
    // for spatial updates, only for animation-state changes consumed by children.
    if (group) {
      group.position.set(pos.x, pos.y, pos.z);
    }
  });

  // Provide current tuple for render-prop consumers that need it (e.g. beams).
  const currentPosition: [number, number, number] = [
    posRef.current.x,
    posRef.current.y,
    posRef.current.z,
  ];

  return (
    <group ref={groupRef}>
      {children({ currentPosition, animationState: animState, isWalking })}
    </group>
  );
}
