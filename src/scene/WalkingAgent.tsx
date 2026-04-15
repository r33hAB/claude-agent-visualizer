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
    facingAngle: number;
    interactPhase: number; // 0-1 during interaction, 0 otherwise
  }) => ReactNode;
}

type WalkPhase = 'home' | 'walking_to' | 'interacting' | 'walking_back';

const WALK_SPEED = 4;
const STOP_DISTANCE = 2.5; // stop this far from target — don't overlap
const INTERACT_DURATION = 2.5; // longer interaction for visual payoff
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
  const facingAngleRef = useRef(0);

  const [animState, setAnimState] = useState<AnimationState>('idle');
  const [isWalking, setIsWalking] = useState(false);
  const [interactPhase, setInteractPhase] = useState(0);

  const onArrivedRef = useRef(onArrived);
  onArrivedRef.current = onArrived;
  const onReturnedRef = useRef(onReturned);
  onReturnedRef.current = onReturned;
  const homeRef = useRef(homePosition);
  homeRef.current = homePosition;

  const prevAnimRef = useRef<AnimationState>('idle');
  const prevWalkingRef = useRef(false);

  const syncState = useCallback((anim: AnimationState, walking: boolean) => {
    if (anim !== prevAnimRef.current) { prevAnimRef.current = anim; setAnimState(anim); }
    if (walking !== prevWalkingRef.current) { prevWalkingRef.current = walking; setIsWalking(walking); }
  }, []);

  useEffect(() => {
    if (targetPosition) {
      phaseRef.current = 'walking_to';
      interactTimerRef.current = 0;
    }
  }, [targetPosition]);

  useFrame((_, rawDelta) => {
    const delta = Math.min(rawDelta, MAX_DELTA);
    const pos = posRef.current;
    const group = groupRef.current;

    switch (phaseRef.current) {
      case 'walking_to': {
        if (!targetPosition) { phaseRef.current = 'walking_back'; break; }
        const target = new THREE.Vector3(...targetPosition);
        const dir = target.clone().sub(pos);
        const dist = dir.length();

        // Calculate facing angle toward target
        facingAngleRef.current = Math.atan2(dir.x, dir.z);

        if (dist <= STOP_DISTANCE) {
          // Stop near the target, don't walk ON TOP of them
          phaseRef.current = 'interacting';
          interactTimerRef.current = 0;
          syncState('interacting', true);
          setInteractPhase(0);
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
        const phase = Math.min(interactTimerRef.current / INTERACT_DURATION, 1);
        setInteractPhase(phase);
        syncState('interacting', true);
        if (interactTimerRef.current >= INTERACT_DURATION) {
          phaseRef.current = 'walking_back';
          setInteractPhase(0);
        }
        break;
      }

      case 'walking_back': {
        const home = new THREE.Vector3(...homeRef.current);
        const dir = home.clone().sub(pos);
        const dist = dir.length();

        facingAngleRef.current = Math.atan2(dir.x, dir.z);

        if (dist < 0.3) {
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
      default:
        pos.set(...homeRef.current);
        syncState('idle', false);
        break;
    }

    if (group) {
      group.position.set(pos.x, pos.y, pos.z);
      // Rotate to face direction of travel
      if (phaseRef.current !== 'home') {
        group.rotation.y = facingAngleRef.current;
      } else {
        // Smoothly return to default facing
        group.rotation.y += (0 - group.rotation.y) * 0.05;
      }
    }
  });

  const currentPosition: [number, number, number] = [posRef.current.x, posRef.current.y, posRef.current.z];

  return (
    <group ref={groupRef}>
      {children({
        currentPosition,
        animationState: animState,
        isWalking,
        facingAngle: facingAngleRef.current,
        interactPhase,
      })}
    </group>
  );
}
