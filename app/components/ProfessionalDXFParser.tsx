"use client";

import React, { useState, useCallback } from "react";
import * as THREE from "three";

interface ProfessionalDXFParserProps {
  onDXFLoaded: (entities: DXFEntity[]) => void;
}

export interface DXFEntity {
  type: "LINE" | "POLYLINE" | "CIRCLE" | "ARC" | "TEXT" | "LWPOLYLINE";
  points: THREE.Vector3[];
  color: string;
  layer: string;
  radius?: number;
  text?: string;
}

export default function ProfessionalDXFParser({
  onDXFLoaded,
}: ProfessionalDXFParserProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      setIsLoading(true);
      setError(null);

      try {
        console.log("🎯 Professional DXF parsing (like FreeCAD):", file.name);

        // Read file as text
        const text = await file.text();

        // Use professional DXF parser
        const entities = await parseDXFWithLibrary(text);

        console.log(
          `✅ Professional parser extracted ${entities.length} entities`
        );
        onDXFLoaded(entities);
      } catch (err) {
        console.error("❌ Professional DXF parsing failed:", err);
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
      // Create architectural sample like FreeCAD would show
      const sampleEntities: DXFEntity[] = [
        // Main building outline
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 0), new THREE.Vector3(15, 0, 0)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(15, 0, 0), new THREE.Vector3(15, 0, 10)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(15, 0, 10), new THREE.Vector3(0, 0, 10)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 10), new THREE.Vector3(0, 0, 0)],
          color: "#000000",
          layer: "WALLS",
        },
        // Interior walls
        {
          type: "LINE",
          points: [new THREE.Vector3(6, 0, 0), new THREE.Vector3(6, 0, 10)],
          color: "#000000",
          layer: "WALLS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(0, 0, 5), new THREE.Vector3(15, 0, 5)],
          color: "#000000",
          layer: "WALLS",
        },
        // Doors
        {
          type: "LINE",
          points: [new THREE.Vector3(3, 0, 0), new THREE.Vector3(4.5, 0, 0)],
          color: "#FF0000",
          layer: "DOORS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(6, 0, 2), new THREE.Vector3(6, 0, 3.5)],
          color: "#FF0000",
          layer: "DOORS",
        },
        // Windows
        {
          type: "LINE",
          points: [new THREE.Vector3(1, 0, 10), new THREE.Vector3(2.5, 0, 10)],
          color: "#0000FF",
          layer: "WINDOWS",
        },
        {
          type: "LINE",
          points: [new THREE.Vector3(15, 0, 7), new THREE.Vector3(15, 0, 8.5)],
          color: "#0000FF",
          layer: "WINDOWS",
        },
      ];

      console.log("✅ Professional sample architectural plan loaded");
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
      <h3 className="text-lg font-semibold mb-4">🏗️ Professional DXF Parser</h3>
      <p className="text-sm text-gray-600 mb-4">
        Like FreeCAD - Professional DXF parsing with accurate vector rendering
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
          {isLoading ? "Loading..." : "🏠 Professional Sample Plan"}
        </button>

        {error && (
          <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
            Error: {error}
          </div>
        )}

        {isLoading && (
          <div className="text-blue-600 text-sm bg-blue-50 p-2 rounded">
            Parsing with professional DXF library...
          </div>
        )}
      </div>
    </div>
  );
}

