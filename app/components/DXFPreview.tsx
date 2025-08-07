"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

interface DXFPreviewProps {
  objects: any[];
  active: boolean;
}

export default function DXFPreview({ objects, active }: DXFPreviewProps) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame(({ mouse, camera }) => {
    if (groupRef.current && active) {
      // Create a raycaster
      const raycaster = new THREE.Raycaster();
      raycaster.setFromCamera(mouse, camera);

      // Create a plane at y = 0
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();

      // Find where the ray intersects the ground plane
      if (raycaster.ray.intersectPlane(plane, intersection)) {
        groupRef.current.position.x = intersection.x;
        groupRef.current.position.z = intersection.z;
      }
    }
  });

  if (!active || objects.length === 0) return null;

  return (
    <group ref={groupRef}>
      {objects.map((obj, index) => {
        if (obj.type === "line") {
          const curve = new THREE.CatmullRomCurve3([
            new THREE.Vector3(obj.start[0], obj.start[1], obj.start[2]),
            new THREE.Vector3(obj.end[0], obj.end[1], obj.end[2]),
          ]);
          return (
            <mesh key={`preview-${obj.id}`}>
              <tubeGeometry args={[curve, 2, 0.02, 8, false]} />
              <meshBasicMaterial color="#60a5fa" opacity={0.5} transparent />
            </mesh>
          );
        } else if (obj.type === "cylinder") {
          return (
            <mesh
              key={`preview-${obj.id}`}
              position={obj.position}
              rotation={obj.rotation}
              scale={obj.scale}
            >
              <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
              <meshBasicMaterial color="#60a5fa" opacity={0.5} transparent />
            </mesh>
          );
        } else if (obj.type === "extruded" && obj.points) {
          const shape = new THREE.Shape(obj.points);
          return (
            <mesh key={`preview-${obj.id}`} position={[0, obj.depth / 2, 0]}>
              <extrudeGeometry
                args={[shape, { depth: obj.depth, bevelEnabled: false }]}
              />
              <meshBasicMaterial color="#60a5fa" opacity={0.5} transparent />
            </mesh>
          );
        }
        return null;
      })}
    </group>
  );
}
