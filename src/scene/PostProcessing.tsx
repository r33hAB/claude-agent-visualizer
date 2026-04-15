import {
  EffectComposer,
  Bloom,
  Vignette,
  ChromaticAberration,
  DepthOfField,
} from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';
import { Vector2 } from 'three';
import { useMemo } from 'react';
import { usePerformanceTier } from './PerformanceMonitor';

interface PostProcessingProps {
  focusAgent?: boolean;
}

const CHROMATIC_OFFSET = new Vector2(0.002, 0.002);

export function PostProcessing({ focusAgent = false }: PostProcessingProps) {
  const { tier } = usePerformanceTier();

  const chromaticOffset = useMemo(() => CHROMATIC_OFFSET, []);

  if (tier === 3) {
    return (
      <EffectComposer>
        <Bloom
          intensity={0.5}
          luminanceThreshold={0.4}
          mipmapBlur
        />
      </EffectComposer>
    );
  }

  if (tier === 2) {
    return (
      <EffectComposer>
        <Bloom
          intensity={1.0}
          luminanceThreshold={0.3}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.5}
          blendFunction={BlendFunction.NORMAL}
        />
      </EffectComposer>
    );
  }

  // Tier 1: Full cinematic
  if (focusAgent) {
    return (
      <EffectComposer>
        <Bloom
          intensity={1.5}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.4}
          mipmapBlur
        />
        <Vignette
          offset={0.3}
          darkness={0.7}
          blendFunction={BlendFunction.NORMAL}
        />
        <ChromaticAberration
          offset={chromaticOffset}
          blendFunction={BlendFunction.NORMAL}
        />
        <DepthOfField
          focusDistance={0.01}
          focalLength={0.05}
          bokehScale={2}
        />
      </EffectComposer>
    );
  }

  return (
    <EffectComposer>
      <Bloom
        intensity={1.5}
        luminanceThreshold={0.2}
        luminanceSmoothing={0.4}
        mipmapBlur
      />
      <Vignette
        offset={0.3}
        darkness={0.7}
        blendFunction={BlendFunction.NORMAL}
      />
      <ChromaticAberration
        offset={chromaticOffset}
        blendFunction={BlendFunction.NORMAL}
      />
    </EffectComposer>
  );
}
