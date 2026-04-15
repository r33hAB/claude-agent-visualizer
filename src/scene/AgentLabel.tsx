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

const STATUS_COLORS: Record<string, string> = {
  active: '#7dd3fc',
  idle: '#94a3b8',
  complete: '#fde68a',
  error: '#fb7185',
  spawning: '#c084fc',
  terminated: '#64748b',
  walking: '#93c5fd',
  interacting: '#67e8f9',
};

export default function AgentLabel({ name, progress, status }: AgentLabelProps) {
  const progressColor = getProgressColor(progress);
  const progressText = progress < 0 ? 'ERR' : `${Math.round(progress)}%`;
  const statusText = status.replace(/_/g, ' ').toUpperCase();
  const statusColor = STATUS_COLORS[status] ?? '#9ca3af';

  const bgWidth = useMemo(() => {
    const maxLen = Math.max(name.length, statusText.length, progressText.length);
    return Math.max(maxLen * 0.11 + 0.9, 1.65);
  }, [name, statusText, progressText]);

  return (
    <group renderOrder={80}>
      <Billboard follow lockX={false} lockY={false} lockZ={false} renderOrder={80}>
        <mesh position={[0, 0.11, -0.035]}>
          <boxGeometry args={[bgWidth, 0.9, 0.05]} />
          <meshBasicMaterial color="#040712" transparent opacity={0.82} depthWrite={false} depthTest={false} />
        </mesh>
        <mesh position={[0, 0.45, -0.005]}>
          <boxGeometry args={[bgWidth - 0.16, 0.035, 0.01]} />
          <meshBasicMaterial color={progressColor} transparent opacity={0.9} depthWrite={false} depthTest={false} />
        </mesh>
        <Text
          fontSize={0.22}
          color="#eef4ff"
          anchorY="bottom"
          anchorX="center"
          position={[0, 0.14, 0]}
          font={undefined}
          outlineWidth={0.018}
          outlineColor="#020617"
          depthOffset={-10}
          renderOrder={81}
        >
          {name}
        </Text>
        <Text
          fontSize={0.2}
          color={progressColor}
          anchorY="bottom"
          anchorX="center"
          position={[0, -0.08, 0]}
          font={undefined}
          outlineWidth={0.016}
          outlineColor="#020617"
          depthOffset={-10}
          renderOrder={81}
        >
          {progressText}
        </Text>
        <Text
          fontSize={0.12}
          color={statusColor}
          anchorY="bottom"
          anchorX="center"
          position={[0, -0.3, 0]}
          font={undefined}
          outlineWidth={0.014}
          outlineColor="#020617"
          depthOffset={-10}
          renderOrder={81}
        >
          {statusText}
        </Text>
      </Billboard>
    </group>
  );
}
