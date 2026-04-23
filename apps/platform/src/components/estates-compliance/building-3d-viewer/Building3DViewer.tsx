"use client";

import React, { useState, useRef, useMemo, Suspense, useCallback, useEffect } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Text,
  PerspectiveCamera,
  Environment,
  ContactShadows,
  Float,
  Sparkles,
  MeshReflectorMaterial,
  Loader,
  Stage,
  useCursor,
  Edges,
} from "@react-three/drei";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Layers,
  Maximize,
  RotateCw,
  Flame,
  Package,
  AlertTriangle,
  Zap,
  Users,
  DoorOpen,
  X,
  ChevronLeft,
  ChevronRight,
  Play,
  Pause,
  Navigation,
} from "lucide-react";
import * as THREE from "three";

// ─── Types ─────────────────────────────────────────────────────────────────

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
  level: number; // -1 = basement, 0 = ground, 1 = first, etc.
  height: number; // Floor-to-floor height in meters
  rooms: Room3D[];
}

export interface Room3D {
  id: string;
  name: string;
  type: RoomType3D;
  position: [number, number, number]; // relative to floor
  size: [number, number, number]; // width, depth, height
  color: string;
  hasFireExit?: boolean;
  nearestExitId?: string;
  // Runtime data (populated from API)
  assets?: AssetOverlay[];
  issues?: number;
  temperature?: number;
  evacuationRoute?: EvacuationRoute3D;
}

export type RoomType3D =
  | "classroom"
  | "hall"
  | "office"
  | "staffroom"
  | "library"
  | "send_room"
  | "kitchen"
  | "dining"
  | "toilet"
  | "storage"
  | "boiler"
  | "medical"
  | "reception"
  | "head_office"
  | "meeting"
  | "ict_suite"
  | "cloakroom"
  | "corridor"
  | "entrance"
  | "external";

export interface AssetOverlay {
  id: string;
  type: "fire_extinguisher" | "fire_alarm" | "first_aid_kit" | "boiler" | "electrical_panel" | "defibrillator";
  position: [number, number, number]; // relative to room
  status: "ok" | "expired" | "warning";
  label?: string;
}

export interface EvacuationRoute3D {
  fromRoomId: string;
  exitId: string;
  musterPointId: string;
  path: [number, number, number][]; // 3D waypoints
  distanceMetres: number;
}

export type ViewMode = "orbit" | "walkthrough" | "floor_plan";
export type OverlayMode = "none" | "fire" | "assets" | "issues" | "evacuation";

// ─── Room Mesh Component ────────────────────────────────────────────────────

interface RoomMeshProps {
  room: Room3D;
  floorLevel: number;
  isSelected: boolean;
  isHovered: boolean;
  overlayMode: OverlayMode;
  evacuationProgress?: number;
  onClick: (room: Room3D) => void;
  onHover: (room: Room3D | null) => void;
}

