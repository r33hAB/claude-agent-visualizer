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
        <Bloom intensity={0.15} luminanceThreshold={0.6} mipmapBlur />
      </EffectComposer>
    );
  }

  if (tier === 2) {
    return (
      <EffectComposer>
        <Bloom intensity={0.25} luminanceThreshold={0.5} mipmapBlur />
        <Vignette offset={0.3} darkness={0.3} blendFunction={BlendFunction.NORMAL} />
      </EffectComposer>
    );
  }

  // Tier 1 — subtle bloom, not blinding
  return (
    <EffectComposer>
      <Bloom intensity={0.35} luminanceThreshold={0.4} luminanceSmoothing={0.4} mipmapBlur />
      <Vignette offset={0.3} darkness={0.4} blendFunction={BlendFunction.NORMAL} />
    </EffectComposer>
  );
}
