"use client";

import React, { useState, useCallback } from "react";
import * as THREE from "three";

interface DirectDXFParserProps {
  onDXFLoaded: (entities: DXFEntity[]) => void;
}

export interface DXFEntity {
  type: "LINE" | "POLYLINE" | "CIRCLE" | "ARC" | "TEXT" | "LWPOLYLINE";
  points: THREE.Vector3[];
  color: string;
  layer: string;
  radius?: number;
  startAngle?: number;
  endAngle?: number;
  text?: string;
}

export default function DirectDXFParser({ onDXFLoaded }: DirectDXFParserProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log(
          "🎯 Parsing DXF directly without separate canvas:",
          file.name
        );

        const text = await file.text();
        const entities = await parseDXFToEntities(text);

        console.log(`✅ Parsed ${entities.length} DXF entities directly`);
        onDXFLoaded(entities);
      } catch (err) {
        console.error("❌ Failed to parse DXF:", err);
        setError(err instanceof Error ? err.message : "Failed to parse DXF");
      } finally {
        setIsLoading(false);
      }
    },
    [onDXFLoaded]
  );

  const loadSampleDXF = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Create a simple sample architectural plan
      const sampleEntities: DXFEntity[] = [
        // Outer walls
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(10, 0, 0)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(10, 0, 0), new THREE.Vector3(10, 0, 8)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(10, 0, 8), new THREE.Vector3(0, 0, 8)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 8), new THREE.Vector3(0, 0, 0)],
          color: "#000000",
          layer: "WALLS",
        },
        // Inner room division
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 4), new THREE.Vector3(6, 0, 4)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(6, 0, 0), new THREE.Vector3(6, 0, 8)],
          color: "#000000",
          layer: "WALLS",
        },
        // Door openings (gaps in walls)
        {
          type: "LINE",
          points: [new THREE.Vector3(2, 0, 0), new THREE.Vector3(4, 0, 0)],
          color: "#ff0000",
          layer: "DOORS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(6, 0, 2), new THREE.Vector3(6, 0, 3)],
          color: "#ff0000",
          layer: "DOORS",
        },
        // Windows
        {
          type: "LINE",
          points: [new THREE.Vector3(8, 0, 8), new THREE.Vector3(9, 0, 8)],
          color: "#0000ff",
          layer: "WINDOWS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 6), new THREE.Vector3(0, 0, 7)],
          color: "#0000ff",
          layer: "WINDOWS",
        },
      ];

      console.log("✅ Loaded sample architectural plan");
      onDXFLoaded(sampleEntities);
    } catch (err) {
      console.error("❌ Failed to load sample:", err);
      setError("Failed to load sample");
    } finally {
      setIsLoading(false);
    }
  }, [onDXFLoaded]);

  return (
    <div className="bg-white p-4 rounded-lg shadow-md">
      <h3 className="text-lg font-semibold mb-4">📐 Direct DXF Parser</h3>
      <p className="text-sm text-gray-600 mb-4">
        Load DXF files directly into the main 3D scene (no separate canvas)
      </p>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Upload DXF File
          </label>
          <input
            type="file"
            accept=".dxf"
            onChange={handleFileChange}
            disabled={isLoading}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </div>

        <button
          onClick={loadSampleDXF}
          disabled={isLoading}
          className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
        >
          {isLoading ? "Loading..." : "🏠 Load Sample Floor Plan"}
        </button>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}

        {isLoading && (
          <div className="text-blue-600 text-sm bg-blue-50 p-2 rounded">
            Parsing DXF file...
          </div>
        )}
      </div>
    </div>
  );
}

