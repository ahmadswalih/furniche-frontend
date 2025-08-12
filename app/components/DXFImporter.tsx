"use client";

import { useCallback } from "react";
import * as THREE from "three";

interface DXFImporterProps {
  onImportComplete: (objects: any[]) => void;
}

interface DXFObject {
  id: string;
  type: string;
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color: string;
  layer?: string;
  // Specific properties for different types
  start?: [number, number, number];
  end?: [number, number, number];
  center?: [number, number, number];
  radius?: number;
  width?: number;
  height?: number;
  points?: THREE.Vector2[];
  startAngle?: number;
  endAngle?: number;
  depth?: number;
  closed?: boolean;
}

export default function DXFImporter({ onImportComplete }: DXFImporterProps) {
  const handleDXFFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        console.log("📐 DXF File Parsed:", dxf);

        const importedObjects: DXFObject[] = [];
        const importId = Date.now(); // Unique timestamp for this import
        let entityIndex = 0;

        // Get scaling factor based on DXF units (default to 1 if not specified)
        const scaleFactor = getDXFScaleFactor(dxf);
        console.log("📏 DXF Scale Factor:", scaleFactor);

        if (dxf.entities) {
          dxf.entities.forEach((entity: any) => {
            console.log(`🔍 Processing entity:`, {
              type: entity.type,
              data: entity,
            });

            const layerName = entity.layer || "0";
            const entityColor = getEntityColor(entity, dxf, layerName);

            switch (entity.type) {
              case "LINE":
                importedObjects.push(
                  createLineObject(
                    entity,
                    entityIndex++,
                    entityColor,
                    layerName,
                    scaleFactor,
                    importId
                  )
                );
                break;

              case "CIRCLE":
                importedObjects.push(
                  createCircleObject(
                    entity,
                    entityIndex++,
                    entityColor,
                    layerName,
                    scaleFactor,
                    importId
                  )
                );
                break;

              case "ARC":
                importedObjects.push(
                  createArcObject(
                    entity,
                    entityIndex++,
                    entityColor,
                    layerName,
                    scaleFactor,
                    importId
                  )
                );
                break;

              case "LWPOLYLINE":
              case "POLYLINE":
                const polylineObj = createPolylineObject(
                  entity,
                  entityIndex++,
                  entityColor,
                  layerName,
                  scaleFactor,
                  importId
                );
                if (polylineObj) importedObjects.push(polylineObj);
                break;

              case "RECTANGLE":
              case "SOLID":
                const rectObj = createRectangleObject(
                  entity,
                  entityIndex++,
                  entityColor,
                  layerName,
                  scaleFactor,
                  importId
                );
                if (rectObj) importedObjects.push(rectObj);
                break;

              case "ELLIPSE":
                importedObjects.push(
                  createEllipseObject(
                    entity,
                    entityIndex++,
                    entityColor,
                    layerName,
                    scaleFactor,
                    importId
                  )
                );
                break;

              case "SPLINE":
                const splineObj = createSplineObject(
                  entity,
                  entityIndex++,
                  entityColor,
                  layerName,
                  scaleFactor,
                  importId
                );
                if (splineObj) importedObjects.push(splineObj);
                break;

              case "TEXT":
              case "MTEXT":
                const textObj = createTextObject(
                  entity,
                  entityIndex++,
                  entityColor,
                  layerName,
                  scaleFactor,
                  importId
                );
                if (textObj) importedObjects.push(textObj);
                break;

              case "POINT":
                importedObjects.push(
                  createPointObject(
                    entity,
                    entityIndex++,
                    entityColor,
                    layerName,
                    scaleFactor,
                    importId
                  )
                );
                break;

              default:
                console.log(`⚠️ Unsupported DXF entity type: ${entity.type}`);
                break;
            }
          });
        }

        console.log(
          `✅ Successfully imported ${importedObjects.length} DXF entities`
        );
        onImportComplete(importedObjects);
      } catch (error) {
        console.error("❌ Error parsing DXF file:", error);
        alert(
          `Error importing DXF file: ${
            error instanceof Error ? error.message : "Unknown error"
          }. Please check the file format.`
        );
      }
    },
    [onImportComplete]
  );

  return { handleDXFFile };
}

// Helper functions for creating different DXF objects

function getDXFScaleFactor(dxf: any): number {
  // Check for units in the header section
  const units = dxf.header?.$INSUNITS;

  // DXF unit codes: 1=Inches, 2=Feet, 4=Millimeters, 5=Centimeters, 6=Meters
  switch (units) {
    case 1:
      return 25.4; // Inches to mm
    case 2:
      return 304.8; // Feet to mm
    case 4:
      return 1; // Millimeters
    case 5:
      return 10; // Centimeters to mm
    case 6:
      return 1000; // Meters to mm
    default:
      return 1; // Default scale
  }
}