// Professional DXF parsing using dxf-parser library
async function parseDXFWithLibrary(dxfContent: string): Promise<DXFEntity[]> {
  try {
    // Dynamic import to avoid SSR issues
    const DxfParser = (await import("dxf-parser")).default;

    console.log("📚 Using professional dxf-parser library");

    // Parse with the library
    const parser = new DxfParser();
    const dxf = parser.parseSync(dxfContent);

    console.log(
      "📊 DXF parsed by library. Entities found:",
      dxf?.entities?.length || 0
    );
    if (dxf?.entities && dxf.entities.length > 0) {
      console.log("📊 Sample entities:", dxf.entities.slice(0, 3));
    } else {
      console.warn("⚠️ No entities found in DXF file");
    }

    const entities: DXFEntity[] = [];

    // Extract entities from the parsed DXF
    if (dxf.entities) {
      // Log all entity types found for debugging
      const entityTypes = new Map<string, number>();
      dxf.entities.forEach((entity: any) => {
        const type = entity.type || "UNKNOWN";
        entityTypes.set(type, (entityTypes.get(type) || 0) + 1);
      });
      console.log(
        "📊 All entity types in DXF:",
        Object.fromEntries(entityTypes)
      );

      dxf.entities.forEach((entity: any) => {
        switch (entity.type) {
          case "LINE":
            if (
              entity.start &&
              entity.end &&
              typeof entity.start.x === "number" &&
              typeof entity.start.y === "number" &&
              typeof entity.end.x === "number" &&
              typeof entity.end.y === "number"
            ) {
              entities.push({
                type: "LINE",
                points: [
                  new THREE.Vector3(entity.start.x, 0, -entity.start.y),
                  new THREE.Vector3(entity.end.x, 0, -entity.end.y),
                ],
                color: getColorFromEntity(entity),
                layer: entity.layer || "0",
              });
            } else {
              console.warn(
                "Skipping LINE entity with invalid coordinates:",
                entity
              );
            }
            break;

          case "LWPOLYLINE":
          case "POLYLINE":
            if (entity.vertices && entity.vertices.length > 0) {
              try {
                const points = entity.vertices
                  .filter(
                    (v: any) =>
                      v && typeof v.x === "number" && typeof v.y === "number"
                  )
                  .map((v: any) => new THREE.Vector3(v.x, 0, -v.y));

                if (points.length >= 2) {
                  // Check if polyline is closed (typical for walls/rooms)
                  const isClosedPolyline =
                    entity.closed ||
                    (points.length > 2 &&
                      points[0].distanceTo(points[points.length - 1]) < 0.01);

                  // If closed, ensure the last point connects to first
                  if (isClosedPolyline && points.length > 2) {
                    const finalPoints = [...points];
                    if (
                      points[0].distanceTo(points[points.length - 1]) > 0.01
                    ) {
                      finalPoints.push(points[0]); // Close the polyline
                    }
                    entities.push({
                      type: "POLYLINE",
                      points: finalPoints,
                      color: getColorFromEntity(entity),
                      layer: entity.layer || "0",
                    });
                  } else {
                    entities.push({
                      type: "POLYLINE",
                      points: points,
                      color: getColorFromEntity(entity),
                      layer: entity.layer || "0",
                    });
                  }
                } else {
                  console.warn(
                    "Skipping POLYLINE with insufficient valid points:",
                    entity
                  );
                }
              } catch (error) {
                console.warn(
                  "Error processing POLYLINE vertices:",
                  error,
                  entity
                );
              }
            }
            break;

          case "CIRCLE":
            if (
              entity.center &&
              typeof entity.center.x === "number" &&
              typeof entity.center.y === "number" &&
              typeof entity.radius === "number" &&
              entity.radius > 0
            ) {
              try {
                // Generate circle points
                const center = new THREE.Vector3(
                  entity.center.x,
                  0,
                  -entity.center.y
                );
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

                entities.push({
                  type: "CIRCLE",
                  points: circlePoints,
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                  radius: radius,
                });
              } catch (error) {
                console.warn("Error processing CIRCLE:", error, entity);
              }
            } else {
              console.warn(
                "Skipping CIRCLE entity with invalid center or radius:",
                entity
              );
            }
            break;

          case "ARC":
            if (
              entity.center &&
              typeof entity.center.x === "number" &&
              typeof entity.center.y === "number" &&
              typeof entity.radius === "number" &&
              entity.radius > 0 &&
              typeof entity.startAngle === "number" &&
              typeof entity.endAngle === "number"
            ) {
              try {
                // Generate arc points
                const arcCenter = new THREE.Vector3(
                  entity.center.x,
                  0,
                  -entity.center.y
                );
                const arcRadius = entity.radius;
                const startAngle = entity.startAngle;
                const endAngle = entity.endAngle;
                const arcSegments = 16;
                const arcPoints: THREE.Vector3[] = [];

                for (let i = 0; i <= arcSegments; i++) {
                  const angle =
                    startAngle + (i / arcSegments) * (endAngle - startAngle);
                  arcPoints.push(
                    new THREE.Vector3(
                      arcCenter.x + Math.cos(angle) * arcRadius,
                      arcCenter.y,
                      arcCenter.z + Math.sin(angle) * arcRadius
                    )
                  );
                }

                entities.push({
                  type: "ARC",
                  points: arcPoints,
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                });
              } catch (error) {
                console.warn("Error processing ARC:", error, entity);
              }
            } else {
              console.warn(
                "Skipping ARC entity with invalid properties:",
                entity
              );
            }
            break;

          case "TEXT":
          case "MTEXT":
            if (
              entity.position &&
              typeof entity.position.x === "number" &&
              typeof entity.position.y === "number"
            ) {
              try {
                entities.push({
                  type: "TEXT",
                  points: [
                    new THREE.Vector3(entity.position.x, 0, -entity.position.y),
                  ],
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                  text: entity.text || "",
                });
              } catch (error) {
                console.warn("Error processing TEXT:", error, entity);
              }
            } else {
              console.warn(
                "Skipping TEXT entity with invalid position:",
                entity
              );
            }
            break;

          case "SPLINE":
            // Handle spline curves (common in architectural drawings)
            if (entity.controlPoints && entity.controlPoints.length >= 2) {
              try {
                const points = entity.controlPoints
                  .filter(
                    (p: any) =>
                      p && typeof p.x === "number" && typeof p.y === "number"
                  )
                  .map((p: any) => new THREE.Vector3(p.x, 0, -p.y));

                if (points.length >= 2) {
                  entities.push({
                    type: "POLYLINE", // Treat as polyline for rendering
                    points: points,
                    color: getColorFromEntity(entity),
                    layer: entity.layer || "0",
                  });
                }
              } catch (error) {
                console.warn("Error processing SPLINE:", error, entity);
              }
            }
            break;

          case "INSERT":
            // Handle block inserts (common for symbols/furniture)
            if (
              entity.position &&
              typeof entity.position.x === "number" &&
              typeof entity.position.y === "number"
            ) {
              try {
                // Render as a simple marker for now
                entities.push({
                  type: "TEXT",
                  points: [
                    new THREE.Vector3(entity.position.x, 0, -entity.position.y),
                  ],
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                  text: entity.name || "BLOCK",
                });
              } catch (error) {
                console.warn("Error processing INSERT:", error, entity);
              }
            }
            break;

          case "HATCH":
            // Handle hatch patterns (common for wall fills, area patterns)
            if (entity.boundary && entity.boundary.length > 0) {
              try {
                entity.boundary.forEach(
                  (boundary: any, boundaryIndex: number) => {
                    if (boundary.edges && boundary.edges.length > 0) {
                      const boundaryPoints: THREE.Vector3[] = [];

                      boundary.edges.forEach((edge: any) => {
                        if (edge.type === "LINE" && edge.start && edge.end) {
                          boundaryPoints.push(
                            new THREE.Vector3(edge.start.x, 0, -edge.start.y)
                          );
                          boundaryPoints.push(
                            new THREE.Vector3(edge.end.x, 0, -edge.end.y)
                          );
                        } else if (edge.vertices) {
                          edge.vertices.forEach((v: any) => {
                            if (
                              v &&
                              typeof v.x === "number" &&
                              typeof v.y === "number"
                            ) {
                              boundaryPoints.push(
                                new THREE.Vector3(v.x, 0, -v.y)
                              );
                            }
                          });
                        }
                      });

                      if (boundaryPoints.length >= 2) {
                        entities.push({
                          type: "POLYLINE",
                          points: boundaryPoints,
                          color: getColorFromEntity(entity),
                          layer: entity.layer || "0",
                        });
                      }
                    }
                  }
                );
              } catch (error) {
                console.warn("Error processing HATCH:", error, entity);
              }
            }
            break;

          case "SOLID":
            // Handle solid fills (common for filled areas)
            if (entity.points && entity.points.length >= 3) {
              try {
                const points = entity.points
                  .filter(
                    (p: any) =>
                      p && typeof p.x === "number" && typeof p.y === "number"
                  )
                  .map((p: any) => new THREE.Vector3(p.x, 0, -p.y));

                if (points.length >= 3) {
                  // Close the solid if not already closed
                  if (points[0].distanceTo(points[points.length - 1]) > 0.01) {
                    points.push(points[0]);
                  }

                  entities.push({
                    type: "POLYLINE",
                    points: points,
                    color: getColorFromEntity(entity),
                    layer: entity.layer || "0",
                  });
                }
              } catch (error) {
                console.warn("Error processing SOLID:", error, entity);
              }
            }
            break;

          case "DIMENSION":
            // Handle dimension lines and text
            if (entity.definitionPoint && entity.middleOfText) {
              try {
                // Render dimension as a line with text
                const defPoint = new THREE.Vector3(
                  entity.definitionPoint.x,
                  0,
                  -entity.definitionPoint.y
                );
                const textPoint = new THREE.Vector3(
                  entity.middleOfText.x,
                  0,
                  -entity.middleOfText.y
                );

                entities.push({
                  type: "LINE",
                  points: [defPoint, textPoint],
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                });

                // Add dimension text
                entities.push({
                  type: "TEXT",
                  points: [textPoint],
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                  text: entity.text || "DIM",
                });
              } catch (error) {
                console.warn("Error processing DIMENSION:", error, entity);
              }
            }
            break;

          case "ELLIPSE":
            // Handle ellipses (sometimes used for curved elements)
            if (
              entity.center &&
              entity.majorAxisEndPoint &&
              typeof entity.axisRatio === "number"
            ) {
              try {
                const center = new THREE.Vector3(
                  entity.center.x,
                  0,
                  -entity.center.y
                );
                const majorAxis = new THREE.Vector3(
                  entity.majorAxisEndPoint.x,
                  0,
                  -entity.majorAxisEndPoint.y
                );
                const majorRadius = majorAxis.length();
                const minorRadius = majorRadius * entity.axisRatio;

                // Generate ellipse points (simplified as circle for now)
                const points: THREE.Vector3[] = [];
                const segments = 32;

                for (let i = 0; i <= segments; i++) {
                  const angle = (i / segments) * Math.PI * 2;
                  points.push(
                    new THREE.Vector3(
                      center.x + Math.cos(angle) * majorRadius,
                      center.y,
                      center.z + Math.sin(angle) * minorRadius
                    )
                  );
                }

                entities.push({
                  type: "POLYLINE",
                  points: points,
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                });
              } catch (error) {
                console.warn("Error processing ELLIPSE:", error, entity);
              }
            }
            break;

          case "POINT":
            // Handle point entities (sometimes used for markers)
            if (
              entity.position &&
              typeof entity.position.x === "number" &&
              typeof entity.position.y === "number"
            ) {
              try {
                entities.push({
                  type: "TEXT",
                  points: [
                    new THREE.Vector3(entity.position.x, 0, -entity.position.y),
                  ],
                  color: getColorFromEntity(entity),
                  layer: entity.layer || "0",
                  text: "•",
                });
              } catch (error) {
                console.warn("Error processing POINT:", error, entity);
              }
            }
            break;

          default:
            // Log unhandled entity types for debugging
            if (entity.type) {
              console.log(
                `📝 Unhandled entity type: ${entity.type} on layer ${
                  entity.layer || "0"
                }`
              );
            }
            break;
        }
      });
    }

    console.log(
      `✅ Successfully processed ${entities.length} valid entities from DXF`
    );

    // Apply architectural improvements
    const improvedEntities = improveArchitecturalRendering(entities);

    // Auto-scale and center the entities
    return scaleAndCenterEntities(improvedEntities);
  } catch (error) {
    console.error("❌ Professional DXF parser failed:", error);
    throw new Error(`Professional DXF parsing failed: ${error}`);
  }
}