// Enhanced DXF parser that extracts common CAD entities
async function parseDXFToEntities(dxfContent: string): Promise<DXFEntity[]> {
  const entities: DXFEntity[] = [];
  const lines = dxfContent.split("\n");

  let currentEntity: Partial<DXFEntity> | null = null;
  let currentSection = "";
  let inEntities = false;
  let i = 0;

  // Parsing state
  let pendingX: number | null = null;
  let pendingY: number | null = null;
  let pendingZ: number | null = null;

  while (i < lines.length) {
    const code = parseInt(lines[i]?.trim() || "0");
    const value = lines[i + 1]?.trim() || "";

    // Section management
    if (code === 0) {
      if (value === "SECTION") {
        const sectionType = lines[i + 3]?.trim();
        inEntities = sectionType === "ENTITIES";
        currentSection = sectionType || "";
      } else if (value === "ENDSEC") {
        if (inEntities && currentEntity) {
          // Finalize current entity
          if (
            currentEntity.type &&
            currentEntity.points &&
            currentEntity.points.length > 0
          ) {
            entities.push(currentEntity as DXFEntity);
          }
          currentEntity = null;
        }
        inEntities = false;
        currentSection = "";
      } else if (inEntities) {
        // Finalize previous entity
        if (
          currentEntity &&
          currentEntity.type &&
          currentEntity.points &&
          currentEntity.points.length > 0
        ) {
          entities.push(currentEntity as DXFEntity);
        }

        // Start new entity
        if (
          [
            "LINE",
            "POLYLINE",
            "LWPOLYLINE",
            "CIRCLE",
            "ARC",
            "TEXT",
            "MTEXT",
          ].includes(value)
        ) {
          currentEntity = {
            type: value as any,
            points: [],
            color: "#000000",
            layer: "0",
          };

          // Reset coordinate state
          pendingX = null;
          pendingY = null;
          pendingZ = null;
        }
      }
    }

    // Parse entity properties
    if (inEntities && currentEntity) {
      switch (code) {
        case 8: // Layer
          currentEntity.layer = value;
          break;
        case 62: // Color number
          currentEntity.color = getDXFColor(parseInt(value) || 0);
          break;
        case 10: // X coordinate (start point or single point)
          pendingX = parseFloat(value);
          break;
        case 20: // Y coordinate
          pendingY = parseFloat(value);
          break;
        case 30: // Z coordinate
          pendingZ = parseFloat(value) || 0;

          // When we have X, Y, Z - create point
          if (pendingX !== null && pendingY !== null) {
            currentEntity.points = currentEntity.points || [];
            // Convert DXF coordinates to Three.js (Y up, Z forward)
            currentEntity.points.push(
              new THREE.Vector3(pendingX, 0, -pendingY)
            );
            pendingX = null;
            pendingY = null;
            pendingZ = null;
          }
          break;
        case 11: // X coordinate (end point for lines)
          const endX = parseFloat(value);
          if (!isNaN(endX)) {
            const endY = parseFloat(lines[i + 3] || "0");
            if (currentEntity.type === "LINE") {
              currentEntity.points = currentEntity.points || [];
              currentEntity.points.push(new THREE.Vector3(endX, 0, -endY));
            }
          }
          break;
        case 21: // Y coordinate (end point)
          // This is handled with code 11 (X coordinate)
          break;
        case 40: // Radius (for circles)
          if (currentEntity.type === "CIRCLE") {
            currentEntity.radius = parseFloat(value);
          }
          break;
        case 50: // Start angle (for arcs)
          currentEntity.startAngle = parseFloat(value) * (Math.PI / 180); // Convert to radians
          break;
        case 51: // End angle (for arcs)
          currentEntity.endAngle = parseFloat(value) * (Math.PI / 180);
          break;
        case 1: // Text content
          if (currentEntity.type === "TEXT" || currentEntity.type === "MTEXT") {
            currentEntity.text = value;
          }
          break;
      }
    }

    i += 2; // Skip to next code-value pair
  }

  // Finalize last entity
  if (
    currentEntity &&
    currentEntity.type &&
    currentEntity.points &&
    currentEntity.points.length > 0
  ) {
    entities.push(currentEntity as DXFEntity);
  }

  // Post-process circles and arcs to generate point arrays
  const processedEntities = entities.map((entity) => {
    if (entity.type === "CIRCLE" && entity.points.length > 0 && entity.radius) {
      const center = entity.points[0];
      const radius = entity.radius;
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

      return { ...entity, points: circlePoints };
    }

    if (
      entity.type === "ARC" &&
      entity.points.length > 0 &&
      entity.radius &&
      entity.startAngle !== undefined &&
      entity.endAngle !== undefined
    ) {
      const center = entity.points[0];
      const radius = entity.radius;
      const startAngle = entity.startAngle;
      const endAngle = entity.endAngle;
      const segments = 16;
      const arcPoints: THREE.Vector3[] = [];

      for (let i = 0; i <= segments; i++) {
        const angle = startAngle + (i / segments) * (endAngle - startAngle);
        arcPoints.push(
          new THREE.Vector3(
            center.x + Math.cos(angle) * radius,
            center.y,
            center.z + Math.sin(angle) * radius
          )
        );
      }

      return { ...entity, points: arcPoints };
    }

    return entity;
  });

  // Calculate bounds and scale to reasonable size
  const scaledEntities = scaleEntitiesToReasonableSize(processedEntities);

  console.log(`📐 Extracted ${scaledEntities.length} entities from DXF`);
  console.log(
    "📊 First few entities for debugging:",
    scaledEntities.slice(0, 3)
  );
  return scaledEntities;
}

