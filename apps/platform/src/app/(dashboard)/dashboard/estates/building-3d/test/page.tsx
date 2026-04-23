/**
 * Direct test page - no dynamic imports
 */
"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";

export default function DirectTestPage() {
  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col">
      <div className="p-4 bg-slate-800 text-white">
        <h1 className="text-xl font-bold">Direct Test (No Dynamic Import)</h1>
      </div>

      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{ width: '100%', height: '100%', background: '#0f172a' }}
        >
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 5, 5]} intensity={1} />

          <mesh>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>

          <OrbitControls />
        </Canvas>
      </div>
    </div>
  );
}
