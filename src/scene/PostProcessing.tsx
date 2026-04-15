import {
  EffectComposer,
  Bloom,
  Vignette,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { usePerformanceTier } from './PerformanceMonitor';

export function PostProcessing() {
  const { tier } = usePerformanceTier();

  if (tier === 3) {
    return (
      <EffectComposer>
        <Bloom intensity={0.3} luminanceThreshold={0.5} mipmapBlur />
      </EffectComposer>
    );
  }

  if (tier === 2) {
    return (
      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.4} mipmapBlur />
        <Vignette offset={0.3} darkness={0.4} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    );
  }

  // Tier 1
  return (
    <EffectComposer>
      <Bloom intensity={0.8} luminanceThreshold={0.3} luminanceSmoothing={0.4} mipmapBlur />
      <Vignette offset={0.3} darkness={0.5} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
