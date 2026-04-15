import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { Lighting } from './Lighting';

interface SceneRootProps {
  swarmEnvironment: string;
  children: React.ReactNode;
}

export function SceneRoot({ swarmEnvironment, children }: SceneRootProps) {
  return (
    <Canvas
      camera={{ position: [20, 18, 20], fov: 50, near: 0.1, far: 200 }}
      gl={{ antialias: true, toneMapping: THREE.ACESFilmicToneMapping, toneMappingExposure: 1.2 }}
      style={{ background: '#0a0e1a' }}
      onCreated={({ scene }) => {
        scene.fog = new THREE.FogExp2('#0a0e1a', 0.015);
      }}
    >
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minDistance={5}
        maxDistance={60}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
      />
      <Lighting swarmEnvironment={swarmEnvironment} />
      {children}
    </Canvas>
  );
}
