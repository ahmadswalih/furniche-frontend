"use client";

import React, { useCallback, useState } from "react";
import * as THREE from "three";

export interface DXFEntity {
  id: string;
  type: string;
  layer: string;
  color: string;
  geometry: THREE.BufferGeometry;
  material: THREE.Material;
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  metadata: {
    entityType: string;
    originalData: any;
    bounds?: {
      min: THREE.Vector3;
      max: THREE.Vector3;
    };
  };
}

export interface DXFFloorPlan {
  id: string;
  name: string;
  entities: DXFEntity[];
  layers: {
    [key: string]: { color: string; visible: boolean; entities: DXFEntity[] };
  };
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    size: THREE.Vector3;
  };
  scale: number;
  units: string;
  metadata: {
    fileName: string;
    totalEntities: number;
    layerCount: number;
    importTime: number;
  };
}

interface ComprehensiveDXFImporterProps {
  onImportComplete: (floorPlan: DXFFloorPlan) => void;
}

export default function ComprehensiveDXFImporter({
  onImportComplete,
}: ComprehensiveDXFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<string>("");

  const handleDXFFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      setProgress(0);
      setStatus("Loading DXF file...");

      try {
        console.log("🏗️ Starting comprehensive DXF import:", file.name);

        // Read file content
        const text = await file.text();
        setProgress(10);
        setStatus("Parsing DXF content...");

        // Parse DXF using dxf-parser (most reliable parser)
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        console.log("📐 DXF Parsed Successfully:", {
          entities: dxf.entities?.length || 0,
          tables: dxf.tables ? Object.keys(dxf.tables) : [],
          header: dxf.header,
          blocks: dxf.blocks ? Object.keys(dxf.blocks) : [],
        });

        if (!dxf || !dxf.entities || dxf.entities.length === 0) {
          throw new Error("No entities found in DXF file");
        }

        setProgress(20);
        setStatus(`Processing ${dxf.entities.length} entities...`);

        // Determine scale factor from DXF units
        const scaleFactor = getDXFScaleFactor(dxf);
        console.log("📏 Using scale factor:", scaleFactor);

        // Create comprehensive entity processor
        const entityProcessor = new DXFEntityProcessor(dxf, scaleFactor);

        setProgress(30);
        setStatus("Creating 3D geometries...");

        // Process all entities with comprehensive support
        const entities: DXFEntity[] = [];
        const layers: {
          [key: string]: {
            color: string;
            visible: boolean;
            entities: DXFEntity[];
          };
        } = {};

        let processedCount = 0;
        const totalEntities = dxf.entities.length;

        for (const entity of dxf.entities) {
          try {
            const processedEntity = entityProcessor.processEntity(
              entity,
              processedCount
            );
            if (processedEntity) {
              entities.push(processedEntity);

              // Organize by layers
              const layerName = processedEntity.layer;
              if (!layers[layerName]) {
                layers[layerName] = {
                  color: processedEntity.color,
                  visible: true,
                  entities: [],
                };
              }
              layers[layerName].entities.push(processedEntity);
            }
          } catch (error) {
            console.warn(
              `⚠️ Failed to process entity ${processedCount}:`,
              error
            );
          }

          processedCount++;
          if (processedCount % 10 === 0) {
            setProgress(30 + (processedCount / totalEntities) * 40);
            setStatus(
              `Processed ${processedCount}/${totalEntities} entities...`
            );
          }
        }

        setProgress(70);
        setStatus("Calculating bounds and optimizing...");

        // Calculate overall bounds
        const bounds = calculateFloorPlanBounds(entities);

        setProgress(90);
        setStatus("Finalizing floor plan...");

        // Create the complete floor plan object
        const floorPlan: DXFFloorPlan = {
          id: `dxf-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          entities,
          layers,
          bounds,
          scale: scaleFactor,
          units: getUnitsName(dxf),
          metadata: {
            fileName: file.name,
            totalEntities: entities.length,
            layerCount: Object.keys(layers).length,
            importTime: Date.now(),
          },
        };

        console.log("✅ DXF Floor Plan Import Complete:", {
          entities: entities.length,
          layers: Object.keys(layers).length,
          bounds: bounds,
          scale: scaleFactor,
        });

        setProgress(100);
        setStatus("Import complete!");

        onImportComplete(floorPlan);
      } catch (error) {
        console.error("❌ DXF Import Failed:", error);
        setStatus(
          `Import failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsProcessing(false);
        setTimeout(() => {
          setProgress(0);
          setStatus("");
        }, 2000);
      }
    },
    [onImportComplete]
  );

  return (
    <div className="space-y-4">
      <div className="text-center">
        <label className="block">
          <input
            type="file"
            accept=".dxf"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleDXFFile(file);
            }}
            className="hidden"
            disabled={isProcessing}
          />
          <div
            className={`px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isProcessing
                ? "border-blue-300 bg-blue-50 cursor-not-allowed"
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">🏗️</div>
              <div className="text-lg font-semibold text-gray-700">
                {isProcessing
                  ? "Processing DXF..."
                  : "Import Architectural DXF"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Complete floor plan import with all entities
              </div>
            </div>
          </div>
        </label>
      </div>

      {isProcessing && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="text-sm text-center text-gray-600">{status}</div>
        </div>
      )}
    </div>
  );
}

// Comprehensive DXF Entity Processor
class DXFEntityProcessor {
  private dxf: any;
  private scaleFactor: number;
  private blocks: { [key: string]: any } = {};

  constructor(dxf: any, scaleFactor: number) {
    this.dxf = dxf;
    this.scaleFactor = scaleFactor;

    // Process blocks for INSERT entities
    if (dxf.blocks) {
      this.blocks = dxf.blocks;
    }
  }

  processEntity(entity: any, index: number): DXFEntity | null {
    const entityId = `dxf-entity-${index}-${Date.now()}`;
    const layerName = entity.layer || "0";
    const color = this.getEntityColor(entity, layerName);

    console.log(`🔧 Processing ${entity.type} entity:`, entity);

    try {
      switch (entity.type) {
        case "LINE":
          return this.createLineEntity(entity, entityId, color, layerName);

        case "CIRCLE":
          return this.createCircleEntity(entity, entityId, color, layerName);

        case "ARC":
          return this.createArcEntity(entity, entityId, color, layerName);

        case "LWPOLYLINE":
        case "POLYLINE":
          return this.createPolylineEntity(entity, entityId, color, layerName);

        case "ELLIPSE":
          return this.createEllipseEntity(entity, entityId, color, layerName);

        case "SPLINE":
          return this.createSplineEntity(entity, entityId, color, layerName);

        case "TEXT":
        case "MTEXT":
          return this.createTextEntity(entity, entityId, color, layerName);

        case "DIMENSION":
          return this.createDimensionEntity(entity, entityId, color, layerName);

        case "HATCH":
          return this.createHatchEntity(entity, entityId, color, layerName);

        case "SOLID":
        case "3DFACE":
          return this.createSolidEntity(entity, entityId, color, layerName);

        case "INSERT":
          return this.createInsertEntity(entity, entityId, color, layerName);

        case "POINT":
          return this.createPointEntity(entity, entityId, color, layerName);

        case "RECTANGLE":
          return this.createRectangleEntity(entity, entityId, color, layerName);

        default:
          console.warn(`⚠️ Unsupported entity type: ${entity.type}`);
          return this.createDefaultEntity(entity, entityId, color, layerName);
      }
    } catch (error) {
      console.error(`❌ Failed to create ${entity.type} entity:`, error);
      return null;
    }
  }

  private createLineEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    const start = entity.vertices?.[0] || entity.start || { x: 0, y: 0, z: 0 };
    const end = entity.vertices?.[1] || entity.end || { x: 1, y: 0, z: 0 };

    const startPoint = new THREE.Vector3(
      start.x * this.scaleFactor,
      start.z * this.scaleFactor,
      start.y * this.scaleFactor
    );
    const endPoint = new THREE.Vector3(
      end.x * this.scaleFactor,
      end.z * this.scaleFactor,
      end.y * this.scaleFactor
    );

    const direction = new THREE.Vector3().subVectors(endPoint, startPoint);
    const length = direction.length();
    const center = new THREE.Vector3()
      .addVectors(startPoint, endPoint)
      .multiplyScalar(0.5);

    // Create tube geometry for better visibility
    const curve = new THREE.LineCurve3(startPoint, endPoint);
    const geometry = new THREE.TubeGeometry(curve, 2, 0.01, 8, false);
    const material = new THREE.MeshBasicMaterial({ color });

    return {
      id,
      type: "line",
      layer,
      color,
      geometry,
      material,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: "LINE",
        originalData: entity,
        bounds: {
          min: new THREE.Vector3().copy(startPoint).min(endPoint),
          max: new THREE.Vector3().copy(startPoint).max(endPoint),
        },
      },
    };
  }

  private createCircleEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    const center = entity.center || { x: 0, y: 0, z: 0 };
    const radius = (entity.radius || 1) * this.scaleFactor;

    const geometry = new THREE.RingGeometry(
      radius * 0.95,
      radius,
      0,
      Math.PI * 2,
      32
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      side: THREE.DoubleSide,
    });

    return {
      id,
      type: "circle",
      layer,
      color,
      geometry,
      material,
      position: [
        center.x * this.scaleFactor,
        center.z * this.scaleFactor,
        center.y * this.scaleFactor,
      ],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: "CIRCLE",
        originalData: entity,
      },
    };
  }

  private createPolylineEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    const vertices = entity.vertices || [];
    if (vertices.length < 2) {
      throw new Error("Polyline must have at least 2 vertices");
    }

    const points: THREE.Vector3[] = vertices.map(
      (v: any) =>
        new THREE.Vector3(
          v.x * this.scaleFactor,
          v.z * this.scaleFactor,
          v.y * this.scaleFactor
        )
    );

    // If closed, add first point to end
    if (entity.closed && points.length > 2) {
      points.push(points[0].clone());
    }

    // Create shape or line geometry
    let geometry: THREE.BufferGeometry;
    let material: THREE.Material;

    if (entity.closed && points.length > 3) {
      // Create filled shape for closed polylines
      const shape = new THREE.Shape();
      shape.moveTo(points[0].x, points[0].z);
      for (let i = 1; i < points.length - 1; i++) {
        shape.lineTo(points[i].x, points[i].z);
      }

      geometry = new THREE.ShapeGeometry(shape);
      material = new THREE.MeshBasicMaterial({
        color,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.7,
      });
    } else {
      // Create line for open polylines
      const curve = new THREE.CatmullRomCurve3(points, false);
      geometry = new THREE.TubeGeometry(
        curve,
        points.length * 2,
        0.01,
        8,
        false
      );
      material = new THREE.MeshBasicMaterial({ color });
    }

    return {
      id,
      type: "polyline",
      layer,
      color,
      geometry,
      material,
      position: [0, 0, 0],
      rotation: entity.closed ? [-Math.PI / 2, 0, 0] : [0, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: entity.type,
        originalData: entity,
      },
    };
  }

  private createTextEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    const text = entity.text || entity.contents || "[TEXT]";
    const position = entity.startPoint ||
      entity.position || { x: 0, y: 0, z: 0 };
    const height = (entity.height || 1) * this.scaleFactor;

    // Create a simple plane to represent text
    const geometry = new THREE.PlaneGeometry(
      text.length * height * 0.6,
      height
    );
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.8,
      side: THREE.DoubleSide,
    });

    return {
      id,
      type: "text",
      layer,
      color,
      geometry,
      material,
      position: [
        position.x * this.scaleFactor,
        position.z * this.scaleFactor,
        position.y * this.scaleFactor,
      ],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: entity.type,
        originalData: entity,
      },
    };
  }

  private createHatchEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    // Hatch entities represent filled areas - create a simple filled shape
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      color,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
    });

    return {
      id,
      type: "hatch",
      layer,
      color,
      geometry,
      material,
      position: [0, 0, 0],
      rotation: [-Math.PI / 2, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: "HATCH",
        originalData: entity,
      },
    };
  }

  private createDefaultEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    // Fallback for unknown entity types - create a small marker
    const geometry = new THREE.SphereGeometry(0.1, 8, 6);
    const material = new THREE.MeshBasicMaterial({ color });

    return {
      id,
      type: "unknown",
      layer,
      color,
      geometry,
      material,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      metadata: {
        entityType: entity.type || "UNKNOWN",
        originalData: entity,
      },
    };
  }

  // Additional entity creation methods would go here...
  private createArcEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createEllipseEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createSplineEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createDimensionEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createSolidEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createInsertEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createPointEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private createRectangleEntity(
    entity: any,
    id: string,
    color: string,
    layer: string
  ): DXFEntity {
    return this.createDefaultEntity(entity, id, color, layer);
  }

  private getEntityColor(entity: any, layerName: string): string {
    // Try entity color first
    if (entity.color && entity.color !== 256) {
      return convertDXFColorToHex(entity.color);
    }

    // Get layer color
    if (this.dxf.tables?.layer?.layers?.[layerName]?.color) {
      return convertDXFColorToHex(
        this.dxf.tables.layer.layers[layerName].color
      );
    }

    // Default color based on layer name
    const layerColors: { [key: string]: string } = {
      "0": "#ffffff",
      walls: "#8b4513",
      doors: "#654321",
      windows: "#87ceeb",
      dimensions: "#ff0000",
      text: "#000000",
      hatch: "#90ee90",
    };

    return layerColors[layerName.toLowerCase()] || "#6b7280";
  }
}

// Helper functions
function getDXFScaleFactor(dxf: any): number {
  const units = dxf.header?.$INSUNITS;

  switch (units) {
    case 1:
      return 0.0254; // Inches to meters
    case 2:
      return 0.3048; // Feet to meters
    case 4:
      return 0.001; // Millimeters to meters
    case 5:
      return 0.01; // Centimeters to meters
    case 6:
      return 1; // Meters
    default:
      return 0.01; // Default to centimeters
  }
}

function getUnitsName(dxf: any): string {
  const units = dxf.header?.$INSUNITS;

  switch (units) {
    case 1:
      return "inches";
    case 2:
      return "feet";
    case 4:
      return "millimeters";
    case 5:
      return "centimeters";
    case 6:
      return "meters";
    default:
      return "units";
  }
}

function calculateFloorPlanBounds(entities: DXFEntity[]): {
  min: THREE.Vector3;
  max: THREE.Vector3;
  center: THREE.Vector3;
  size: THREE.Vector3;
} {
  if (entities.length === 0) {
    return {
      min: new THREE.Vector3(0, 0, 0),
      max: new THREE.Vector3(0, 0, 0),
      center: new THREE.Vector3(0, 0, 0),
      size: new THREE.Vector3(0, 0, 0),
    };
  }

  const min = new THREE.Vector3(Infinity, Infinity, Infinity);
  const max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);

  entities.forEach((entity) => {
    if (entity.metadata.bounds) {
      min.min(entity.metadata.bounds.min);
      max.max(entity.metadata.bounds.max);
    } else {
      // Use entity position as fallback
      const pos = new THREE.Vector3(...entity.position);
      min.min(pos);
      max.max(pos);
    }
  });

  const center = new THREE.Vector3().addVectors(min, max).multiplyScalar(0.5);
  const size = new THREE.Vector3().subVectors(max, min);

  return { min, max, center, size };
}

function convertDXFColorToHex(dxfColor: number): string {
  const colors = [
    "#000000",
    "#ff0000",
    "#ffff00",
    "#00ff00",
    "#00ffff",
    "#0000ff",
    "#ff00ff",
    "#ffffff",
    "#414141",
    "#808080",
    "#ff0000",
    "#ffaaaa",
    "#bd0000",
    "#bd7e7e",
    "#810000",
    "#815656",
  ];

  if (dxfColor >= 0 && dxfColor < colors.length) {
    return colors[dxfColor];
  }

  return "#6b7280";
}
