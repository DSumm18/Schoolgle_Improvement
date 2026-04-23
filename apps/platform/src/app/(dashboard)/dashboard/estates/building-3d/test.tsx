"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Simple Three.js test to verify 3D rendering works
 */

export default function ThreeTestPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [status, setStatus] = useState("Initializing...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log("ThreeTestPage mounted");
    setStatus("Loading Three.js...");

    async function initThree() {
      try {
        // Dynamically import three to avoid SSR issues
        const THREE = (await import("three")).default;
        console.log("Three.js loaded:", THREE);
        setStatus("Three.js loaded, creating scene...");

        const canvas = canvasRef.current;
        if (!canvas) {
          throw new Error("Canvas ref is null");
        }

        // Create scene
        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x1e293b); // slate-900

        // Create camera
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 5;

        // Create renderer
        const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);

        // Add a simple rotating cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x3b82f6 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        setStatus("Rendering! You should see a blue cube.");

        // Animation loop
        function animate() {
          requestAnimationFrame(animate);
          cube.rotation.x += 0.01;
          cube.rotation.y += 0.01;
          renderer.render(scene, camera);
        }
        animate();

        // Handle resize
        function handleResize() {
          camera.aspect = window.innerWidth / window.innerHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, window.innerHeight);
        }
        window.addEventListener("resize", handleResize);

        console.log("Three.js scene created successfully");
      } catch (err) {
        console.error("Three.js error:", err);
        setError(err instanceof Error ? err.message : String(err));
        setStatus("Failed to load Three.js");
      }
    }

    initThree();
  }, []);

  return (
    <div className="h-screen w-full bg-slate-900 flex flex-col">
      <div className="absolute top-4 left-4 z-10 bg-white/10 backdrop-blur rounded-lg p-4 max-w-md">
        <h1 className="text-white font-bold mb-2">Three.js Test Page</h1>
        <p className="text-sm text-slate-300 mb-2">{status}</p>
        {error && (
          <div className="bg-red-500/20 border border-red-500 rounded p-2 text-red-200 text-xs">
            <strong>Error:</strong> {error}
          </div>
        )}
        <p className="text-xs text-slate-400 mt-2">
          If you see a spinning blue cube, Three.js is working!
        </p>
      </div>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
}
