"use client";

import React, { Suspense, useRef, useState, useCallback, useMemo } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { OrbitControls, Html, useTexture } from "@react-three/drei";
import * as THREE from "three";
import { ROOM_OUTLINES, type RoomOutline } from "./grove-house-3d-data";

interface GroveHouse3DSceneProps {
  onRoomClick?: (roomId: string) => void;
  showRoof?: boolean;
  showCompliance?: boolean;
  xRayMode?: boolean;
  showLabels?: boolean;
  showFireRoutes?: boolean;
  showFireEquipment?: boolean;
  selectedRoomId?: string | null;
  roomLabels?: Record<string, string>;
}

// Fire exits visible on the PDF (door symbols with exit marking)
const FIRE_EXITS = [
  { x: -5.0, z: -6.0, label: "Main Entrance" },
  { x: -10.0, z: -7.0, label: "Block 1 Exit" },
  { x: -20.0, z: -7.0, label: "Block 2 Exit" },
  { x: -38.0, z: 8.0, label: "Hall South Exit" },
  { x: -40.9, z: 21.0, label: "2001 Building Exit" },
  { x: -30.5, z: 16.0, label: "Kitchen Exit" },
  { x: 0.0, z: 14.5, label: "Block 3 East Exit" },
  { x: -7.0, z: 19.4, label: "Block 4 South Exit" },
  { x: 4.0, z: 27.4, label: "Block 4 North Exit" },
  { x: -10.0, z: 30.9, label: "2017 Building Exit" },
];

// ─── Room Box Component ─────────────────────────────────

function RoomBox({ room, isSelected, onClick, showLabel, displayLabel }: {
  room: RoomOutline; isSelected: boolean; onClick: () => void; showLabel: boolean; displayLabel?: string;
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
          opacity={hovered ? 0.6 : isSelected ? 0.5 : 0.3}
        />
      </mesh>

      {/* Walls (semi-transparent) */}
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
          opacity={hovered ? 0.35 : isSelected ? 0.3 : 0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Edges */}
      <lineSegments position={[0, wallHeight / 2, 0]}>
        <edgesGeometry args={[new THREE.BoxGeometry(room.w, wallHeight, room.d)]} />
        <lineBasicMaterial color={room.color} transparent opacity={hovered ? 0.9 : 0.5} />
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
            {displayLabel || room.schoolLabel || room.label}
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
  const texture = useTexture('/site-plans/grove-house-ground-floor.png');

  // PDF image: 3309×2339 px, aspect ratio 1.4146:1
  // Must match coordinate mapping: x=-45..35 (80 units), z=-23.35..33.35 (56.7 units)
  const planeWidth = 80;
  const planeHeight = planeWidth / (3309 / 2339);

  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, -0.05, 5]}>
      <planeGeometry args={[planeWidth, planeHeight]} />
      <meshBasicMaterial map={texture} transparent opacity={0.85} />
    </mesh>
  );
}

function GroundPlaneWrapper() {
  return (
    <Suspense fallback={
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-5, -0.05, 5]}>
        <planeGeometry args={[80, 56.7]} />
        <meshBasicMaterial color="#1a2332" />
      </mesh>
    }>
      <GroundPlane />
    </Suspense>
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
      <GroundPlaneWrapper />
      
      {/* Grid */}
      <gridHelper args={[100, 50, 0x1e3a5f, 0x1e3a5f]} position={[0, -0.08, 0]} />
      
      {/* Room outlines */}
      {ROOM_OUTLINES.map(room => (
        <RoomBox
          key={room.systemId}
          room={room}
          isSelected={selectedId === room.systemId}
          onClick={() => handleRoomClick(room.systemId)}
          showLabel={props.showLabels !== false}
          displayLabel={props.roomLabels?.[room.systemId] || undefined}
        />
      ))}
      
      {/* Fire exits */}
      {props.showFireRoutes && FIRE_EXITS.map((exit, i) => (
        <FireExitMarker key={i} exit={exit} />
      ))}
      
      {/* Outdoor areas (south of building) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-25, -0.06, -18]}>
        <planeGeometry args={[30, 10]} />
        <meshStandardMaterial color="#1a3320" transparent opacity={0.3} />
      </mesh>

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        minPolarAngle={0.2}
        maxPolarAngle={Math.PI / 2.2}
        target={[-15, 0, 10]}
      />
    </>
  );
}

class SceneErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { error: Error | null }
> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  render() {
    if (this.state.error) {
      return (
        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0f1a", color: "#ef4444", fontFamily: "monospace", padding: 20 }}>
          <div>
            <h3>3D Scene Error</h3>
            <pre style={{ fontSize: 12, color: "#94a3b8", maxWidth: 500, whiteSpace: "pre-wrap" }}>
              {this.state.error.message}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function GroveHouse3DScene(props: GroveHouse3DSceneProps) {
  return (
    <SceneErrorBoundary>
      <div style={{ width: "100%", height: "100%", minHeight: "500px" }}>
        <Canvas
          camera={{ position: [-15, 45, -30], fov: 50 }}
          style={{ background: "#0a0f1a" }}
          gl={{ antialias: true }}
        >
          <SceneContent {...props} />
        </Canvas>
      </div>
    </SceneErrorBoundary>
  );
}
