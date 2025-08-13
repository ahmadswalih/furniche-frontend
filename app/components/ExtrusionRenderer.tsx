"use client";

import React from "react";
import * as THREE from "three";

interface ExtrusionObject {
  id: string;
  type: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  width: number;
  height: number;
  depth: number;
  volume: number;
  baseArea: number;
  baseRectangleId: string;
  createdAt: Date;
  isIntrusion?: boolean;
  metadata?: any;
}

interface ExtrusionRendererProps {
  extrusions: ExtrusionObject[];
  selectedObjectId?: string;
  onExtrusionSelect: (id: string) => void;
  selectedLayerId?: string;
  layers: any[];
}

export default function ExtrusionRenderer({
  extrusions,
  selectedObjectId,
  onExtrusionSelect,
  selectedLayerId,
  layers,
}: ExtrusionRendererProps) {
  const getLayerVisibility = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    return layer ? layer.visible : true;
  };

  const getLayerColor = (extrusionColor: string) => {
    // Use the extrusion's own color or default
    return extrusionColor || "#3b82f6";
  };

  const getLayerOpacity = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (layer && !layer.visible) return 0.3;
    return 1.0;
  };

  return (
    <>
      {extrusions.map((extrusion) => {
        const isSelected = selectedObjectId === extrusion.id;
        const layerColor = getLayerColor(extrusion.color);
        const opacity = 0.8; // Slightly transparent for 3D effect

        return (
          <group key={extrusion.id}>
            {/* Main 3D Extrusion/Intrusion Mesh */}
            <mesh
              position={[
                extrusion.position[0],
                extrusion.position[1] + (extrusion.isIntrusion ? -extrusion.depth / 2 : extrusion.depth / 2),
                extrusion.position[2],
              ]}
              rotation={extrusion.rotation}
              scale={extrusion.scale}
              onClick={(e) => {
                e.stopPropagation();
                console.log('🏗️ Extrusion clicked:', extrusion.id);
                onExtrusionSelect(extrusion.id);
              }}
              onPointerOver={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'pointer';
              }}
              onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
              }}
              userData={{
                id: extrusion.id,
                type: extrusion.type,
                metadata: extrusion.metadata,
              }}
            >
              {/* Box geometry for the 3D extrusion */}
              <boxGeometry args={[extrusion.width, extrusion.depth, extrusion.height]} />
              <meshBasicMaterial
                color={isSelected ? "#ff6b6b" : (extrusion.isIntrusion ? "#ef4444" : layerColor)}
                transparent
                opacity={opacity}
                depthTest={false}
                depthWrite={false}
              />
            </mesh>

            {/* Wireframe overlay for better definition */}
            <lineSegments
              position={[
                extrusion.position[0],
                extrusion.position[1] + (extrusion.isIntrusion ? -extrusion.depth / 2 : extrusion.depth / 2),
                extrusion.position[2],
              ]}
              rotation={extrusion.rotation}
            >
              <edgesGeometry>
                <boxGeometry args={[extrusion.width, extrusion.depth, extrusion.height]} />
              </edgesGeometry>
              <lineBasicMaterial
                color={isSelected ? "#ff6b6b" : "#1e40af"}
                linewidth={isSelected ? 2 : 1}
                transparent
                opacity={0.8}
                depthTest={false}
                depthWrite={false}
              />
            </lineSegments>

            {/* Selection indicators */}
            {isSelected && (
              <>
                {/* Base outline */}
                <lineSegments
                  position={[
                    extrusion.position[0],
                    extrusion.position[1] + 0.01,
                    extrusion.position[2],
                  ]}
                >
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={8}
                      array={new Float32Array([
                        -extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, extrusion.height/2,
                        extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, -extrusion.height/2,
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color="#ef4444"
                    linewidth={2}
                    transparent
                    opacity={0.8}
                    depthTest={false}
                    depthWrite={false}
                  />
                </lineSegments>

                {/* Top outline */}
                <lineSegments
                  position={[
                    extrusion.position[0],
                    extrusion.position[1] + extrusion.depth,
                    extrusion.position[2],
                  ]}
                >
                  <bufferGeometry>
                    <bufferAttribute
                      attach="attributes-position"
                      count={8}
                      array={new Float32Array([
                        -extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, -extrusion.height/2,
                        extrusion.width/2, 0, extrusion.height/2,
                        extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, extrusion.height/2,
                        -extrusion.width/2, 0, -extrusion.height/2,
                      ])}
                      itemSize={3}
                    />
                  </bufferGeometry>
                  <lineBasicMaterial
                    color="#10b981"
                    linewidth={2}
                    transparent
                    opacity={0.8}
                    depthTest={false}
                    depthWrite={false}
                  />
                </lineSegments>

                {/* Height indicator lines */}
                {/* Corner height lines */}
                {[
                  [-extrusion.width/2, -extrusion.height/2],
                  [extrusion.width/2, -extrusion.height/2],
                  [extrusion.width/2, extrusion.height/2],
                  [-extrusion.width/2, extrusion.height/2],
                ].map((corner, index) => (
                  <lineSegments
                    key={`corner-${index}`}
                    position={[
                      extrusion.position[0] + corner[0],
                      extrusion.position[1] + extrusion.depth / 2,
                      extrusion.position[2] + corner[1],
                    ]}
                  >
                    <bufferGeometry>
                      <bufferAttribute
                        attach="attributes-position"
                        count={2}
                        array={new Float32Array([
                          0, -extrusion.depth/2, 0,
                          0, extrusion.depth/2, 0,
                        ])}
                        itemSize={3}
                      />
                    </bufferGeometry>
                    <lineBasicMaterial
                      color="#3b82f6"
                      linewidth={1}
                      transparent
                      opacity={0.6}
                      depthTest={false}
                      depthWrite={false}
                    />
                  </lineSegments>
                ))}
              </>
            )}
          </group>
        );
      })}
    </>
  );
}