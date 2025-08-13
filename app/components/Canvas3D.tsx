"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  GizmoHelper,
  GizmoViewport,
  Environment,
} from "@react-three/drei";
import { Suspense, ReactNode, useState, useEffect, useRef } from "react";
import * as THREE from "three";
import { useRectangleDrawing } from "../hooks/useRectangleDrawing";

// Component that uses the rectangle drawing hook (must be inside Canvas)
function RectangleDrawingHandler({
  activeTool,
  onRectangleCreate,
  onMeasurementUpdate,
  selectedLayerId,
  onEventHandlersReady,
}: {
  activeTool: string;
  onRectangleCreate?: (rectangle: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
  selectedLayerId?: string;
  onEventHandlersReady?: (handlers: {
    handleClick: any;
    handleMouseMove: any;
  }) => void;
}) {
  const rectangleDrawing = useRectangleDrawing({
    activeTool: activeTool || "",
    onRectangleCreate: onRectangleCreate || (() => {}),
    onMeasurementUpdate: onMeasurementUpdate || (() => {}),
    selectedLayerId: selectedLayerId || undefined,
  });

  // Expose event handlers to parent component
  useEffect(() => {
    if (onEventHandlersReady && rectangleDrawing) {
      onEventHandlersReady({
        handleClick: rectangleDrawing.handleClick,
        handleMouseMove: rectangleDrawing.handleMouseMove,
      });
    }
  }, [onEventHandlersReady, rectangleDrawing]);

  return (
    <>
      {/* Rectangle Drawing Handler */}
      <RectangleDrawingHandler
        activeTool={activeTool || ""}
        onRectangleCreate={onRectangleCreate}
        onMeasurementUpdate={onMeasurementUpdate}
        selectedLayerId={selectedLayerId}
        onEventHandlersReady={setRectangleEventHandlers}
      />
    </>
  );
}

// SketchUp-style Ground Plane Component
function SketchUpGroundPlane() {
  return (
    <group>
      {/* Main ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[1000, 1000]} />
        <meshStandardMaterial
          color="#f0f0f0"
          transparent
          opacity={0.15}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Grid lines for better orientation */}
      <group position={[0, 0.001, 0]}>
        {/* Horizontal grid lines */}
        {Array.from({ length: 21 }, (_, i) => (
          <mesh key={`h-${i}`} position={[0, 0, (i - 10) * 10]}>
            <boxGeometry args={[100, 0.01, 0.02]} />
            <meshBasicMaterial color="#e0e0e0" transparent opacity={0.9} />
          </mesh>
        ))}

        {/* Vertical grid lines */}
        {Array.from({ length: 21 }, (_, i) => (
          <mesh key={`v-${i}`} position={[(i - 10) * 10, 0, 0]}>
            <boxGeometry args={[0.02, 0.01, 100]} />
            <meshBasicMaterial color="#e0e0e0" transparent opacity={0.9} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

// SketchUp-style horizon and reference lines - TRULY UNLIMITED
function SketchUpReference() {
  const axisLength = 100000; // Massive length for unlimited feel

  return (
    <group>
      {/* X-axis (Red) - Truly unlimited line segments */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={
              new Float32Array([-axisLength, 0.001, 0, axisLength, 0.001, 0])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#ff0000"
          linewidth={4}
          transparent
          opacity={0.6}
          depthTest={false}
          depthWrite={false}
        />
      </lineSegments>

      {/* Z-axis (Blue) - Truly unlimited line segments */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={
              new Float32Array([0, 0.001, -axisLength, 0, 0.001, axisLength])
            }
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#0066ff"
          linewidth={4}
          transparent
          opacity={0.6}
          depthTest={false}
          depthWrite={false}
        />
      </lineSegments>

      {/* Y-axis (Green) - Truly unlimited line segments */}
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={2}
            array={new Float32Array([0, -axisLength, 0, 0, axisLength, 0])}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial
          color="#00cc00"
          linewidth={4}
          transparent
          opacity={0.6}
          depthTest={false}
          depthWrite={false}
        />
      </lineSegments>

      {/* Thick mesh axes for better visibility - TRULY UNLIMITED */}
      <mesh position={[0, 0.001, 0]}>
        <boxGeometry args={[axisLength * 2, 0.05, 0.15]} />
        <meshBasicMaterial
          color="#ff0000"
          transparent
          opacity={0.7}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0.001, 0]}>
        <boxGeometry args={[0.15, 0.05, axisLength * 2]} />
        <meshBasicMaterial
          color="#0066ff"
          transparent
          opacity={0.7}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.15, axisLength * 2, 0.15]} />
        <meshBasicMaterial
          color="#00cc00"
          transparent
          opacity={0.7}
          depthTest={false}
          depthWrite={false}
        />
      </mesh>

      {/* Center point marker - small and subtle */}
      <mesh position={[0, 0.001, 0]}>
        <sphereGeometry args={[0.06]} />
        <meshBasicMaterial color="#666666" transparent opacity={0.6} />
      </mesh>

      {/* Axis markers at regular intervals - subtle */}
      {/* X-axis markers every 100 units */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={`x-marker-${i}`} position={[(i - 5) * 100, 0.002, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ff0000" transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Z-axis markers every 100 units */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={`z-marker-${i}`} position={[0, 0.002, (i - 5) * 100]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#0066ff" transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Y-axis markers every 100 units */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={`y-marker-${i}`} position={[0, (i - 5) * 100, 0]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#00cc00" transparent />
        </mesh>
      ))}
    </group>
  );
}

function Scene({
  children,
  activeTool,
  onRectangleCreate,
  onMeasurementUpdate,
  selectedLayerId,
  onBackgroundClick,
}: {
  children?: ReactNode;
  activeTool?: string;
  onRectangleCreate?: (rectangle: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
  selectedLayerId?: string;
  onBackgroundClick?: () => void;
}) {
  const isDrawingTool =
    activeTool &&
    [
      "cube",
      "cylinder",
      "sphere",
      "plane",
      "rectangle",
      "circle",
      "line",
    ].includes(activeTool);

  const isInteractiveTool =
    activeTool && ["line", "rectangle", "circle"].includes(activeTool);

  return (
    <>
      {/* SketchUp-style lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 50, 50]}
        intensity={0.8}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={200}
        shadow-camera-left={-50}
        shadow-camera-right={50}
        shadow-camera-top={50}
        shadow-camera-bottom={-50}
      />
      <hemisphereLight
        skyColor="#b1e1ff"
        groundColor="#B97A20"
        intensity={0.3}
      />

      {/* Clean background - no dome */}

      {/* SketchUp-style ground plane and references */}
      <SketchUpGroundPlane />
      <SketchUpReference />

      {/* Invisible background plane for deselection clicks */}
      {onBackgroundClick && (
        <mesh
          position={[0, -0.1, 0]}
          rotation={[-Math.PI / 2, 0, 0]}
          onClick={(e) => {
            // Only deselect if we're not drawing rectangles
            if (activeTool !== "rectangle") {
              console.log('🎯 Background plane clicked - deselecting');
              onBackgroundClick();
            }
          }}
          visible={false}
        >
          <planeGeometry args={[10000, 10000]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      )}

      {children}

      <OrbitControls
        enablePan={!isInteractiveTool}
        enableZoom={true}
        enableRotate={!isInteractiveTool}
        minDistance={0.0001}
        maxDistance={100000}
        target={[0, 0, 0]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
        zoomToCursor={true}
        zoomSpeed={3.0}
        panSpeed={3.0}
        rotateSpeed={1.2}
        dampingFactor={0.05}
        enableDamping={true}
        enableKeys={true}
        keyPanSpeed={30}
        enableKeyPan={true}
        screenSpacePanning={true}
        mouseButtons={{
          LEFT: THREE.MOUSE.ROTATE,
          MIDDLE: THREE.MOUSE.PAN,
          RIGHT: THREE.MOUSE.PAN,
        }}
        touches={{
          ONE: THREE.TOUCH.ROTATE,
          TWO: THREE.TOUCH.DOLLY_PAN,
        }}
        onStart={() => console.log("🎮 Camera controls started")}
        onChange={() => console.log("🎮 Camera controls changed")}
        onPanStart={() => {
          console.log("🚀 Pan started");
          setIsPanning(true);
        }}
        onPanEnd={() => {
          console.log("🚀 Pan ended");
          setIsPanning(false);
        }}
        onPan={(event) => {
          // Enhanced pan handling with bounds checking
          const camera = event.target.object;
          const target = event.target.target;

          // Log pan movement for debugging
          console.log("🚀 Panning:", {
            cameraPosition: camera.position,
            target: target,
            delta: event.delta,
          });

          // Optional: Add pan bounds to prevent going too far
          const maxPanDistance = 100;
          const distance = Math.sqrt(
            Math.pow(target.x, 2) +
              Math.pow(target.y, 2) +
              Math.pow(target.z, 2)
          );

          if (distance > maxPanDistance) {
            console.log("🚀 Pan limit reached, constraining movement");
          }
        }}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["#ff0000", "#00cc00", "#0066ff"]}
          labelColor="black"
          hideNegativeAxes={false}
        />
      </GizmoHelper>
    </>
  );
}

interface Canvas3DProps {
  children?: ReactNode;
  activeTool?: string;
  onRectangleCreate?: (rectangle: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
  selectedLayerId?: string;
  onBackgroundClick?: () => void;
}

export default function Canvas3D({
  children,
  activeTool,
  onRectangleCreate,
  onMeasurementUpdate,
  selectedLayerId,
  onBackgroundClick,
}: Canvas3DProps) {
  const [showInstructions, setShowInstructions] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [rectangleEventHandlers, setRectangleEventHandlers] = useState<{
    handleClick: any;
    handleMouseMove: any;
  } | null>(null);

  // Hide instructions after 8 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowInstructions(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="w-full h-full bg-gradient-to-b from-gray-200 to-gray-300 relative">
      {/* Control Instructions Overlay */}
      {showInstructions && (
        <div className="absolute top-4 left-4 bg-black/70 text-white p-3 rounded-lg text-xs z-10 max-w-xs transition-opacity duration-500">
          <div className="font-semibold mb-2">🎮 Camera Controls:</div>
          <div className="space-y-1 text-xs">
            <div>
              🖱️ <strong>Left Click + Drag:</strong> Rotate view
            </div>
            <div>
              🖱️ <strong>Middle Click + Drag:</strong> Pan view
            </div>
            <div>
              🖱️ <strong>Right Click + Drag:</strong> Pan view
            </div>
            <div>
              🖱️ <strong>Scroll Wheel:</strong> Unlimited zoom to cursor
            </div>
            <div>
              ⌨️ <strong>Arrow Keys:</strong> Pan view
            </div>
          </div>
          <button
            onClick={() => setShowInstructions(false)}
            className="absolute top-2 right-2 text-white/70 hover:text-white text-lg"
            title="Close instructions"
          >
            ×
          </button>
        </div>
      )}

      {/* Pan Status Indicator */}
      {isPanning && (
        <div className="absolute top-4 right-4 bg-blue-500 text-white px-3 py-2 rounded-lg text-sm font-medium z-10 animate-pulse">
          🚀 Panning Active
        </div>
      )}

      {/* Rectangle Tool Instructions */}
      {activeTool === "rectangle" && (
        <div className="absolute top-4 right-4 bg-blue-600 text-white p-3 rounded-lg text-xs z-10 max-w-xs">
          <div className="font-semibold mb-2">🔷 Rectangle Tool:</div>
          <div className="space-y-1 text-xs">
            <div>
              🖱️ <strong>Click:</strong> Set start point
            </div>
            <div>
              🖱️ <strong>Click again:</strong> Set end point
            </div>
            <div>
              🖱️ <strong>Drag:</strong> Preview rectangle
            </div>
            <div>
              ⌨️ <strong>Escape:</strong> Cancel drawing
            </div>
            <div>
              🎯 <strong>Snap:</strong> Auto-snap to DXF points
            </div>
          </div>
          <div className="mt-2 text-xs opacity-90">
            <strong>Tip:</strong> Draw on top of DXF files for precise
            alignment!
          </div>
        </div>
      )}

      <Canvas
        camera={{
          position: [20, 20, 20],
          fov: 50,
          near: 0.00001,
          far: 1000000,
        }}
        gl={{
          antialias: true,
          alpha: false,
          preserveDrawingBuffer: true,
        }}
        shadows={{
          enabled: true,
          type: THREE.PCFSoftShadowMap,
        }}
        onCreated={({ gl }) => {
          gl.setClearColor("#e6e6e6");
        }}
        onClick={
          activeTool === "rectangle" && rectangleEventHandlers
            ? rectangleEventHandlers.handleClick
            : undefined
        }
        onPointerMove={
          activeTool === "rectangle" && rectangleEventHandlers
            ? rectangleEventHandlers.handleMouseMove
            : undefined
        }
      >
        <Suspense fallback={null}>
          <Scene
            activeTool={activeTool}
            onRectangleCreate={onRectangleCreate}
            onMeasurementUpdate={onMeasurementUpdate}
            selectedLayerId={selectedLayerId}
            onBackgroundClick={onBackgroundClick}
          >
            {children}
          </Scene>
        </Suspense>
      </Canvas>
    </div>
  );
}
