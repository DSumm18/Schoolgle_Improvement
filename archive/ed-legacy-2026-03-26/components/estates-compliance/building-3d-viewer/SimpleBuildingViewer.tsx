/**
 * Simple 3D Building Viewer - No advanced features, just the basics
 */

"use client";

import React, { useState, useMemo, Suspense, useEffect } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Text, PerspectiveCamera, Environment, Grid } from "@react-three/drei";
import { Building2 } from "lucide-react";
import * as THREE from "three";

// Types
export interface Building3DData {
  id: string;
  name: string;
  buildings: Building3D[];
  groundPlane?: { width: number; depth: number };
}

export interface Building3D {
  id: string;
  name: string;
  position: [number, number, number];
  floors: Floor3D[];
}

export interface Floor3D {
  id: string;
  label: string;
  level: number;
  height: number;
  rooms: Room3D[];
}

export interface Room3D {
  id: string;
  name: string;
  type: string;
  position: [number, number, number];
  size: [number, number, number];
  color: string;
  hasFireExit?: boolean;
}

interface SimpleBuildingViewerProps {
  data: Building3DData;
  onRoomSelect?: (room: Room3D | null) => void;
}

// Simple Room Component
function SimpleRoom({ room, onClick }: { room: Room3D; onClick: () => void }) {
  const [hovered, setHovered] = useState(false);

  return (
    <mesh
      position={[room.position[0], room.position[1], room.position[2]]}
      scale={hovered ? 1.05 : 1}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
      }}
      onPointerOut={() => setHovered(false)}
    >
      <boxGeometry args={[room.size[0], room.size[1], room.size[2]]} />
      <meshStandardMaterial
        color={hovered ? "#60a5fa" : room.color}
        roughness={0.7}
        metalness={0.1}
      />

      {/* Room label */}
      <Text
        position={[0, room.size[1] / 2 + 0.5, 0]}
        fontSize={0.3}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>
    </mesh>
  );
}

// Scene Component
function Scene({ data, onRoomSelect }: { data: Building3DData; onRoomSelect?: (room: Room3D | null) => void }) {
  console.log("Scene rendering with data:", data.name, "buildings:", data.buildings.length);

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 10, 5]} intensity={0.8} castShadow />
      <hemisphereLight args={["#ffffff", "#444444", 0.6]} />

      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[data.groundPlane?.width || 100, data.groundPlane?.depth || 100]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.8} />
      </mesh>

      {/* Grid helper for orientation */}
      <Grid
        args={[100, 100]}
        cellSize={5}
        cellThickness={0.5}
        cellColor="#64748b"
        sectionSize={25}
        sectionThickness={1}
        sectionColor="#475569"
        fadeDistance={80}
        fadeStrength={1}
        position={[0, 0.01, 0]}
      />

      {/* Test cube - highly visible to verify rendering */}
      <mesh position={[0, 5, 0]} castShadow>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>

      {/* Buildings */}
      {data.buildings.map((building) => (
        <group key={building.id} position={building.position}>
          {building.floors.map((floor) => (
            <group key={floor.id} position={[0, floor.level * 3.5, 0]}>
              {floor.rooms.map((room) => (
                <SimpleRoom
                  key={room.id}
                  room={room}
                  onClick={() => onRoomSelect?.(room)}
                />
              ))}
            </group>
          ))}
        </group>
      ))}

      {/* Buildings */}
      {data.buildings.map((building) => (
        <group key={building.id} position={building.position}>
          {building.floors.map((floor) => (
            <group key={floor.id} position={[0, floor.level * 3.5, 0]}>
              {floor.rooms.map((room) => (
                <SimpleRoom
                  key={room.id}
                  room={room}
                  onClick={() => onRoomSelect?.(room)}
                />
              ))}
            </group>
          ))}
        </group>
      ))}

      {/* Environment */}
      <Environment preset="city" />
    </>
  );
}

// Main Component
export default function SimpleBuildingViewer({ data, onRoomSelect }: SimpleBuildingViewerProps) {
  console.log("SimpleBuildingViewer rendering:", data.name, "with", data.buildings.length, "buildings");

  return (
    <div className="relative w-full h-full" style={{ height: '600px', minHeight: '600px' }}>
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        style={{ width: '100%', height: '100%', background: '#0f172a' }}
      >
        <PerspectiveCamera makeDefault position={[0, 20, 30]} fov={60} />

        <Scene data={data} onRoomSelect={onRoomSelect} />

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={true}
          minDistance={10}
          maxDistance={100}
          maxPolarAngle={Math.PI / 2.1}
          target={[0, 0, 0]}
        />
      </Canvas>

      {/* Info overlay */}
      <div className="absolute bottom-4 left-4 bg-white/90 backdrop-blur rounded-lg px-4 py-2 text-sm">
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-slate-600" />
          <span className="text-slate-700">
            {data.name} • Drag to rotate • Scroll to zoom • Click rooms
          </span>
        </div>
      </div>
    </div>
  );
}

// Export types
export type { Building3DData, Building3D, Floor3D, Room3D };