// Improve architectural rendering by connecting nearby endpoints
function improveArchitecturalRendering(entities: DXFEntity[]): DXFEntity[] {
  const tolerance = 0.1; // Tolerance for connecting nearby points
  const improvedEntities: DXFEntity[] = [];

  entities.forEach((entity) => {
    if (entity.type === "LINE" && entity.points.length === 2) {
      // Check if this line connects to any other lines
      let connectedStart = false;
      let connectedEnd = false;

      entities.forEach((otherEntity) => {
        if (otherEntity === entity || otherEntity.type !== "LINE") return;

        const [startPoint, endPoint] = entity.points;
        const [otherStart, otherEnd] = otherEntity.points;

        // Check connections within tolerance
        if (
          startPoint.distanceTo(otherStart) < tolerance ||
          startPoint.distanceTo(otherEnd) < tolerance
        ) {
          connectedStart = true;
        }
        if (
          endPoint.distanceTo(otherStart) < tolerance ||
          endPoint.distanceTo(otherEnd) < tolerance
        ) {
          connectedEnd = true;
        }
      });

      // Keep the line as is - the connection logic is handled by the renderer
      improvedEntities.push(entity);
    } else {
      // Keep other entities unchanged
      improvedEntities.push(entity);
    }
  });

  console.log(
    `🔧 Architectural improvements applied to ${entities.length} entities`
  );
  return improvedEntities;
}

