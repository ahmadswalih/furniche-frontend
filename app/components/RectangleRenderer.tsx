"use client";

import React from "react";
import * as THREE from "three";

interface RectangleObject {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  width: number;
  height: number;
  area: number;
  perimeter: number;
  startPoint: [number, number, number];
  endPoint: [number, number, number];
  layerId: string;
  createdAt: Date;
  metadata?: any;
}

interface RectangleRendererProps {
  rectangles: RectangleObject[];
  selectedObjectId?: string;
  onRectangleSelect: (id: string) => void;
  selectedLayerId?: string;
  layers: any[];
}

export default function RectangleRenderer({
  rectangles,
  selectedObjectId,
  onRectangleSelect,
  selectedLayerId,
  layers,
}: RectangleRendererProps) {
  const getLayerVisibility = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    return layer ? layer.visible : true;
  };

  const getLayerColor = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    return layer ? layer.color : "#3b82f6";
  };

  const getLayerOpacity = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer && !layer.visible) return 0.3;
    return 1.0;
  };

  return (
    <>
      {rectangles.map((rectangle) => {
        const isSelected = selectedObjectId === rectangle.id;
        const isVisible = getLayerVisibility(rectangle.layerId);
        const layerColor = getLayerColor(rectangle.layerId);
        const opacity = getLayerOpacity(rectangle.layerId);

        if (!isVisible) return null;

        return (
          <group key={rectangle.id}>
            {/* Main Rectangle Mesh */}
            <mesh
              position={rectangle.position}
              rotation={rectangle.rotation}
              scale={rectangle.scale}
              onClick={(e) => {
                e.stopPropagation();
                onRectangleSelect(rectangle.id);
              }}
              userData={{
                id: rectangle.id,
                type: rectangle.type,
                layerId: rectangle.layerId,
                metadata: rectangle.metadata,
              }}
            >
              {/* Use plane geometry for proper rectangle rendering */}
              <planeGeometry args={[rectangle.width, rectangle.height]} />
              <meshStandardMaterial
                color={isSelected ? "#ff6b6b" : layerColor}
                transparent
                opacity={opacity}
                side={THREE.DoubleSide}
                wireframe={isSelected}
              />
            </mesh>

            {/* Selection Highlight */}
            {isSelected && (
              <mesh
                position={rectangle.position}
                rotation={rectangle.rotation}
                scale={[rectangle.width + 0.02, 1, rectangle.height + 0.02]}
              >
                <planeGeometry args={[1, 1]} />
                <meshBasicMaterial
                  color="#ff6b6b"
                  transparent
                  opacity={0.3}
                  side={THREE.DoubleSide}
                  wireframe={true}
                />
              </mesh>
            )}

            {/* Edge Lines for better visibility */}
            <lineSegments
              position={rectangle.position}
              rotation={rectangle.rotation}
            >
              <edgesGeometry>
                <planeGeometry args={[rectangle.width, rectangle.height]} />
              </edgesGeometry>
              <lineBasicMaterial
                color={isSelected ? "#ff6b6b" : "#1e40af"}
                linewidth={isSelected ? 3 : 1}
                transparent
                opacity={opacity}
              />
            </lineSegments>

            {/* Corner Points for precise positioning */}
            {isSelected && (
              <>
                {/* Start Point */}
                <mesh
                  position={[
                    rectangle.startPoint[0],
                    0.02,
                    rectangle.startPoint[2],
                  ]}
                >
                  <sphereGeometry args={[0.03]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>

                {/* End Point */}
                <mesh
                  position={[
                    rectangle.endPoint[0],
                    0.02,
                    rectangle.endPoint[2],
                  ]}
                >
                  <sphereGeometry args={[0.03]} />
                  <meshBasicMaterial color="#ef4444" />
                </mesh>

                {/* Center Point */}
                <mesh
                  position={[
                    rectangle.position[0],
                    0.02,
                    rectangle.position[2],
                  ]}
                >
                  <sphereGeometry args={[0.02]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              </>
            )}

            {/* Dimensions Display */}
            {isSelected && (
              <group
                position={[rectangle.position[0], 0.1, rectangle.position[2]]}
              >
                {/* Width Line */}
                <mesh position={[0, 0, 0]}>
                  <cylinderGeometry args={[0.005, 0.005, rectangle.width]} />
                  <meshBasicMaterial color="#3b82f6" />
                </mesh>

                {/* Height Line */}
                <mesh position={[0, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.005, 0.005, rectangle.height]} />
                  <meshBasicMaterial color="#10b981" />
                </mesh>
              </group>
            )}
          </group>
        );
      })}
    </>
  );
}
