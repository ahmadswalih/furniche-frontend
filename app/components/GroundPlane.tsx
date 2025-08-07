'use client';

import * as THREE from 'three';

interface GroundPlaneProps {
  activeTool: string;
  onCanvasClick: (point: THREE.Vector3) => void;
}

export default function GroundPlane({ activeTool, onCanvasClick }: GroundPlaneProps) {
  const isDrawingTool = ['cube', 'cylinder', 'sphere', 'plane', 'rectangle', 'circle', 'line'].includes(activeTool);

  const handleClick = (event: any) => {
    if (isDrawingTool) {
      event.stopPropagation();
      const point = event.point as THREE.Vector3;
      onCanvasClick(point);
    }
  };

  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, -0.5, 0]}
      onClick={handleClick}
      visible={false}
    >
      <planeGeometry args={[100, 100]} />
      <meshBasicMaterial transparent opacity={0} />
    </mesh>
  );
}