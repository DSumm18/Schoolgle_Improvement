"use client";

import React, { useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html } from "@react-three/drei";
import * as THREE from "three";
import { TextureLoader } from "three";

interface GroveHouse3DSceneProps {
  onRoomClick?: (roomId: string) => void;
  showRoof?: boolean;
  showCompliance?: boolean;
  xRayMode?: boolean;
  showLabels?: boolean;
  showFireRoutes?: boolean;
  showFireEquipment?: boolean;
  selectedRoomId?: string | null;
}

// Room outlines traced from the PDF - these are the BLOCK boundaries
// Individual room labels will be added by the school
// Coordinates in meters, relative to building centre
interface RoomOutline {
  id: string;
  label: string; // What's written on the PDF (block name or room number)
  schoolLabel?: string; // What the school names it (added later)
  x: number;
  z: number;
  w: number;
  d: number;
  color: string;
  block: string;
}

// These outlines match the visible room boundaries on the PDF
// Positions are approximate but derived from the actual drawing
const ROOM_OUTLINES: RoomOutline[] = [
  // BLOCK 1 rooms (bottom-centre on the PDF)
  { id: "b1-r1", label: "Block 1 - Room 1", block: "Block 1", x: -4, z: -6, w: 6, d: 5, color: "#3b82f6" },
  { id: "b1-r2", label: "Block 1 - Room 2", block: "Block 1", x: -4, z: -11.5, w: 6, d: 5, color: "#3b82f6" },
  { id: "b1-r3", label: "Block 1 - Room 3", block: "Block 1", x: 2.5, z: -8, w: 3, d: 4, color: "#3b82f6" },

  // BLOCK 2 rooms (to the left of Block 1)
  { id: "b2-r1", label: "Block 2 - Room 1", block: "Block 2", x: -11, z: -6, w: 6, d: 5, color: "#60a5fa" },
  { id: "b2-r2", label: "Block 2 - Room 2", block: "Block 2", x: -11, z: -11.5, w: 6, d: 5, color: "#60a5fa" },
  { id: "b2-r3", label: "Block 2 - Room 3", block: "Block 2", x: -6, z: -14, w: 3, d: 3, color: "#60a5fa" },

  // 2001 BUILDING (far left - highlighted in purple on page 2)
  { id: "2001-r1", label: "2001 Building - Hall", block: "2001 Building", x: -24, z: -6, w: 10, d: 8, color: "#f59e0b" },
  { id: "2001-r2", label: "2001 Building - Room 2", block: "2001 Building", x: -24, z: 3, w: 7, d: 5, color: "#f59e0b" },
  { id: "2001-r3", label: "2001 Building - Room 3", block: "2001 Building", x: -30, z: -8, w: 7, d: 6, color: "#f59e0b" },
  { id: "2001-r4", label: "2001 Building - Room 4", block: "2001 Building", x: -30, z: 0, w: 4, d: 3, color: "#f59e0b" },

  // BLOCK 3 (centre-right, entrance area)
  { id: "b3-r1", label: "Block 3 - Room 1", block: "Block 3", x: 4, z: -4, w: 6, d: 5, color: "#22c55e" },
  { id: "b3-r2", label: "Block 3 - Room 2", block: "Block 3", x: 8, z: -9, w: 4, d: 4, color: "#22c55e" },
  { id: "b3-r3", label: "Block 3 - Room 3", block: "Block 3", x: 8, z: -4, w: 4, d: 4, color: "#22c55e" },
  { id: "b3-entrance", label: "Main Entrance", block: "Block 3", x: 6, z: -15, w: 4, d: 3, color: "#22c55e" },

  // BLOCK 4 (top-right)
  { id: "b4-r1", label: "Block 4 - Room 1", block: "Block 4", x: 4, z: 10, w: 6, d: 5, color: "#a78bfa" },
  { id: "b4-r2", label: "Block 4 - Room 2", block: "Block 4", x: 4, z: 16, w: 6, d: 5, color: "#a78bfa" },
  { id: "b4-r3", label: "Block 4 - Room 3", block: "Block 4", x: 11, z: 12, w: 5, d: 4, color: "#a78bfa" },
  { id: "b4-r4", label: "Block 4 - Room 4", block: "Block 4", x: 11, z: 16, w: 4, d: 4, color: "#a78bfa" },

  // 2017 BUILDING (top extension - highlighted in yellow on page 2)
  { id: "2017-r1", label: "2017 Building - Room 1", block: "2017 Building", x: -2, z: 18, w: 5, d: 5, color: "#f97316" },
  { id: "2017-r2", label: "2017 Building - Room 2", block: "2017 Building", x: -2, z: 24, w: 5, d: 4, color: "#f97316" },
  { id: "2017-r3", label: "2017 Building - Room 3", block: "2017 Building", x: 4, z: 20, w: 5, d: 4, color: "#f97316" },
];

// Fire exits visible on the PDF (door symbols with exit marking)
const FIRE_EXITS = [
  { x: 6, z: -17, label: "Main Entrance" },
  { x: -4, z: -14, label: "Block 1 Exit" },
  { x: -11, z: -14, label: "Block 2 Exit" },
  { x: -24, z: -14, label: "Hall South Exit" },
  { x: -34, z: -6, label: "Nursery Exit" },
  { x: -24, z: 6, label: "Kitchen Exit" },
  { x: 12, z: -6, label: "Block 3 East Exit" },
  { x: 12, z: 10, label: "Block 4 South Exit" },
  { x: 4, z: 22, label: "Block 4 North Exit" },
  { x: -4, z: 28, label: "2017 Building Exit" },
];