function RoomMesh({
  room,
  floorLevel,
  isSelected,
  isHovered,
  overlayMode,
  evacuationProgress = 0,
  onClick,
  onHover,
}: RoomMeshProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, set] = useState(false);

  // Calculate absolute position (floor level + room position)
  const yPos = floorLevel * 3.5 + room.position[1] + room.size[1] / 2;

  // Determine color based on overlay mode
  const getRoomColor = () => {
    if (overlayMode === "fire" && room.hasFireExit) return "#ef4444"; // red
    if (overlayMode === "issues" && (room.issues || 0) > 2) return "#f97316"; // orange
    if (overlayMode === "evacuation" && isSelected) return "#22c55e"; // green
    if (isSelected) return "#3b82f6"; // blue
    if (hovered || isHovered) return "#60a5fa"; // light blue
    return room.color;
  };

  const scale = hovered || isHovered ? 1.02 : 1;

  useFrame((state) => {
    if (meshRef.current && (hovered || isHovered)) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        yPos + 0.1,
        0.1
      );
    } else if (meshRef.current) {
      meshRef.current.position.y = THREE.MathUtils.lerp(
        meshRef.current.position.y,
        yPos,
        0.1
      );
    }
  });

  return (
    <group position={[room.position[0], 0, room.position[2]]}>
      {/* Room box */}
      <mesh
        ref={meshRef}
        position={[0, yPos, 0]}
        scale={scale}
        onClick={(e) => {
          e.stopPropagation();
          onClick(room);
        }}
        onPointerOver={(e) => {
          e.stopPropagation();
          set(true);
          onHover(room);
        }}
        onPointerOut={() => {
          set(false);
          onHover(null);
        }}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[room.size[0], room.size[1], room.size[2]]} />
        <meshStandardMaterial
          color={getRoomColor()}
          roughness={0.7}
          metalness={0.1}
          transparent
          opacity={overlayMode === "evacuation" && !isSelected ? 0.3 : 0.9}
        />
      </mesh>

      {/* Room edges for definition */}
      <lineSegments>
        <Edges
          geometry={new THREE.BoxGeometry(
            room.size[0],
            room.size[1],
            room.size[2]
          )}
        />
        <lineBasicMaterial color="#000000" opacity={0.2} transparent />
      </lineSegments>

      {/* Room label */}
      <Text
        position={[0, yPos + room.size[1] / 2 + 0.3, 0]}
        fontSize={0.3}
        color="#1e293b"
        anchorX="center"
        anchorY="middle"
      >
        {room.name}
      </Text>

      {/* Asset overlays */}
      {(overlayMode === "assets" || overlayMode === "fire") &&
        room.assets?.map((asset) => (
          <AssetMarker
            key={asset.id}
            asset={asset}
            room={room}
            yPos={yPos}
          />
        ))}

      {/* Evacuation path indicators */}
      {overlayMode === "evacuation" && isSelected && room.evacuationRoute && (
        <EvacuationPath
          route={room.evacuationRoute}
          progress={evacuationProgress}
          room={room}
          yPos={yPos}
        />
      )}

      {/* Fire exit indicator */}
      {overlayMode === "fire" && room.hasFireExit && (
        <FireExitMarker position={[0, yPos + 0.5, room.size[2] / 2]} />
      )}
    </group>
  );
}

// ─── Asset Marker Component ──────────────────────────────────────────────────

interface AssetMarkerProps {
  asset: AssetOverlay;
  room: Room3D;
  yPos: number;
}

function AssetMarker({ asset, room, yPos }: AssetMarkerProps) {
  const [hovered, set] = useState(false);

  const getIconColor = () => {
    switch (asset.type) {
      case "fire_extinguisher":
      case "fire_alarm":
        return "#ef4444";
      case "first_aid_kit":
      case "defibrillator":
        return "#22c55e";
      case "boiler":
        return "#f59e0b";
      case "electrical_panel":
        return "#eab308";
      default:
        return "#6b7280";
    }
  };

  const getStatusRing = () => {
    switch (asset.status) {
      case "expired":
        return "#ef4444";
      case "warning":
        return "#f59e0b";
      default:
        return "#22c55e";
    }
  };

  return (
    <group
      position={[
        asset.position[0],
        yPos - room.size[1] / 2 + asset.position[1],
        asset.position[2],
      ]}
      onPointerOver={() => set(true)}
      onPointerOut={() => set(false)}
    >
      {/* Glow effect when hovered */}
      {hovered && (
        <pointLight color={getIconColor()} intensity={2} distance={3} />
      )}

      {/* Status ring */}
      <mesh position={[0, 0.2, 0]}>
        <torusGeometry args={[0.15, 0.03, 8, 16]} />
        <meshBasicMaterial color={getStatusRing()} />
      </mesh>

      {/* Asset icon representation */}
      <mesh position={[0, 0.2, 0]}>
        {asset.type === "fire_extinguisher" ? (
          <>
            <cylinderGeometry args={[0.08, 0.1, 0.2, 8]} />
            <meshStandardMaterial color="#dc2626" />
          </>
        ) : asset.type === "boiler" ? (
          <>
            <boxGeometry args={[0.15, 0.15, 0.15]} />
            <meshStandardMaterial color="#f59e0b" />
          </>
        ) : (
          <>
            <sphereGeometry args={[0.1, 8, 8]} />
            <meshStandardMaterial color={getIconColor()} />
          </>
        )}
      </mesh>

      {/* Label on hover */}
      {hovered && asset.label && (
        <Text
          position={[0, 0.5, 0]}
          fontSize={0.15}
          color="#1e293b"
          anchorX="center"
        >
          {asset.label}
        </Text>
      )}
    </group>
  );
}

