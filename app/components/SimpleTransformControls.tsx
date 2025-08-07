"use client";

import { useState, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface SimpleTransformControlsProps {
  selectedObject: any;
  transformMode: "translate" | "rotate" | "scale";
  onTransform: (updates: any) => void;
}

export default function SimpleTransformControls({
  selectedObject,
  transformMode,
  onTransform,
}: SimpleTransformControlsProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<THREE.Vector3 | null>(null);
  const gizmoRef = useRef<THREE.Group>(null);

  if (!selectedObject) return null;

  const handlePointerDown = (e: any) => {
    e.stopPropagation();
    setIsDragging(true);
    setDragStart(e.point.clone());
  };

  const handlePointerMove = (e: any) => {
    if (!isDragging || !dragStart) return;

    const currentPoint = e.point;
    const delta = new THREE.Vector3().subVectors(currentPoint, dragStart);

    switch (transformMode) {
      case "translate":
        onTransform({
          position: [
            selectedObject.position[0] + delta.x,
            selectedObject.position[1] + delta.y,
            selectedObject.position[2] + delta.z,
          ] as [number, number, number],
        });
        break;
      case "scale":
        const scaleFactor = 1 + delta.length() * 0.1;
        onTransform({
          scale: [
            selectedObject.scale[0] * scaleFactor,
            selectedObject.scale[1] * scaleFactor,
            selectedObject.scale[2] * scaleFactor,
          ] as [number, number, number],
        });
        break;
      case "rotate":
        const rotationDelta = delta.x * 0.01;
        onTransform({
          rotation: [
            selectedObject.rotation[0],
            selectedObject.rotation[1] + rotationDelta,
            selectedObject.rotation[2],
          ] as [number, number, number],
        });
        break;
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
    setDragStart(null);
  };

  const getGizmoColor = () => {
    switch (transformMode) {
      case "translate":
        return "#4ade80";
      case "rotate":
        return "#f59e0b";
      case "scale":
        return "#ef4444";
      default:
        return "#6b7280";
    }
  };

  return (
    <group
      ref={gizmoRef}
      position={selectedObject.position}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* X Axis */}
      <mesh position={[1, 0, 0]}>
        <boxGeometry args={[2, 0.1, 0.1]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>

      {/* Y Axis */}
      <mesh position={[0, 1, 0]}>
        <boxGeometry args={[0.1, 2, 0.1]} />
        <meshBasicMaterial color="#00ff00" />
      </mesh>

      {/* Z Axis */}
      <mesh position={[0, 0, 1]}>
        <boxGeometry args={[0.1, 0.1, 2]} />
        <meshBasicMaterial color="#0000ff" />
      </mesh>

      {/* Center sphere */}
      <mesh>
        <sphereGeometry args={[0.2]} />
        <meshBasicMaterial color={getGizmoColor()} />
      </mesh>
    </group>
  );
}