// ─── Room Box Component ─────────────────────────────────

function RoomBox({ room, isSelected, onClick, showLabel }: { 
  room: RoomOutline; isSelected: boolean; onClick: () => void; showLabel: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const wallHeight = 2.8;
  const color = new THREE.Color(room.color);
  
  return (
    <group position={[room.x + room.w/2, 0, room.z + room.d/2]}>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <planeGeometry args={[room.w, room.d]} />
        <meshStandardMaterial 
          color={room.color} 
          transparent 
          opacity={hovered ? 0.5 : isSelected ? 0.4 : 0.15} 
        />
      </mesh>
      
      {/* Walls (transparent) */}
      <mesh 
        ref={meshRef}
        position={[0, wallHeight / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        onPointerEnter={() => { setHovered(true); document.body.style.cursor = 'pointer'; }}
        onPointerLeave={() => { setHovered(false); document.body.style.cursor = 'default'; }}
      >
        <boxGeometry args={[room.w, wallHeight, room.d]} />
        <meshStandardMaterial 
          color={room.color} 
          transparent 
          opacity={hovered ? 0.25 : isSelected ? 0.2 : 0.08}
          side={THREE.DoubleSide}
        />
      </mesh>
      
      {/* Edges */}
      <lineSegments position={[0, wallHeight / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(room.w, wallHeight, room.d)]} />
        <lineBasicMaterial color={room.color} transparent opacity={hovered ? 0.8 : 0.3} />
      </lineSegments>
      
      {/* Label */}
      {showLabel && (
        <Html center position={[0, wallHeight + 0.5, 0]} style={{ pointerEvents: 'none' }}>
          <div style={{
            color: 'white',
            fontSize: '10px',
            fontWeight: 'bold',
            fontFamily: 'system-ui',
            whiteSpace: 'nowrap',
            textShadow: '0 0 6px rgba(0,0,0,0.9)',
            background: `${room.color}44`,
            padding: '2px 6px',
            borderRadius: '3px',
          }}>
            {room.schoolLabel || room.label}
          </div>
        </Html>
      )}
    </group>
  );
}

// ─── Fire Exit Marker ────────────────────────────────────

function FireExitMarker({ exit }: { exit: typeof FIRE_EXITS[0] }) {
  return (
    <group position={[exit.x, 0, exit.z]}>
      <mesh position={[0, 0.1, 0]}>
        <cylinderGeometry args={[0.4, 0.4, 0.2, 16]} />
        <meshStandardMaterial color="#ef4444" emissive="#ef4444" emissiveIntensity={0.5} />
      </mesh>
      <Html center position={[0, 1.5, 0]} style={{ pointerEvents: 'none' }}>
        <div style={{
          color: '#ef4444',
          fontSize: '8px',
          fontWeight: 'bold',
          fontFamily: 'system-ui',
          whiteSpace: 'nowrap',
          textShadow: '0 0 4px rgba(0,0,0,0.9)',
        }}>
          🚪 {exit.label}
        </div>
      </Html>
    </group>
  );
}

// ─── Ground with PDF Texture ─────────────────────────────

function GroundPlane() {
  const texture = useLoader(TextureLoader, '/site-plans/grove-house-ground-floor.png');
  
  // The PDF image aspect ratio is roughly 1654:1170 ≈ 1.41:1
  // Scale to match our building coordinates
  const planeWidth = 80;
  const planeHeight = planeWidth / 1.41;
  
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, -0.05, 5]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial map={texture} transparent opacity={0.4} />
    </mesh>
  );
}

// ─── Scene ───────────────────────────────────────────────

function SceneContent(props: GroveHouse3DSceneProps) {
  const [selectedId, setSelectedId] = useState<string | null>(props.selectedRoomId || null);
  
  const handleRoomClick = useCallback((id: string) => {
    setSelectedId(prev => prev === id ? null : id);
    props.onRoomClick?.(id);
  }, [props.onRoomClick]);

  return (
    <>
      <ambientLight intensity={0.4} />
      <directionalLight position={[30, 40, 20]} intensity={0.6} castShadow />
      <directionalLight position={[-20, 30, -10]} intensity={0.3} />
      
      {/* Dark ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]}>
        <planeGeometry args={[120, 100]} />
        <meshStandardMaterial color="#0f172a" />
      </mesh>
      
      {/* PDF floor plan as ground texture */}
      <GroundPlane />
      
      {/* Grid */}
      <gridHelper args={[100, 50, 0x1e3a5f, 0x1e3a5f]} position={[0, -0.08, 0]} />
      
      {/* Room outlines */}
      {ROOM_OUTLINES.map(room => (
        <RoomBox 
          key={room.id} 
          room={room} 
          isSelected={selectedId === room.id}
          onClick={() => handleRoomClick(room.id)}
          showLabel={props.showLabels !== false}
        />
      ))}
      
      {/* Fire exits */}
      {props.showFireRoutes && FIRE_EXITS.map((exit, i) => (
        <FireExitMarker key={i} exit={exit} />
      ))}
      
      {/* Outdoor areas */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.06, -22]}>
        <planeGeometry args={[40, 12]} />
        <meshStandardMaterial color="#1a3320" transparent opacity={0.3} />
      </mesh>
      
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        target={[0, 0, 0]}
      />
    </>
  );
}

export default function GroveHouse3DScene(props: GroveHouse3DSceneProps) {
  return (
    <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
      <Canvas
        camera={{ position: [30, 35, 40], fov: 50 }}
        style={{ background: "#0a0f1a" }}
        gl={{ antialias: true }}
      >
        <SceneContent {...props} />
      </Canvas>
    </div>
  );
}
