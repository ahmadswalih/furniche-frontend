"use client";

import React, { useState, useEffect } from "react";
import * as THREE from "three";

interface VectorDXFRendererProps {
  dxfFile?: File;
  position?: [number, number, number];
  onLoadComplete?: (bounds: THREE.Box3) => void;
}

interface DXFEntity {
  type: string;
  points: THREE.Vector3[];
  color?: string;
  layer?: string;
}

export default function VectorDXFRenderer({
  dxfFile,
  position = [0, 0.01, 0],
  onLoadComplete,
}: VectorDXFRendererProps) {
  const [entities, setEntities] = useState<DXFEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dxfFile) return;

    const loadDXF = async () => {
      setIsLoading(true);
      setError(null);

      try {
        console.log("🎯 Loading DXF as pure vector data:", dxfFile.name);

        // Read file as text
        const text = await dxfFile.text();

        // Parse DXF content manually for vector data
        const parsedEntities = await parseDXFContent(text);
        setEntities(parsedEntities);

        // Calculate bounds
        if (parsedEntities.length > 0 && onLoadComplete) {
          const bounds = calculateBounds(parsedEntities);
          onLoadComplete(bounds);
        }

        console.log(
          `✅ Loaded ${parsedEntities.length} vector entities from DXF`
        );
      } catch (err) {
        console.error("❌ Failed to load vector DXF:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    loadDXF();
  }, [dxfFile, onLoadComplete]);

  if (isLoading) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="#00ff00" transparent opacity={0.5} />
      </mesh>
    );
  }

  if (error) {
    return (
      <mesh position={position}>
        <boxGeometry args={[0.1, 0.1, 0.1]} />
        <meshBasicMaterial color="#ff0000" transparent opacity={0.8} />
      </mesh>
    );
  }

  return (
    <group position={position} name="vector-dxf-renderer">
      {entities.map((entity, index) => {
        if (entity.type === "LINE" && entity.points.length >= 2) {
          return (
            <line key={`line-${index}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={entity.points.length}
                  array={
                    new Float32Array(
                      entity.points.flatMap((p) => [p.x, p.y, p.z])
                    )
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={entity.color || "#000000"}
                linewidth={2}
              />
            </line>
          );
        } else if (entity.type === "POLYLINE" && entity.points.length >= 2) {
          return (
            <line key={`polyline-${index}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={entity.points.length}
                  array={
                    new Float32Array(
                      entity.points.flatMap((p) => [p.x, p.y, p.z])
                    )
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={entity.color || "#000000"}
                linewidth={1.5}
              />
            </line>
          );
        } else if (entity.type === "CIRCLE" && entity.points.length >= 1) {
          const center = entity.points[0];
          // Create circle geometry (simplified as octagon for performance)
          const radius = 1; // This should come from DXF data
          const segments = 32;
          const circlePoints: THREE.Vector3[] = [];

          for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            circlePoints.push(
              new THREE.Vector3(
                center.x + Math.cos(angle) * radius,
                center.y,
                center.z + Math.sin(angle) * radius
              )
            );
          }

          return (
            <line key={`circle-${index}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={circlePoints.length}
                  array={
                    new Float32Array(
                      circlePoints.flatMap((p) => [p.x, p.y, p.z])
                    )
                  }
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={entity.color || "#000000"}
                linewidth={1.5}
              />
            </line>
          );
        }

        return null;
      })}
    </group>
  );
}

// Simple DXF parser for basic entities
async function parseDXFContent(dxfText: string): Promise<DXFEntity[]> {
  const entities: DXFEntity[] = [];
  const lines = dxfText.split("\n");

  let currentEntity: Partial<DXFEntity> | null = null;
  let currentSection = "";
  let i = 0;

  while (i < lines.length) {
    const code = parseInt(lines[i]?.trim() || "0");
    const value = lines[i + 1]?.trim() || "";

    // Check for section headers
    if (code === 0) {
      if (value === "SECTION") {
        currentSection = lines[i + 3]?.trim() || "";
      } else if (value === "ENDSEC") {
        currentSection = "";
      } else if (currentSection === "ENTITIES") {
        // Start new entity
        if (currentEntity && currentEntity.type && currentEntity.points) {
          entities.push(currentEntity as DXFEntity);
        }

        currentEntity = {
          type: value,
          points: [],
          color: "#000000",
          layer: "0",
        };
      }
    }

    // Parse entity data
    if (currentEntity && currentSection === "ENTITIES") {
      if (code === 10) {
        // X coordinate
        const x = parseFloat(value);
        const y = i + 2 < lines.length ? parseFloat(lines[i + 3] || "0") : 0; // Y (code 20)
        const z = i + 4 < lines.length ? parseFloat(lines[i + 5] || "0") : 0; // Z (code 30)

        if (!isNaN(x)) {
          currentEntity.points = currentEntity.points || [];
          currentEntity.points.push(new THREE.Vector3(x, 0, -y)); // Note: Y becomes Z, negate for correct orientation
        }
      } else if (code === 8) {
        // Layer name
        currentEntity.layer = value;
      } else if (code === 62) {
        // Color number
        currentEntity.color = getColorFromIndex(parseInt(value));
      }
    }

    i += 2; // Move to next code-value pair
  }

  // Add last entity
  if (currentEntity && currentEntity.type && currentEntity.points) {
    entities.push(currentEntity as DXFEntity);
  }

  console.log(`📐 Parsed ${entities.length} DXF entities`);
  return entities;
}

// Calculate bounds from entities
function calculateBounds(entities: DXFEntity[]): THREE.Box3 {
  const bounds = new THREE.Box3();

  entities.forEach((entity) => {
    entity.points.forEach((point) => {
      bounds.expandByPoint(point);
    });
  });

  return bounds;
}

// Convert DXF color index to hex color
function getColorFromIndex(colorIndex: number): string {
  const colors = [
    "#000000",
    "#FF0000",
    "#FFFF00",
    "#00FF00",
    "#00FFFF",
    "#0000FF",
    "#FF00FF",
    "#FFFFFF",
    "#808080",
    "#C0C0C0",
  ];
  return colors[colorIndex] || "#000000";
}
