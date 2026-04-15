import { useMemo } from 'react';
import { Billboard, Text } from '@react-three/drei';
import { PROGRESS_COLORS } from '../types/agent';

function getProgressColor(progress: number): string {
  if (progress < 0) return PROGRESS_COLORS.error;
  if (progress <= 30) return PROGRESS_COLORS.low;
  if (progress <= 60) return PROGRESS_COLORS.mid;
  if (progress <= 90) return PROGRESS_COLORS.high;
  return PROGRESS_COLORS.complete;
}

interface AgentLabelProps {
  name: string;
  progress: number;
  status: string;
}

export default function AgentLabel({ name, progress, status }: AgentLabelProps) {
  const progressColor = getProgressColor(progress);
  const progressText = progress < 0 ? 'ERR' : `${Math.round(progress)}%`;

  const bgWidth = useMemo(() => {
    const maxLen = Math.max(name.length, status.length, progressText.length);
    return Math.max(maxLen * 0.14 + 0.3, 1.2);
  }, [name, status, progressText]);

  return (
    <group position={[0, 2.8, 0]}>
      <Billboard follow lockX={false} lockY={false} lockZ={false}>
        {/* Semi-transparent background */}
        <mesh position={[0, 0.1, -0.01]}>
          <planeGeometry args={[bgWidth, 0.8]} />
          <meshBasicMaterial color="#000000" transparent opacity={0.4} />
        </mesh>

        {/* Agent name */}
        <Text
          fontSize={0.25}
          color="white"
          anchorY="bottom"
          anchorX="center"
          position={[0, 0.2, 0]}
          font={undefined}
        >
          {name}
        </Text>

        {/* Progress */}
        <Text
          fontSize={0.18}
          color={progressColor}
          anchorY="bottom"
          anchorX="center"
          position={[0, 0.0, 0]}
          font={undefined}
        >
          {progressText}
        </Text>

        {/* Status */}
        <Text
          fontSize={0.14}
          color="#9ca3af"
          anchorY="bottom"
          anchorX="center"
          position={[0, -0.2, 0]}
          font={undefined}
        >
          {status}
        </Text>
      </Billboard>
    </group>
  );
}
