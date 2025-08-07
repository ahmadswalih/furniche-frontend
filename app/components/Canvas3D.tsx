"use client";

import { Canvas } from "@react-three/fiber";
import {
  OrbitControls,
  Grid,
  GizmoHelper,
  GizmoViewport,
} from "@react-three/drei";
import { Suspense, ReactNode } from "react";

function Scene({
  children,
  activeTool,
}: {
  children?: ReactNode;
  activeTool?: string;
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
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} />
      <directionalLight position={[5, 5, 5]} intensity={1} />

      <Grid
        args={[20, 20]}
        position={[0, -0.01, 0]}
        cellSize={1}
        cellThickness={0.5}
        cellColor="#6f6f6f"
        sectionSize={5}
        sectionThickness={1}
        sectionColor="#9d4b4b"
        fadeDistance={25}
        fadeStrength={1}
        followCamera={false}
        infiniteGrid={true}
      />

      {children}

      <OrbitControls
        enablePan={!isInteractiveTool}
        enableZoom={!isInteractiveTool}
        enableRotate={!isInteractiveTool}
        minDistance={2}
        maxDistance={100}
        target={[0, 0, 0]}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2}
      />

      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport
          axisColors={["red", "green", "blue"]}
          labelColor="black"
        />
      </GizmoHelper>
    </>
  );
}

interface Canvas3DProps {
  children?: ReactNode;
  activeTool?: string;
}

export default function Canvas3D({ children, activeTool }: Canvas3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [10, 10, 10], fov: 50 }}
        gl={{ antialias: true }}
        shadows
      >
        <Suspense fallback={null}>
          <Scene activeTool={activeTool}>{children}</Scene>
        </Suspense>
      </Canvas>
    </div>
  );
}