// Extract color from DXF entity with architectural layer awareness
function getColorFromEntity(entity: any): string {
  // First check entity-specific color
  if (entity.color !== undefined && entity.color !== null) {
    return getDXFColorByIndex(entity.color);
  }
  if (entity.colorNumber !== undefined) {
    return getDXFColorByIndex(entity.colorNumber);
  }

  // Use layer-based coloring for better architectural visualization
  const layerName = (entity.layer || "0").toLowerCase();

  // Comprehensive architectural layer color mapping
  if (
    layerName.includes("wall") ||
    layerName.includes("partition") ||
    layerName.includes("struct") ||
    layerName.includes("bearing")
  ) {
    return "#000000"; // Black for walls and structure
  }
  if (layerName.includes("door") || layerName.includes("opening")) {
    return "#8B4513"; // Brown for doors and openings
  }
  if (layerName.includes("window") || layerName.includes("glazing")) {
    return "#0066CC"; // Blue for windows
  }
  if (
    layerName.includes("text") ||
    layerName.includes("dimension") ||
    layerName.includes("anno") ||
    layerName.includes("label")
  ) {
    return "#666666"; // Gray for text/annotations
  }
  if (
    layerName.includes("furniture") ||
    layerName.includes("equipment") ||
    layerName.includes("fixture")
  ) {
    return "#8B4513"; // Brown for furniture
  }
  if (
    layerName.includes("electrical") ||
    layerName.includes("power") ||
    layerName.includes("light")
  ) {
    return "#FF6600"; // Orange for electrical
  }
  if (
    layerName.includes("plumbing") ||
    layerName.includes("water") ||
    layerName.includes("drain")
  ) {
    return "#0066FF"; // Blue for plumbing
  }
  if (
    layerName.includes("hatch") ||
    layerName.includes("fill") ||
    layerName.includes("pattern")
  ) {
    return "#CCCCCC"; // Light gray for hatches/fills
  }
  if (
    layerName.includes("center") ||
    layerName.includes("construction") ||
    layerName.includes("guide")
  ) {
    return "#999999"; // Medium gray for construction lines
  }
  if (layerName.includes("defpoints") || layerName.includes("def")) {
    return "#FF0000"; // Red for definition points
  }
  // Check for numbered layers (0, 1, 2, etc.)
  if (layerName === "0") {
    return "#000000"; // Black for default layer
  }

  return "#333333"; // Default dark gray
}

