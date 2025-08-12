"use client";

import React, { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { SimpleDXFObject } from "./SimpleDXFImporter";

interface SimpleDXFRendererProps {
  dxfObjects: SimpleDXFObject[];
}

export default function SimpleDXFRenderer({
  dxfObjects,
}: SimpleDXFRendererProps) {
  const groupRefs = useRef<(THREE.Group | null)[]>([]);
  const { camera } = useThree();

  // Auto-fit camera to the first DXF on import
  useEffect(() => {
    if (dxfObjects.length === 0) return;

    const obj = dxfObjects[0];
    console.log("🎥 DXF bounds:", obj.bounds);
    console.log("📍 DXF position:", obj.position);
    console.log("📐 DXF geometries:", obj.geometry.length);

    const size = obj.bounds.size;
    const maxDim = Math.max(size.x, size.z);

    console.log("📏 Max dimension:", maxDim);

    if (maxDim > 0) {
      // Position camera to view the whole DXF
      const fov = (camera.fov * Math.PI) / 180;
      const distance = Math.max(20, (maxDim * 1.5) / (2 * Math.tan(fov / 2)));
      camera.position.set(0, distance * 0.8, distance * 0.8);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
      console.log("🎥 Camera positioned at:", camera.position);
    }
  }, [dxfObjects, camera]);

  return (
    <>
      {dxfObjects.map((dxfObject, index) => (
        <group
          key={dxfObject.id}
          ref={(ref) => {
            groupRefs.current[index] = ref;
          }}
          position={dxfObject.position}
          userData={{
            type: "simple_dxf",
            metadata: dxfObject.metadata,
          }}
        >
          {/* Render all geometries with appropriate rendering type */}
          {dxfObject.geometry.map((geometry, geoIndex) => {
            const material =
              dxfObject.materials[geoIndex] ||
              new THREE.LineBasicMaterial({ color: 0xff0000 });

            console.log(`Rendering geometry ${geoIndex}:`, {
              position: geometry.attributes.position?.count,
              hasPoints: !!geometry.attributes.position,
              materialType: material.type,
              isPointMaterial: material.type === "PointsMaterial",
            });

            // Render points for text and markers
            if (material.type === "PointsMaterial") {
              return (
                <points
                  key={`${dxfObject.id}-geo-${geoIndex}`}
                  geometry={geometry}
                  material={material}
                />
              );
            }

            // Render lines for everything else
            return (
              <lineSegments
                key={`${dxfObject.id}-geo-${geoIndex}`}
                geometry={geometry}
                material={material}
              />
            );
          })}

          {/* Debug: Wireframe cube to show DXF bounds */}
          <mesh
            position={[dxfObject.bounds.center.x, 0, dxfObject.bounds.center.z]}
          >
            <boxGeometry
              args={[dxfObject.bounds.size.x, 0.1, dxfObject.bounds.size.z]}
            />
            <meshBasicMaterial color="blue" wireframe />
          </mesh>

          {/* Debug: Small red cube at DXF position */}
          <mesh position={[0, 0.1, 0]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial color="red" />
          </mesh>
        </group>
      ))}
    </>
  );
}

// Info component for simple DXF
export function SimpleDXFInfo({
  dxfObjects,
}: {
  dxfObjects: SimpleDXFObject[];
}) {
  if (dxfObjects.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">📐 DXF Files</h3>
      <div className="space-y-3">
        {dxfObjects.map((obj) => (
          <div key={obj.id} className="border-l-4 border-green-500 pl-3">
            <div className="text-sm font-medium text-gray-800">
              📄 {obj.metadata.fileName}
            </div>
            <div className="text-xs text-gray-600 space-y-1 mt-1">
              <div>🔧 Entities: {obj.metadata.entityCount}</div>
              <div>
                📏 Size: {obj.bounds.size.x.toFixed(1)} ×{" "}
                {obj.bounds.size.z.toFixed(1)}
              </div>
              <div>📍 Geometries: {obj.geometry.length}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
