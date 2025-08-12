"use client";

import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Text } from "@react-three/drei";
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
        const previewColor = "#60a5fa";
        const opacity = 0.7;

        switch (obj.type) {
          case "line":
            const curve = new THREE.CatmullRomCurve3([
              new THREE.Vector3(obj.start[0], obj.start[1], obj.start[2]),
              new THREE.Vector3(obj.end[0], obj.end[1], obj.end[2]),
            ]);
            return (
              <mesh key={`preview-${obj.id}`}>
                <tubeGeometry args={[curve, 2, 0.05, 8, false]} />
                <meshBasicMaterial
                  color={previewColor}
                  opacity={opacity}
                  transparent
                />
              </mesh>
            );

          case "circle":
            return (
              <mesh
                key={`preview-${obj.id}`}
                position={obj.center}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[obj.radius * 0.95, obj.radius, 32]} />
                <meshBasicMaterial
                  color={previewColor}
                  opacity={opacity}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            );

          case "arc":
            const arcGeometry = new THREE.RingGeometry(
              obj.radius * 0.95,
              obj.radius,
              Math.floor(
                ((obj.endAngle - obj.startAngle) / (Math.PI * 2)) * 32
              ),
              1,
              obj.startAngle,
              obj.endAngle - obj.startAngle
            );
            return (
              <mesh
                key={`preview-${obj.id}`}
                position={obj.center}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <primitive object={arcGeometry} />
                <meshBasicMaterial
                  color={previewColor}
                  opacity={opacity}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            );

          case "polyline":
            if (obj.points && obj.points.length >= 2) {
              const shape = new THREE.Shape(obj.points);
              return (
                <mesh
                  key={`preview-${obj.id}`}
                  position={[0, obj.depth / 2, 0]}
                >
                  <extrudeGeometry
                    args={[
                      shape,
                      {
                        depth: obj.depth || 0.1,
                        bevelEnabled: false,
                      },
                    ]}
                  />
                  <meshBasicMaterial
                    color={previewColor}
                    opacity={opacity}
                    transparent
                    side={THREE.DoubleSide}
                  />
                </mesh>
              );
            }
            break;

          case "ellipse":
            return (
              <mesh
                key={`preview-${obj.id}`}
                position={obj.center}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <ringGeometry args={[obj.radius * 0.95, obj.radius, 32]} />
                <meshBasicMaterial
                  color={previewColor}
                  opacity={opacity}
                  transparent
                  side={THREE.DoubleSide}
                />
              </mesh>
            );

          case "spline":
            if (obj.points && obj.points.length >= 2) {
              // Create a curve from control points
              const curve3D = new THREE.CatmullRomCurve3(
                obj.points.map((p) => new THREE.Vector3(p.x, 0, p.y))
              );
              return (
                <mesh key={`preview-${obj.id}`}>
                  <tubeGeometry args={[curve3D, 64, 0.05, 8, false]} />
                  <meshBasicMaterial
                    color={previewColor}
                    opacity={opacity}
                    transparent
                  />
                </mesh>
              );
            }
            break;

          case "text":
            return (
              <Text
                key={`preview-${obj.id}`}
                position={obj.position}
                fontSize={0.2}
                color={previewColor}
                anchorX="center"
                anchorY="middle"
              >
                [TEXT]
              </Text>
            );

          case "point":
            return (
              <mesh key={`preview-${obj.id}`} position={obj.position}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshBasicMaterial
                  color={previewColor}
                  opacity={opacity}
                  transparent
                />
              </mesh>
            );

          default:
            // Fallback for unknown types
            return (
              <mesh
                key={`preview-${obj.id}`}
                position={obj.position || [0, 0, 0]}
              >
                <boxGeometry args={[0.5, 0.1, 0.5]} />
                <meshBasicMaterial color="#ff6b6b" opacity={0.5} transparent />
              </mesh>
            );
        }

        return null;
      })}
    </group>
  );
}