// DXF color mapping
function getDXFColorByIndex(colorIndex: number): string {
  const colors: { [key: number]: string } = {
    0: "#333333", // ByBlock/ByLayer
    1: "#FF0000", // Red
    2: "#FFFF00", // Yellow
    3: "#00FF00", // Green
    4: "#00FFFF", // Cyan
    5: "#0000FF", // Blue
    6: "#FF00FF", // Magenta
    7: "#FFFFFF", // White
    8: "#808080", // Gray
    9: "#C0C0C0", // Light Gray
    10: "#FF0000", // Red
    11: "#FF8080", // Light Red
    12: "#800000", // Dark Red
    13: "#FF8000", // Orange
    14: "#FFFF80", // Light Yellow
    15: "#808000", // Dark Yellow
    250: "#808080", // Gray
    251: "#C0C0C0", // Light Gray
    252: "#E0E0E0", // Very Light Gray
    253: "#F0F0F0", // Almost White
    254: "#FFFFFF", // White
  };

  return colors[colorIndex] || "#666666";
}

// Scale and center entities for proper display
function scaleAndCenterEntities(entities: DXFEntity[]): DXFEntity[] {
  if (entities.length === 0) return entities;

  // Calculate bounds
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

  const sizeX = maxX - minX;
  const sizeZ = maxZ - minZ;
  const maxSize = Math.max(sizeX, sizeZ);

  console.log(
    `📏 Professional DXF bounds: ${sizeX.toFixed(2)} x ${sizeZ.toFixed(2)}`
  );

  // Scale to reasonable size (like FreeCAD viewport)
  let scale = 1;
  const targetSize = 20;

  if (maxSize > targetSize * 2) {
    scale = targetSize / maxSize;
    console.log(`📉 Scaling for viewport: ${scale.toFixed(3)}`);
  } else if (maxSize < 1) {
    scale = targetSize / maxSize;
    console.log(`📈 Scaling for visibility: ${scale.toFixed(3)}`);
  }

  // Center at origin
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
