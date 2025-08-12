"use client";

import React, { useMemo } from "react";
import * as THREE from "three";
import { DXFEntity } from "./DirectDXFParser";

interface DirectDXFRendererProps {
  entities: DXFEntity[];
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
}

export default function DirectDXFRenderer({
  entities,
  position = [0, 0.01, 0],
  scale = 1,
  visible = true,
}: DirectDXFRendererProps) {
  const renderedElements = useMemo(() => {
    if (!entities || entities.length === 0) return [];

    console.log(
      `🎨 Rendering ${entities.length} DXF entities directly in main scene`
    );
    console.log("🔍 Sample entities:", entities.slice(0, 2));

    return entities
      .map((entity, index) => {
        const key = `dxf-entity-${index}`;

        // Render lines and polylines as clean vector lines (like FreeCAD)
        if (
          (entity.type === "LINE" ||
            entity.type === "POLYLINE" ||
            entity.type === "LWPOLYLINE") &&
          entity.points.length >= 2
        ) {
          try {
            // Create geometry from points
            const points = entity.points.flatMap((p) => [p.x, p.y, p.z]);

            return (
              <line
                key={key}
                userData={{ dxfEntity: entity, layer: entity.layer }}
              >
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={entity.points.length}
                    array={new Float32Array(points)}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={entity.color || "#333333"}
                  linewidth={2}
                />
              </line>
            );
          } catch (error) {
            console.warn("Error rendering line entity:", error, entity);
            return null;
          }
        }

        // Render circles as clean vector lines
        if (entity.type === "CIRCLE" && entity.points.length > 1) {
          try {
            const points = entity.points.flatMap((p) => [p.x, p.y, p.z]);

            return (
              <line
                key={key}
                userData={{ dxfEntity: entity, layer: entity.layer }}
              >
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={entity.points.length}
                    array={new Float32Array(points)}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={entity.color || "#333333"}
                  linewidth={2}
                />
              </line>
            );
          } catch (error) {
            console.warn("Error rendering circle entity:", error, entity);
            return null;
          }
        }

        // Render arcs as clean vector lines
        if (entity.type === "ARC" && entity.points.length >= 2) {
          try {
            const points = entity.points.flatMap((p) => [p.x, p.y, p.z]);

            return (
              <line
                key={key}
                userData={{ dxfEntity: entity, layer: entity.layer }}
              >
                <bufferGeometry>
                  <bufferAttribute
                    attach="attributes-position"
                    count={entity.points.length}
                    array={new Float32Array(points)}
                    itemSize={3}
                  />
                </bufferGeometry>
                <lineBasicMaterial
                  color={entity.color || "#333333"}
                  linewidth={2}
                />
              </line>
            );
          } catch (error) {
            console.warn("Error rendering arc entity:", error, entity);
            return null;
          }
        }

        // Render text as simple 3D text placeholder
        if (
          (entity.type === "TEXT" || entity.type === "MTEXT") &&
          entity.points.length > 0 &&
          entity.text
        ) {
          const textPosition = entity.points[0];

          return (
            <group
              key={key}
              position={[textPosition.x, textPosition.y + 0.1, textPosition.z]}
            >
              <mesh userData={{ dxfEntity: entity, layer: entity.layer }}>
                <boxGeometry args={[0.1 * scale, 0.05 * scale, 0.01]} />
                <meshBasicMaterial
                  color={entity.color}
                  transparent={true}
                  opacity={0.6}
                />
              </mesh>
            </group>
          );
        }

        return null;
      })
      .filter(Boolean);
  }, [entities, scale]);

  if (!visible || renderedElements.length === 0) {
    return null;
  }

  return (
    <group
      position={position}
      scale={[scale, scale, scale]}
      name="direct-dxf-renderer"
    >
      {renderedElements}
    </group>
  );
}

// Layer management component
interface DirectDXFLayerControlsProps {
  entities: DXFEntity[];
  onLayerToggle?: (layer: string, visible: boolean) => void;
  onClear?: () => void;
}

export function DirectDXFLayerControls({
  entities,
  onLayerToggle,
  onClear,
}: DirectDXFLayerControlsProps) {
  const layers = useMemo(() => {
    const layerMap = new Map<string, { count: number; color: string }>();

    entities.forEach((entity) => {
      const layer = entity.layer || "0";
      const existing = layerMap.get(layer);
      if (existing) {
        existing.count++;
      } else {
        layerMap.set(layer, { count: 1, color: entity.color });
      }
    });

    return Array.from(layerMap.entries()).map(([name, info]) => ({
      name,
      ...info,
      visible: true,
    }));
  }, [entities]);

  if (layers.length === 0) return null;

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-800">📐 DXF Layers</h4>
        <button
          onClick={onClear}
          className="text-sm px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2 max-h-40 overflow-y-auto">
        {layers.map((layer) => (
          <div key={layer.name} className="flex items-center space-x-2">
            <input
              type="checkbox"
              defaultChecked={layer.visible}
              onChange={(e) => onLayerToggle?.(layer.name, e.target.checked)}
              className="rounded"
            />
            <div
              className="w-4 h-4 rounded"
              style={{ backgroundColor: layer.color }}
            />
            <span className="text-sm flex-1">{layer.name}</span>
            <span className="text-xs text-gray-500">({layer.count})</span>
          </div>
        ))}
      </div>

      <div className="mt-3 text-xs text-gray-500">
        Total: {entities.length} entities
      </div>
    </div>
  );
}
