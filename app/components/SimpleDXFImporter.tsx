"use client";

import React, { useCallback, useState } from "react";
import * as THREE from "three";

export interface SimpleDXFObject {
  id: string;
  type: "simple_dxf";
  geometry: THREE.BufferGeometry[];
  materials: THREE.Material[];
  position: [number, number, number];
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    size: THREE.Vector3;
  };
  metadata: {
    fileName: string;
    entityCount: number;
    importTime: number;
  };
}

interface SimpleDXFImporterProps {
  onImportComplete: (objects: SimpleDXFObject[]) => void;
}

export default function SimpleDXFImporter({
  onImportComplete,
}: SimpleDXFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDXFFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      console.log("📐 Processing DXF file directly:", file.name);

      try {
        const text = await file.text();
        console.log("📄 DXF file loaded, size:", text.length, "characters");

        // Use dxf-parser (more reliable than three-dxf-viewer)
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        console.log("🔍 DXF parsed:", dxf);

        // Log all entity types found
        const entityTypes = dxf.entities?.map((e) => e.type) || [];
        const typeCounts = entityTypes.reduce((acc, type) => {
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log("📋 Entity types found:", typeCounts);

        // Log first few entities to see their structure
        console.log("📝 First 3 entities:", dxf.entities?.slice(0, 3));

        if (!dxf || !dxf.entities || dxf.entities.length === 0) {
          throw new Error("No entities found in DXF file");
        }

        console.log(`📊 Found ${dxf.entities.length} entities`);

        // Create simple geometries directly
        const geometries: THREE.BufferGeometry[] = [];
        const materials: THREE.Material[] = [];
        let entityCount = 0;

        // Process entities directly without complex transformations
        dxf.entities.forEach((entity: any, index: number) => {
          try {
            console.log(`🔧 Processing entity ${index}:`, {
              type: entity.type,
              layer: entity.layer,
              hasVertices: !!entity.vertices,
              vertexCount: entity.vertices?.length,
              hasText: !!(entity.text || entity.textValue),
              entity: entity,
            });

            const result = createSimpleGeometry(entity, index);
            if (result) {
              geometries.push(result.geometry);
              materials.push(result.material);
              entityCount++;
            } else {
              console.warn(
                `❌ No geometry created for entity ${index} (${entity.type})`
              );
            }
          } catch (error) {
            console.warn(`⚠️ Skipping entity ${index}:`, error);
          }
        });

        console.log(
          `✅ Created ${entityCount} geometries from ${dxf.entities.length} entities`
        );

        if (geometries.length === 0) {
          throw new Error("No valid geometries created from DXF");
        }

        // Calculate bounds from all geometries
        const bounds = calculateSimpleBounds(geometries);

        console.log("📊 DXF Import Summary:");
        console.log("- Geometries created:", geometries.length);
        console.log("- Entity count:", entityCount);
        console.log("- Bounds:", bounds);
        console.log(
          "- First geometry points:",
          geometries[0]?.attributes?.position?.count
        );

        // Create simple DXF object
        const simpleDXF: SimpleDXFObject = {
          id: `simple-dxf-${Date.now()}`,
          type: "simple_dxf",
          geometry: geometries,
          materials: materials,
          position: [0, 0, 0], // Don't center for debugging
          bounds,
          metadata: {
            fileName: file.name,
            entityCount,
            importTime: Date.now(),
          },
        };

        console.log("🎉 Simple DXF created:", simpleDXF);
        onImportComplete([simpleDXF]);
      } catch (error) {
        console.error("❌ Error importing DXF:", error);
        alert(`Failed to import DXF: ${error}`);
      } finally {
        setIsProcessing(false);
      }
    },
    [onImportComplete]
  );

  return (
    <div className="space-y-4">
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        <input
          type="file"
          accept=".dxf,.DXF"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleDXFFile(file);
          }}
          className="hidden"
          id="simple-dxf-input"
          disabled={isProcessing}
        />
        <label
          htmlFor="simple-dxf-input"
          className={`cursor-pointer inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-lg font-medium rounded-md ${
            isProcessing
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <span>📐</span>
          <span>{isProcessing ? "Processing..." : "Import DXF File"}</span>
        </label>

        {isProcessing && (
          <div className="mt-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600 mt-2">Processing DXF...</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={async () => {
            try {
              const response = await fetch("/simple.dxf");
              const blob = await response.blob();
              const file = new File([blob], "simple.dxf", {
                type: "application/dxf",
              });
              handleDXFFile(file);
            } catch (error) {
              console.error("Error loading simple DXF:", error);
            }
          }}
          disabled={isProcessing}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-300"
        >
          🧪 Test Simple
        </button>

        <button
          onClick={async () => {
            try {
              const response = await fetch("/sample.dxf");
              const blob = await response.blob();
              const file = new File([blob], "sample.dxf", {
                type: "application/dxf",
              });
              handleDXFFile(file);
            } catch (error) {
              console.error("Error loading sample DXF:", error);
            }
          }}
          disabled={isProcessing}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:bg-gray-300"
        >
          🏢 Test Complex
        </button>
      </div>
    </div>
  );
}

// Helper functions
function createSimpleGeometry(
  entity: any,
  index: number
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  const color = getEntityColor(entity);
  const material = new THREE.LineBasicMaterial({ color });

  switch (entity.type) {
    case "LINE":
      return createLineGeometry(entity, material);

    case "LWPOLYLINE":
      return createLWPolylineGeometry(entity, material);
    case "POLYLINE":
      return createPolylineGeometry(entity, material);

    case "CIRCLE":
      return createCircleGeometry(entity, material);

    case "ARC":
      return createArcGeometry(entity, material);

    case "TEXT":
    case "MTEXT":
      return createTextGeometry(entity, material);

    case "HATCH":
      return createHatchGeometry(entity, material);

    case "DIMENSION":
      return createDimensionGeometry(entity, material);

    case "INSERT":
      return createInsertGeometry(entity, material);

    case "SOLID":
    case "TRACE":
      return createSolidGeometry(entity, material);

    case "POINT":
      return createPointGeometry(entity, material);

    case "ELLIPSE":
      return createEllipseGeometry(entity, material);

    case "SPLINE":
      return createSplineGeometry(entity, material);

    default:
      console.log(`📝 Unsupported entity type: ${entity.type}`, entity);
      // Try to create something from vertices if they exist
      if (entity.vertices && entity.vertices.length >= 2) {
        console.log(
          `🔄 Attempting to create generic polyline for ${entity.type}`
        );
        return createPolylineGeometry(entity, material);
      }
      return null;
  }
}

function createLineGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } {
  const points: THREE.Vector3[] = [];

  if (entity.vertices && entity.vertices.length >= 2) {
    const p1 = new THREE.Vector3(
      entity.vertices[0].x || 0,
      0,
      entity.vertices[0].y || 0
    );
    const p2 = new THREE.Vector3(
      entity.vertices[1].x || 0,
      0,
      entity.vertices[1].y || 0
    );
    points.push(p1, p2);
    console.log("📏 LINE from vertices:", p1, "to", p2);
  } else {
    const p1 = new THREE.Vector3(entity.start?.x || 0, 0, entity.start?.y || 0);
    const p2 = new THREE.Vector3(entity.end?.x || 0, 0, entity.end?.y || 0);
    points.push(p1, p2);
    console.log("📏 LINE from start/end:", p1, "to", p2);
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  console.log("📏 Created line geometry with", points.length, "points");
  return { geometry, material };
}

function createPolylineGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points: THREE.Vector3[] = entity.vertices.map(
    (v: any) => new THREE.Vector3(v.x || 0, 0, v.y || 0)
  );

  // Close the polyline if specified
  if (entity.closed && points.length > 2) {
    points.push(points[0].clone());
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return { geometry, material };
}

function createCircleGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.center || !entity.radius) return null;

  const points: THREE.Vector3[] = [];
  const segments = 32;
  const radius = entity.radius;
  const centerX = entity.center.x || 0;
  const centerZ = entity.center.y || 0; // DXF Y becomes THREE.js Z

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    points.push(
      new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        0,
        centerZ + Math.sin(angle) * radius
      )
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return { geometry, material };
}

function createArcGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.center || !entity.radius) return null;

  const points: THREE.Vector3[] = [];
  const segments = 16;
  const radius = entity.radius;
  const centerX = entity.center.x || 0;
  const centerZ = entity.center.y || 0; // DXF Y becomes THREE.js Z
  const startAngle = entity.startAngle || 0;
  const endAngle = entity.endAngle || Math.PI * 2;

  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (i / segments) * (endAngle - startAngle);
    points.push(
      new THREE.Vector3(
        centerX + Math.cos(angle) * radius,
        0,
        centerZ + Math.sin(angle) * radius
      )
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return { geometry, material };
}

// Add LWPOLYLINE with bulge support
function createLWPolylineGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points: THREE.Vector3[] = [];

  for (let i = 0; i < entity.vertices.length; i++) {
    const vertex = entity.vertices[i];
    const nextVertex =
      entity.vertices[i + 1] || (entity.closed ? entity.vertices[0] : null);

    if (nextVertex) {
      const bulge = vertex.bulge || 0;

      if (Math.abs(bulge) < 1e-6) {
        // Straight line segment
        points.push(
          new THREE.Vector3(vertex.x || 0, 0, vertex.y || 0),
          new THREE.Vector3(nextVertex.x || 0, 0, nextVertex.y || 0)
        );
      } else {
        // Arc segment - approximate with multiple line segments
        const arcPoints = createBulgeArc(vertex, nextVertex, bulge);
        points.push(...arcPoints);
      }
    }
  }

  if (points.length === 0) return null;

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  console.log(
    "🔗 Created LWPOLYLINE with",
    points.length,
    "points, closed:",
    entity.closed
  );
  return { geometry, material };
}

function createBulgeArc(p1: any, p2: any, bulge: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  // Calculate arc from bulge value
  const theta = 4 * Math.atan(bulge);
  const chord = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const radius = chord / (2 * Math.sin(Math.abs(theta) / 2));

  // Midpoint of chord
  const midX = (p1.x + p2.x) / 2;
  const midY = (p1.y + p2.y) / 2;

  // Perpendicular direction
  const perpX = -(p2.y - p1.y) / chord;
  const perpY = (p2.x - p1.x) / chord;

  // Center of arc
  const sagitta = radius * (1 - Math.cos(Math.abs(theta) / 2));
  const dir = bulge >= 0 ? 1 : -1;
  const centerX = midX + dir * sagitta * perpX;
  const centerY = midY + dir * sagitta * perpY;

  // Generate arc points
  const segments = Math.max(4, Math.ceil(Math.abs(theta) / (Math.PI / 8))); // More segments for smoother arcs

  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle1 = Math.atan2(p1.y - centerY, p1.x - centerX);
    const angle2 = Math.atan2(p2.y - centerY, p2.x - centerX);

    let angle = angle1 + t * (angle2 - angle1);

    // Handle angle wrapping for bulge direction
    if (bulge > 0 && angle2 < angle1) angle2 += 2 * Math.PI;
    if (bulge < 0 && angle2 > angle1) angle2 -= 2 * Math.PI;

    angle = angle1 + t * (angle2 - angle1);

    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);

    points.push(new THREE.Vector3(x, 0, y));
  }

  return points;
}

function createTextGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.text && !entity.textValue) return null;

  const text = entity.text || entity.textValue || "";
  const position = entity.position || entity.insertionPoint || { x: 0, y: 0 };

  console.log("📝 TEXT found:", text, "at", position);

  // Create a simple point marker for text location
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [
        position.x || 0,
        0.1,
        position.y || 0, // Slightly above ground
      ],
      3
    )
  );

  return {
    geometry,
    material: new THREE.PointsMaterial({ color: 0x0000ff, size: 5 }),
  };
}

function createHatchGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  console.log("🎨 HATCH found:", entity);

  // For now, just mark hatch areas with points
  if (entity.boundaryPaths && entity.boundaryPaths.length > 0) {
    const points: THREE.Vector3[] = [];

    entity.boundaryPaths.forEach((boundary: any) => {
      if (boundary.edges) {
        boundary.edges.forEach((edge: any) => {
          if (edge.vertices) {
            edge.vertices.forEach((vertex: any) => {
              points.push(new THREE.Vector3(vertex.x || 0, 0, vertex.y || 0));
            });
          }
        });
      }
    });

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return {
        geometry,
        material: new THREE.PointsMaterial({ color: 0x00ff00, size: 3 }),
      };
    }
  }

  return null;
}

function createDimensionGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  console.log("📏 DIMENSION found:", entity);

  // Create dimension lines
  const points: THREE.Vector3[] = [];

  if (entity.definingPoint && entity.middleOfText) {
    points.push(
      new THREE.Vector3(
        entity.definingPoint.x || 0,
        0,
        entity.definingPoint.y || 0
      ),
      new THREE.Vector3(
        entity.middleOfText.x || 0,
        0,
        entity.middleOfText.y || 0
      )
    );
  }

  if (points.length > 0) {
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    return {
      geometry,
      material: new THREE.LineBasicMaterial({ color: 0xff00ff }),
    };
  }

  return null;
}

function createInsertGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  console.log("🔗 INSERT block found:", entity.name, "at", entity.position);

  // For now, just mark insert position with a point
  if (entity.position) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(
        [entity.position.x || 0, 0.2, entity.position.y || 0],
        3
      )
    );
    return {
      geometry,
      material: new THREE.PointsMaterial({ color: 0xffa500, size: 8 }),
    };
  }
  return null;
}

function createSolidGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  console.log("🟦 SOLID/TRACE found:", entity);

  // SOLID entities often have corner points
  if (entity.points && entity.points.length >= 3) {
    const points: THREE.Vector3[] = [];

    // Create lines connecting all points
    for (let i = 0; i < entity.points.length; i++) {
      const current = entity.points[i];
      const next = entity.points[(i + 1) % entity.points.length];

      points.push(
        new THREE.Vector3(current.x || 0, 0, current.y || 0),
        new THREE.Vector3(next.x || 0, 0, next.y || 0)
      );
    }

    if (points.length > 0) {
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      return { geometry, material };
    }
  }

  return null;
}

function createPointGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.position) return null;

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [entity.position.x || 0, 0.05, entity.position.y || 0],
      3
    )
  );

  return {
    geometry,
    material: new THREE.PointsMaterial({ color: 0x00ffff, size: 4 }),
  };
}

function createEllipseGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.center || !entity.majorAxisEndPoint) return null;

  const center = entity.center;
  const majorAxis = entity.majorAxisEndPoint;
  const ratio = entity.axisRatio || 1;

  const majorRadius = Math.sqrt(majorAxis.x ** 2 + majorAxis.y ** 2);
  const minorRadius = majorRadius * ratio;
  const rotation = Math.atan2(majorAxis.y, majorAxis.x);

  const points: THREE.Vector3[] = [];
  const segments = 64;

  for (let i = 0; i <= segments; i++) {
    const angle = (i / segments) * Math.PI * 2;
    const x = majorRadius * Math.cos(angle);
    const y = minorRadius * Math.sin(angle);

    // Rotate and translate
    const finalX = center.x + x * Math.cos(rotation) - y * Math.sin(rotation);
    const finalY = center.y + x * Math.sin(rotation) + y * Math.cos(rotation);

    points.push(new THREE.Vector3(finalX, 0, finalY));
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return { geometry, material };
}

function createSplineGeometry(
  entity: any,
  material: THREE.Material
): { geometry: THREE.BufferGeometry; material: THREE.Material } | null {
  if (!entity.controlPoints || entity.controlPoints.length < 2) return null;

  console.log(
    "🌊 SPLINE found with",
    entity.controlPoints.length,
    "control points"
  );

  // Create a simple polyline through control points
  const points: THREE.Vector3[] = [];

  for (let i = 0; i < entity.controlPoints.length - 1; i++) {
    const p1 = entity.controlPoints[i];
    const p2 = entity.controlPoints[i + 1];

    points.push(
      new THREE.Vector3(p1.x || 0, 0, p1.y || 0),
      new THREE.Vector3(p2.x || 0, 0, p2.y || 0)
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  return { geometry, material };
}

function getEntityColor(entity: any): number {
  // Simple color mapping
  if (entity.color && entity.color !== 256) {
    return entity.color;
  }
  return 0x000000; // Default black
}

function calculateSimpleBounds(geometries: THREE.BufferGeometry[]): {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  size: THREE.Vector3;
} {
  const box = new THREE.Box3();

  geometries.forEach((geometry) => {
    geometry.computeBoundingBox();
    if (geometry.boundingBox) {
      box.union(geometry.boundingBox);
    }
  });

  const center = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3());

  return {
    min: box.min.clone(),
    max: box.max.clone(),
    center,
    size,
  };
}
