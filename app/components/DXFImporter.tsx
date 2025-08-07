"use client";

import { useCallback } from "react";
import * as THREE from "three";

interface DXFImporterProps {
  onImportComplete: (objects: any[]) => void;
}

export default function DXFImporter({ onImportComplete }: DXFImporterProps) {
  const handleDXFFile = useCallback(
    async (file: File) => {
      try {
        const text = await file.text();
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        const importedObjects: any[] = [];

        if (dxf.entities) {
          dxf.entities.forEach((entity: any, index: number) => {
            switch (entity.type) {
              case "LINE":
                importedObjects.push({
                  id: `dxf-line-${index}`,
                  type: "line",
                  start: [
                    entity.vertices[0].x || 0,
                    0,
                    entity.vertices[0].y || 0,
                  ],
                  end: [
                    entity.vertices[1].x || 0,
                    0,
                    entity.vertices[1].y || 0,
                  ],
                  color: "#4ade80",
                });
                break;

              case "CIRCLE":
                importedObjects.push({
                  id: `dxf-circle-${index}`,
                  type: "cylinder",
                  position: [entity.center.x || 0, 0, entity.center.y || 0],
                  rotation: [Math.PI / 2, 0, 0],
                  scale: [entity.radius || 1, 0.1, entity.radius || 1],
                  color: "#3b82f6",
                });
                break;

              case "LWPOLYLINE":
              case "POLYLINE":
                if (entity.vertices && entity.vertices.length > 2) {
                  const points = entity.vertices.map(
                    (v: any) => new THREE.Vector2(v.x || 0, v.y || 0)
                  );
                  importedObjects.push({
                    id: `dxf-polyline-${index}`,
                    type: "extruded",
                    points: points,
                    depth: 0.5,
                    color: "#f59e0b",
                  });
                }
                break;

              case "ARC":
                importedObjects.push({
                  id: `dxf-arc-${index}`,
                  type: "curve",
                  center: [
                    entity.center.x || 0,
                    entity.center.z || 0,
                    entity.center.y || 0,
                  ],
                  radius: entity.radius || 1,
                  startAngle: entity.startAngle || 0,
                  endAngle: entity.endAngle || Math.PI * 2,
                  color: "#ef4444",
                });
                break;

              default:
                console.log("Unsupported DXF entity type:", entity.type);
            }
          });
        }

        onImportComplete(importedObjects);
      } catch (error) {
        console.error("Error parsing DXF file:", error);
        alert("Error importing DXF file. Please check the file format.");
      }
    },
    [onImportComplete]
  );

  return { handleDXFFile };
}