function getEntityColor(entity: any, dxf: any, layerName: string): string {
  // Try to get color from entity first, then from layer
  if (entity.color && entity.color !== 256) {
    return convertDXFColorToHex(entity.color);
  }

  // Get color from layer
  if (dxf.tables && dxf.tables.layer && dxf.tables.layer.layers[layerName]) {
    const layer = dxf.tables.layer.layers[layerName];
    if (layer.color) {
      return convertDXFColorToHex(layer.color);
    }
  }

  // Default colors based on entity type
  const colorMap: { [key: string]: string } = {
    LINE: "#4ade80",
    CIRCLE: "#3b82f6",
    ARC: "#ef4444",
    LWPOLYLINE: "#f59e0b",
    POLYLINE: "#f59e0b",
    RECTANGLE: "#8b5cf6",
    ELLIPSE: "#06b6d4",
    SPLINE: "#ec4899",
    TEXT: "#64748b",
    POINT: "#10b981",
  };

  return colorMap[entity.type] || "#6b7280";
}

function convertDXFColorToHex(dxfColor: number): string {
  // Basic DXF color to hex conversion (simplified)
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

  return "#6b7280"; // Default gray
}

function createLineObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject {
  // According to dxf-parser docs, LINE entities use vertices array OR start/end points
  let startPoint, endPoint;

  if (entity.vertices && entity.vertices.length >= 2) {
    // Use vertices array (common format)
    startPoint = entity.vertices[0];
    endPoint = entity.vertices[1];
  } else {
    // Fallback to start/end properties
    startPoint = entity.start || { x: 0, y: 0, z: 0 };
    endPoint = entity.end || { x: 1, y: 1, z: 0 };
  }

  console.log(`📏 Creating line:`, {
    hasVertices: !!entity.vertices,
    verticesCount: entity.vertices?.length || 0,
    startPoint,
    endPoint,
    entity,
  });

  return {
    id: `dxf-line-${importId}-${index}`,
    type: "line",
    start: [(startPoint.x || 0) * scale, 0, (startPoint.y || 0) * scale],
    end: [(endPoint.x || 0) * scale, 0, (endPoint.y || 0) * scale],
    color,
    layer,
  };
}

function createCircleObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject {
  console.log(`🔵 Creating circle:`, {
    center: entity.center,
    radius: entity.radius,
    entity,
  });

  return {
    id: `dxf-circle-${importId}-${index}`,
    type: "circle",
    center: [
      (entity.center?.x || 0) * scale,
      0,
      (entity.center?.y || 0) * scale,
    ],
    radius: (entity.radius || 1) * scale,
    color,
    layer,
  };
}

function createArcObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject {
  return {
    id: `dxf-arc-${importId}-${index}`,
    type: "arc",
    center: [
      (entity.center?.x || 0) * scale,
      0,
      (entity.center?.y || 0) * scale,
    ],
    radius: (entity.radius || 1) * scale,
    startAngle: entity.startAngle || 0,
    endAngle: entity.endAngle || Math.PI * 2,
    color,
    layer,
  };
}

function createPolylineObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points = entity.vertices.map(
    (v: any) => new THREE.Vector2((v.x || 0) * scale, (v.y || 0) * scale)
  );

  return {
    id: `dxf-polyline-${importId}-${index}`,
    type: "polyline",
    points,
    closed: entity.closed || false,
    depth: 0.1, // Thin extrusion for visualization
    color,
    layer,
  };
}

function createRectangleObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject | null {
  // For SOLID entities, try to interpret as rectangles
  if (entity.points && entity.points.length >= 4) {
    const points = entity.points
      .slice(0, 4)
      .map(
        (p: any) => new THREE.Vector2((p.x || 0) * scale, (p.y || 0) * scale)
      );

    return {
      id: `dxf-rectangle-${importId}-${index}`,
      type: "polyline",
      points,
      closed: true,
      depth: 0.1,
      color,
      layer,
    };
  }

  return null;
}

function createEllipseObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject {
  return {
    id: `dxf-ellipse-${importId}-${index}`,
    type: "ellipse",
    center: [
      (entity.center?.x || 0) * scale,
      0,
      (entity.center?.y || 0) * scale,
    ],
    radius: (entity.majorAxisEndPoint?.x || 1) * scale, // Simplified - using major axis as radius
    color,
    layer,
  };
}

function createSplineObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject | null {
  if (!entity.controlPoints || entity.controlPoints.length < 2) return null;

  const points = entity.controlPoints.map(
    (p: any) => new THREE.Vector2((p.x || 0) * scale, (p.y || 0) * scale)
  );

  return {
    id: `dxf-spline-${importId}-${index}`,
    type: "spline",
    points,
    closed: false,
    color,
    layer,
  };
}

function createTextObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject | null {
  if (!entity.text) return null;

  return {
    id: `dxf-text-${importId}-${index}`,
    type: "text",
    position: [
      (entity.startPoint?.x || 0) * scale,
      0,
      (entity.startPoint?.y || 0) * scale,
    ],
    color,
    layer,
  };
}

function createPointObject(
  entity: any,
  index: number,
  color: string,
  layer: string,
  scale: number,
  importId: number
): DXFObject {
  return {
    id: `dxf-point-${importId}-${index}`,
    type: "point",
    position: [
      (entity.position?.x || 0) * scale,
      0,
      (entity.position?.y || 0) * scale,
    ],
    color,
    layer,
  };
}
