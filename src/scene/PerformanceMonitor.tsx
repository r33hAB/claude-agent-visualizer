import { createContext, useContext, useState, useRef, useCallback, type ReactNode } from 'react';
import { useFrame } from '@react-three/fiber';

type QualityTier = 1 | 2 | 3;

interface PerformanceState {
  tier: QualityTier;
  fps: number;
  lockedTier: QualityTier | null;
  setLockedTier: (tier: QualityTier | null) => void;
}

const PerformanceContext = createContext<PerformanceState>({
  tier: 1,
  fps: 60,
  lockedTier: null,
  setLockedTier: () => {},
});

export function usePerformanceTier() {
  return useContext(PerformanceContext);
}

const ROLLING_WINDOW = 120;
const RECOVERY_WINDOW = 300;

// Thresholds for downgrading
const TIER_1_TO_2_THRESHOLD = 45;
const TIER_2_TO_3_THRESHOLD = 30;

// Recovery requires exceeding the threshold by 10 fps
const TIER_2_TO_1_THRESHOLD = TIER_1_TO_2_THRESHOLD + 10; // 55
const TIER_3_TO_2_THRESHOLD = TIER_2_TO_3_THRESHOLD + 10; // 40

interface PerformanceProviderProps {
  children: ReactNode;
}

export function PerformanceProvider({ children }: PerformanceProviderProps) {
  const [tier, setTier] = useState<QualityTier>(1);
  const [fps, setFps] = useState(60);
  const [lockedTier, setLockedTier] = useState<QualityTier | null>(null);

  const deltasRef = useRef<number[]>([]);
  const lowFrameCountRef = useRef(0);
  const highFrameCountRef = useRef(0);

  useFrame((_, delta) => {
    const deltas = deltasRef.current;
    deltas.push(delta);
    if (deltas.length > ROLLING_WINDOW) {
      deltas.shift();
    }

    if (deltas.length < 10) return;

    const avgDelta = deltas.reduce((sum, d) => sum + d, 0) / deltas.length;
    const currentFps = Math.round(1 / avgDelta);
    setFps(currentFps);

    if (lockedTier !== null) return;

    const currentTier = tier;

    // Check for downgrade conditions
    if (currentTier === 1 && currentFps < TIER_1_TO_2_THRESHOLD) {
      lowFrameCountRef.current++;
      highFrameCountRef.current = 0;
      if (lowFrameCountRef.current >= ROLLING_WINDOW) {
        setTier(2);
        lowFrameCountRef.current = 0;
        deltasRef.current = [];
      }
    } else if (currentTier === 2 && currentFps < TIER_2_TO_3_THRESHOLD) {
      lowFrameCountRef.current++;
      highFrameCountRef.current = 0;
      if (lowFrameCountRef.current >= ROLLING_WINDOW) {
        setTier(3);
        lowFrameCountRef.current = 0;
        deltasRef.current = [];
      }
    }
    // Check for upgrade (recovery) conditions
    else if (currentTier === 3 && currentFps > TIER_3_TO_2_THRESHOLD) {
      highFrameCountRef.current++;
      lowFrameCountRef.current = 0;
      if (highFrameCountRef.current >= RECOVERY_WINDOW) {
        setTier(2);
        highFrameCountRef.current = 0;
        deltasRef.current = [];
      }
    } else if (currentTier === 2 && currentFps > TIER_2_TO_1_THRESHOLD) {
      highFrameCountRef.current++;
      lowFrameCountRef.current = 0;
      if (highFrameCountRef.current >= RECOVERY_WINDOW) {
        setTier(1);
        highFrameCountRef.current = 0;
        deltasRef.current = [];
      }
    } else {
      // FPS is in the normal range for the current tier; reset counters
      lowFrameCountRef.current = 0;
      highFrameCountRef.current = 0;
    }
  });

  const contextValue: PerformanceState = {
    tier: lockedTier ?? tier,
    fps,
    lockedTier,
    setLockedTier,
  };

  return (
    <PerformanceContext.Provider value={contextValue}>
      {children}
    </PerformanceContext.Provider>
  );
}
