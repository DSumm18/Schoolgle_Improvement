/**
 * Ultra-minimal 3D test - just a spinning box
 */

"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useEffect, useState } from "react";

export default function MinimalTestPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    console.log("Minimal test page mounted");
  }, []);

  if (!mounted) {
    return (
      <div className="h-screen w-full bg-slate-900 flex items-center justify-center text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col">
      <div className="p-4 bg-slate-800 text-white">
        <h1 className="text-xl font-bold">Minimal 3D Test</h1>
        <p className="text-sm text-slate-300">You should see a spinning red box below</p>
      </div>

      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <Canvas
          camera={{ position: [0, 0, 5], fov: 75 }}
          style={{ width: '100%', height: '100%', background: '#0f172a' }}
          onCreated={(gl) => {
            console.log("Canvas created!", gl);
            gl.setSize(800, 600);
          }}
        >
          <color attach="background" args={['#0f172a']} />

          {/* Simple ambient light */}
          <ambientLight intensity={0.5} />

          {/* Directional light */}
          <directionalLight position={[5, 5, 5]} intensity={1} />

          {/* A simple spinning box */}
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]}>
            <boxGeometry args={[2, 2, 2]} />
            <meshStandardMaterial color="#ef4444" />
          </mesh>

          <OrbitControls />
        </Canvas>
      </div>

      <div className="p-4 bg-slate-800 text-white text-sm">
        If you see a red box, Three.js is working!
      </div>
    </div>
  );
}