// Scale entities to reasonable size for 3D scene
function scaleEntitiesToReasonableSize(entities: DXFEntity[]): DXFEntity[] {
  if (entities.length === 0) return entities;

  // Calculate overall bounds
  let minX = Infinity,
    maxX = -Infinity;
  let minZ = Infinity,
    maxZ = -Infinity;

  entities.forEach((entity) => {
    entity.points.forEach((point) => {
      minX = Math.min(minX, point.x);
      maxX = Math.max(maxX, point.x);
      minZ = Math.min(minZ, point.z);
      maxZ = Math.max(maxZ, point.z);
    });
  });

  // Calculate size and center
  const sizeX = maxX - minX;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeZ);

  console.log(
    `📏 DXF bounds: X(${minX.toFixed(2)} to ${maxX.toFixed(
      2
    )}) Z(${minZ.toFixed(2)} to ${maxZ.toFixed(2)})`
  );
  console.log(
    `📏 DXF size: ${sizeX.toFixed(2)} x ${sizeZ.toFixed(
      2
    )}, max: ${maxSize.toFixed(2)}`
  );

  // Only scale if the drawing is too large or too small
  let scale = 1;
  const targetSize = 20; // Target max dimension in scene units

  if (maxSize > targetSize * 2) {
    scale = targetSize / maxSize;
    console.log(`📉 Scaling DOWN by ${scale.toFixed(3)} (too large)`);
  } else if (maxSize < 1) {
    scale = targetSize / maxSize;
    console.log(`📈 Scaling UP by ${scale.toFixed(3)} (too small)`);
  }

  // Calculate center offset to position at origin
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  return entities.map((entity) => ({
    ...entity,
    points: entity.points.map(
      (point) =>
        new THREE.Vector3(
          (point.x - centerX) * scale,
          point.y,
          (point.z - centerZ) * scale
        )
    ),
    radius: entity.radius ? entity.radius * scale : undefined,
  }));
}

// Enhanced DXF color index to hex conversion
function getDXFColor(colorIndex: number): string {
  const standardColors = {
    0: "#000000", // Black
    1: "#FF0000", // Red
    2: "#FFFF00", // Yellow
    3: "#00FF00", // Green
    4: "#00FFFF", // Cyan
    5: "#0000FF", // Blue
    6: "#FF00FF", // Magenta
    7: "#FFFFFF", // White
    8: "#404040", // Dark Gray
    9: "#C0C0C0", // Light Gray
    10: "#FF0000", // Red
    11: "#FF8080", // Light Red
    12: "#800000", // Dark Red
    13: "#FF8000", // Orange
    14: "#FFFF80", // Light Yellow
    15: "#808000", // Dark Yellow
    // Add more colors for better variety
    30: "#FF6600", // Orange
    40: "#9900FF", // Purple
    50: "#FF9900", // Light Orange
    60: "#00FF99", // Light Green
    70: "#9999FF", // Light Blue
    80: "#FF9999", // Pink
    90: "#99FF99", // Light Green
    250: "#888888", // Medium Gray
    251: "#BBBBBB", // Light Gray
    252: "#DDDDDD", // Very Light Gray
    253: "#F0F0F0", // Almost White
    254: "#FFFFFF", // White
  };

  // If color index 0 (black), try to use a more visible default
  if (colorIndex === 0) {
    return "#333333"; // Dark gray instead of pure black for better visibility
  }

  return standardColors[colorIndex as keyof typeof standardColors] || "#666666";
}