// ─── Fire Exit Marker ───────────────────────────────────────────────────────

interface FireExitMarkerProps {
  position: [number, number, number];
}

function FireExitMarker({ position }: FireExitMarkerProps) {
  return (
    <group position={position}>
      {/* Glowing green sign */}
      <mesh>
        <boxGeometry args={[0.3, 0.15, 0.02]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.5} />
      </mesh>
      {/* Running figure */}
      <mesh position={[0, 0, 0.02]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color="#ffffff" />
      </mesh>
    </group>
  );
}

// ─── Evacuation Path Component ───────────────────────────────────────────────

interface EvacuationPathProps {
  route: EvacuationRoute3D;
  progress: number;
  room: Room3D;
  yPos: number;
}

function EvacuationPath({ route, progress, room, yPos }: EvacuationPathProps) {
  const points = useMemo(() => {
    // Start from room center
    const start: [number, number, number] = [
      room.size[0] / 2,
      yPos,
      room.size[2] / 2,
    ];

    // Add waypoints from route
    const allPoints = [start, ...route.path];

    return new THREE.CatmullRomCurve3(
      allPoints.map((p) => new THREE.Vector3(p[0], p[1], p[2]))
    );
  }, [route, room, yPos]);

  // Animated particle following the path
  const tubeRef = useRef<THREE.Mesh>(null);

  useFrame(() => {
    if (tubeRef.current) {
      const point = points.getPoint(Math.min(progress, 1));
      tubeRef.current.position.set(point.x, point.y, point.z);
    }
  });

  return (
    <group>
      {/* Path line */}
      <mesh>
        <tubeGeometry args={[points, 32, 0.05, 8, false]} />
        <meshStandardMaterial color="#22c55e" emissive="#22c55e" emissiveIntensity={0.3} />
      </mesh>

      {/* Animated indicator */}
      <mesh ref={tubeRef}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshStandardMaterial
          color="#22c55e"
          emissive="#22c55e"
          emissiveIntensity={1}
        />
      </mesh>

      {/* Destination marker */}
      {route.path.length > 0 && (
        <mesh
          position={[
            route.path[route.path.length - 1][0],
            route.path[route.path.length - 1][1],
            route.path[route.path.length - 1][2],
          ]}
        >
          <coneGeometry args={[0.15, 0.3, 4]} />
          <meshStandardMaterial color="#22c55e" />
        </mesh>
      )}
    </group>
  );
}

// ─── Building Component ──────────────────────────────────────────────────────

interface Building3DProps {
  building: Building3D;
  selectedRoom: Room3D | null;
  hoveredRoom: Room3D | null;
  overlayMode: OverlayMode;
  evacuationProgress: number;
  onRoomClick: (room: Room3D) => void;
  onRoomHover: (room: Room3D | null) => void;
}

function Building3DComponent({
  building,
  selectedRoom,
  hoveredRoom,
  overlayMode,
  evacuationProgress,
  onRoomClick,
  onRoomHover,
}: Building3DProps) {
  const groupRef = useRef<THREE.Group>(null);

  // Subtle building entrance animation
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.position.y = THREE.MathUtils.lerp(
        groupRef.current.position.y,
        0,
        0.05
      );
    }
  });

  return (
    <group ref={groupRef} position={building.position}>
      {building.floors.map((floor) => (
        <group key={floor.id} position={[0, floor.level * 3.5, 0]}>
          {floor.rooms.map((room) => (
            <RoomMesh
              key={room.id}
              room={room}
              floorLevel={floor.level}
              isSelected={selectedRoom?.id === room.id}
              isHovered={hoveredRoom?.id === room.id}
              overlayMode={overlayMode}
              evacuationProgress={evacuationProgress}
              onClick={onRoomClick}
              onHover={onRoomHover}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

// ─── Main Scene ─────────────────────────────────────────────────────────────

interface SceneProps {
  data: Building3DData;
  selectedRoom: Room3D | null;
  hoveredRoom: Room3D | null;
  overlayMode: OverlayMode;
  evacuationProgress: number;
  onRoomClick: (room: Room3D) => void;
  onRoomHover: (room: Room3D | null) => void;
  viewMode: ViewMode;
}

function Scene({
  data,
  selectedRoom,
  hoveredRoom,
  overlayMode,
  evacuationProgress,
  onRoomClick,
  onRoomHover,
  viewMode,
}: SceneProps) {
  const { camera } = useThree();

  // Animate camera based on selected room
  useFrame(() => {
    if (selectedRoom && viewMode === "walkthrough") {
      // Smooth camera transition to room
      const targetPosition = new THREE.Vector3(
        selectedRoom.position[0] + 8,
        6,
        selectedRoom.position[2] + 8
      );
      camera.position.lerp(targetPosition, 0.02);
    }
  });

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[10, 10, 5]}
        intensity={1}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <pointLight position={[-10, 10, -10]} intensity={0.5} />

      {/* Ground plane with reflections */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry
          args={[
            data.groundPlane?.width || 100,
            data.groundPlane?.depth || 100,
          ]}
        />
        <MeshReflectorMaterial
          blur={[300, 100]}
          resolution={2048}
          mixBlur={0.5}
          mixStrength={0.8}
          roughness={1}
          depthScale={1}
          minDepthThreshold={0.6}
          maxDepthThreshold={1.2}
          color="#94a3b8"
          metalness={0.1}
        />
      </mesh>

      {/* Contact shadows */}
      <ContactShadows
        position={[0, -0.05, 0]}
        opacity={0.4}
        scale={[100, 100]}
        blur={2}
        far={20}
      />

      {/* Buildings */}
      {data.buildings.map((building) => (
        <Building3DComponent
          key={building.id}
          building={building}
          selectedRoom={selectedRoom}
          hoveredRoom={hoveredRoom}
          overlayMode={overlayMode}
          evacuationProgress={evacuationProgress}
          onRoomClick={onRoomClick}
          onRoomHover={onRoomHover}
        />
      ))}

      {/* Sparkles for magic effect */}
      <Sparkles
        count={100}
        scale={[30, 20, 30]}
        size={4}
        speed={0.4}
        opacity={0.5}
        color="#60a5fa"
      />

      {/* Environment */}
      <Environment preset="city" />
    </>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface Building3DViewerProps {
  data: Building3DData;
  className?: string;
  onRoomSelect?: (room: Room3D | null) => void;
}

// ─── Main Component ─────────────────────────────────────────────────────────

export default function Building3DViewer({
  data,
  className = "",
  onRoomSelect,
}: Building3DViewerProps) {
  const [selectedRoom, setSelectedRoom] = useState<Room3D | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<Room3D | null>(null);
  const [overlayMode, setOverlayMode] = useState<OverlayMode>("none");
  const [viewMode, setViewMode] = useState<ViewMode>("orbit");
  const [evacuationProgress, setEvacuationProgress] = useState(0);
  const [evacuationPlaying, setEvacuationPlaying] = useState(false);

  // Handle room click
  const handleRoomClick = useCallback((room: Room3D) => {
    if (selectedRoom?.id === room.id) {
      // Double-click to zoom in (switch to walkthrough)
      setViewMode("walkthrough");
    }
    setSelectedRoom(room);
    onRoomSelect?.(room);
  }, [selectedRoom, onRoomSelect]);

  // Handle room hover
  const handleRoomHover = useCallback((room: Room3D | null) => {
    setHoveredRoom(room);
  }, []);

  // Evacuation animation using useEffect (can't use useFrame outside Canvas)
  useEffect(() => {
    if (!evacuationPlaying && evacuationProgress === 0) return;

    let animationFrame: number;
    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = currentTime - lastTime;

      if (evacuationPlaying && evacuationProgress < 1) {
        setEvacuationProgress((p) => Math.min(p + 0.005, 1));
      } else if (!evacuationPlaying && evacuationProgress > 0) {
        setEvacuationProgress((p) => Math.max(p - 0.01, 0));
      }

      // Continue animation if needed
      if ((evacuationPlaying && evacuationProgress < 1) || (!evacuationPlaying && evacuationProgress > 0)) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [evacuationPlaying, evacuationProgress]);

  const toggleEvacuation = () => {
    if (evacuationProgress >= 1) {
      setEvacuationProgress(0);
    }
    setEvacuationPlaying(!evacuationPlaying);
    if (overlayMode !== "evacuation") {
      setOverlayMode("evacuation");
    }
  };

  // Reset view
  const resetView = () => {
    setSelectedRoom(null);
    setViewMode("orbit");
    setOverlayMode("none");
    setEvacuationProgress(0);
    setEvacuationPlaying(false);
    onRoomSelect?.(null);
  };

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* 3D Canvas */}
      <Canvas
        shadows
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
        className="w-full h-full"
      >
        <PerspectiveCamera makeDefault position={[20, 15, 20]} fov={50} />

        <Suspense fallback={null}>
          <Scene
            data={data}
            selectedRoom={selectedRoom}
            hoveredRoom={hoveredRoom}
            overlayMode={overlayMode}
            evacuationProgress={evacuationProgress}
            onRoomClick={handleRoomClick}
            onRoomHover={handleRoomHover}
            viewMode={viewMode}
          />
        </Suspense>

        <OrbitControls
          makeDefault
          enablePan={true}
          enableZoom={true}
          enableRotate={viewMode === "orbit"}
          minDistance={5}
          maxDistance={50}
          maxPolarAngle={Math.PI / 2}
          minPolarAngle={0}
        />

        <Stage environment="city" intensity={0.5}>
          <ambientLight intensity={0.5} />
        </Stage>
      </Canvas>

      {/* Controls Overlay */}
      <div className="absolute top-4 left-4 flex flex-col gap-2">
        {/* View Mode Toggle */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setViewMode(viewMode === "orbit" ? "walkthrough" : "orbit")}
              className={`p-2 rounded-lg transition-all ${
                viewMode === "walkthrough"
                  ? "bg-blue-500 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              title={viewMode === "orbit" ? "Enter Walkthrough Mode" : "Exit Walkthrough Mode"}
            >
              <DoorOpen className="w-4 h-4" />
            </button>
            <button
              onClick={resetView}
              className="p-2 rounded-lg hover:bg-slate-100 text-slate-700 transition-all"
              title="Reset View"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Overlay Modes */}
        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-2">
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setOverlayMode(overlayMode === "fire" ? "none" : "fire")}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                overlayMode === "fire"
                  ? "bg-red-500 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Fire Safety Overlay"
            >
              <Flame className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOverlayMode(overlayMode === "assets" ? "none" : "assets")}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                overlayMode === "assets"
                  ? "bg-green-500 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Assets Overlay"
            >
              <Package className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOverlayMode(overlayMode === "issues" ? "none" : "issues")}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                overlayMode === "issues"
                  ? "bg-orange-500 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Issues Overlay"
            >
              <AlertTriangle className="w-4 h-4" />
            </button>
            <button
              onClick={toggleEvacuation}
              className={`p-2 rounded-lg transition-all flex items-center gap-2 ${
                overlayMode === "evacuation"
                  ? "bg-emerald-500 text-white"
                  : "hover:bg-slate-100 text-slate-700"
              }`}
              title="Evacuation Routes"
            >
              <Navigation className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Info Panel */}
      {(selectedRoom || hoveredRoom) && (
        <div className="absolute bottom-4 left-4 right-4 sm:right-auto sm:w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="font-semibold text-slate-900">
                {(selectedRoom || hoveredRoom)!.name}
              </h3>
              <p className="text-xs text-slate-500 capitalize">
                {(selectedRoom || hoveredRoom)!.type.replace(/_/g, " ")}
              </p>
            </div>
            {selectedRoom && (
              <button
                onClick={() => {
                  setSelectedRoom(null);
                  onRoomSelect?.(null);
                }}
                className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <X className="w-4 h-4 text-slate-400" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2 text-sm">
            {(selectedRoom || hoveredRoom)!.hasFireExit && (
              <div className="flex items-center gap-2 text-red-600 bg-red-50 px-2 py-1 rounded-lg">
                <Flame className="w-3.5 h-3.5" />
                <span>Fire Exit</span>
              </div>
            )}
            {(selectedRoom || hoveredRoom)!.assets && (selectedRoom || hoveredRoom)!.assets!.length > 0 && (
              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                <Package className="w-3.5 h-3.5" />
                <span>{(selectedRoom || hoveredRoom)!.assets!.length} Assets</span>
              </div>
            )}
            {(selectedRoom || hoveredRoom)!.issues && (selectedRoom || hoveredRoom)!.issues! > 0 && (
              <div className="flex items-center gap-2 text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>{(selectedRoom || hoveredRoom)!.issues} Issues</span>
              </div>
            )}
          </div>

          {selectedRoom && (
            <button
              onClick={() => {
                // Trigger room detail view
                setViewMode("walkthrough");
              }}
              className="w-full mt-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium flex items-center justify-center gap-2"
            >
              <Maximize className="w-4 h-4" />
              Enter Room
            </button>
          )}
        </div>
      )}

      {/* Evacuation Progress Bar */}
      {overlayMode === "evacuation" && evacuationProgress > 0 && (
        <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-slate-200 p-3 w-64">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-700">Evacuation Route</span>
            <button
              onClick={toggleEvacuation}
              className="p-1 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {evacuationPlaying ? (
                <Pause className="w-4 h-4 text-slate-600" />
              ) : (
                <Play className="w-4 h-4 text-slate-600" />
              )}
            </button>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-400 transition-all duration-300"
              style={{ width: `${evacuationProgress * 100}%` }}
            />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {selectedRoom?.evacuationRoute
              ? `${selectedRoom.evacuationRoute.distanceMetres}m to exit`
              : "Select a room to see route"}
          </p>
        </div>
      )}

      {/* Instructions */}
      <div className="absolute bottom-4 right-4 bg-white/80 backdrop-blur-sm rounded-lg px-3 py-2 text-xs text-slate-600 hidden sm:block">
        <div className="flex items-center gap-2">
          <RotateCw className="w-3.5 h-3.5" />
          <span>Drag to rotate • Scroll to zoom • Click rooms to select</span>
        </div>
      </div>

      <Loader />
    </div>
  );
}

// ─── Export Types ───────────────────────────────────────────────────────────

export type {
  Building3DData,
  Building3D,
  Floor3D,
  Room3D,
  RoomType3D,
  AssetOverlay,
  EvacuationRoute3D,
  ViewMode,
  OverlayMode,
};
