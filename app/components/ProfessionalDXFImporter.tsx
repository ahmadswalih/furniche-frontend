"use client";

import React, { useCallback, useState } from "react";
import * as THREE from "three";
import { FontLoader } from "three/examples/jsm/loaders/FontLoader";

// Professional DXF import using three-dxf approach
export interface ProfessionalDXFObject {
  id: string;
  type: "professional_dxf";
  mesh: THREE.Group;
  layers: string[];
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

interface ProfessionalDXFImporterProps {
  onImportComplete: (objects: ProfessionalDXFObject[]) => void;
}

export default function ProfessionalDXFImporter({
  onImportComplete,
}: ProfessionalDXFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDXFFile = useCallback(
    async (file: File) => {
      setIsProcessing(true);
      console.log("🎯 Professional DXF Import starting:", file.name);

      try {
        const text = await file.text();

        // Import DXF parser
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        if (!dxf || !dxf.entities) {
          throw new Error("Invalid DXF file");
        }

        console.log("📊 DXF parsed successfully:", {
          entities: dxf.entities.length,
          layers: Object.keys(dxf.tables?.layer?.layers || {}),
          units: dxf.header?.$INSUNITS,
        });

        // Create the main group for all entities
        const group = new THREE.Group();
        const layers = new Set<string>();
        let entityCount = 0;

        // Process each entity with professional approach
        dxf.entities.forEach((entity: any) => {
          const layer = entity.layer || "0";
          layers.add(layer);

          const entityGroup = createEntityMesh(entity, dxf);
          if (entityGroup) {
            entityGroup.userData = { layer, entityType: entity.type };
            group.add(entityGroup);
            entityCount++;
          }
        });

        // Calculate bounds
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Center the group
        group.position.sub(center);
        group.position.y = 0; // Keep on ground

        // Create professional DXF object
        const professionalDXF: ProfessionalDXFObject = {
          id: `professional-dxf-${Date.now()}`,
          type: "professional_dxf",
          mesh: group,
          layers: Array.from(layers),
          bounds: {
            min: box.min,
            max: box.max,
            center,
            size,
          },
          metadata: {
            fileName: file.name,
            entityCount,
            importTime: Date.now(),
          },
        };

        console.log("✅ Professional DXF import complete:", professionalDXF);
        onImportComplete([professionalDXF]);
      } catch (error) {
        console.error("❌ Professional DXF import failed:", error);
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
          id="professional-dxf-input"
          disabled={isProcessing}
        />
        <label
          htmlFor="professional-dxf-input"
          className={`cursor-pointer inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-lg font-medium rounded-md ${
            isProcessing
              ? "bg-gray-300 text-gray-500 cursor-not-allowed"
              : "bg-purple-600 text-white hover:bg-purple-700"
          }`}
        >
          <span>🎯</span>
          <span>
            {isProcessing ? "Processing..." : "Professional DXF Import"}
          </span>
        </label>
      </div>
    </div>
  );
}

// Professional entity creation based on three-dxf approach
function createEntityMesh(entity: any, dxf: any): THREE.Object3D | null {
  const color = getEntityColor(entity, dxf);

  switch (entity.type) {
    case "LINE":
      return createLine(entity, color);

    case "LWPOLYLINE":
      return createLWPolyline(entity, color);

    case "POLYLINE":
      return createPolyline(entity, color);

    case "CIRCLE":
      return createCircle(entity, color);

    case "ARC":
      return createArc(entity, color);

    case "TEXT":
    case "MTEXT":
      return createText(entity, color);

    case "INSERT":
      return createInsert(entity, dxf, color);

    case "DIMENSION":
      return createDimension(entity, color);

    case "SOLID":
    case "3DFACE":
      return createSolid(entity, color);

    case "POINT":
      return createPoint(entity, color);

    case "ELLIPSE":
      return createEllipse(entity, color);

    case "SPLINE":
      return createSpline(entity, color);

    default:
      console.log(`Unsupported entity: ${entity.type}`);
      return null;
  }
}

function createLine(entity: any, color: number): THREE.Line | null {
  const geometry = new THREE.BufferGeometry();

  const start = entity.vertices?.[0] || entity.start || { x: 0, y: 0, z: 0 };
  const end = entity.vertices?.[1] || entity.end || { x: 0, y: 0, z: 0 };

  const points = [
    new THREE.Vector3(start.x || 0, start.z || 0, -(start.y || 0)),
    new THREE.Vector3(end.x || 0, end.z || 0, -(end.y || 0)),
  ];

  geometry.setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function createLWPolyline(entity: any, color: number): THREE.Line | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points: THREE.Vector3[] = [];

  // Handle vertices with bulge (arc segments)
  for (let i = 0; i < entity.vertices.length; i++) {
    const vertex = entity.vertices[i];
    const nextVertex =
      entity.vertices[i + 1] || (entity.closed ? entity.vertices[0] : null);

    points.push(
      new THREE.Vector3(vertex.x || 0, vertex.z || 0, -(vertex.y || 0))
    );

    if (nextVertex && vertex.bulge && Math.abs(vertex.bulge) > 1e-6) {
      // Add arc points
      const arcPoints = bulgeToArc(vertex, nextVertex, vertex.bulge);
      points.push(...arcPoints);
    }
  }

  if (entity.closed && entity.vertices.length > 2) {
    points.push(
      new THREE.Vector3(
        entity.vertices[0].x || 0,
        entity.vertices[0].z || 0,
        -(entity.vertices[0].y || 0)
      )
    );
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function bulgeToArc(p1: any, p2: any, bulge: number): THREE.Vector3[] {
  const points: THREE.Vector3[] = [];

  const chord = Math.sqrt((p2.x - p1.x) ** 2 + (p2.y - p1.y) ** 2);
  const sagitta = (bulge * chord) / 2;
  const radius = ((chord / 2) ** 2 + sagitta ** 2) / (2 * sagitta);

  const segments = Math.max(
    4,
    Math.ceil(Math.abs(4 * Math.atan(bulge)) / (Math.PI / 8))
  );

  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    // Interpolate arc point
    const angle = 4 * Math.atan(bulge) * t;

    // Calculate point on arc
    const x = p1.x + (p2.x - p1.x) * t;
    const y = p1.y + (p2.y - p1.y) * t;

    // Apply bulge offset
    const offset = radius * (1 - Math.cos(angle));
    const perpX = -(p2.y - p1.y) / chord;
    const perpY = (p2.x - p1.x) / chord;

    const arcX = x + perpX * offset * Math.sign(bulge);
    const arcY = y + perpY * offset * Math.sign(bulge);

    points.push(new THREE.Vector3(arcX, p1.z || 0, -arcY));
  }

  return points;
}

function createPolyline(entity: any, color: number): THREE.Line | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points = entity.vertices.map(
    (v: any) => new THREE.Vector3(v.x || 0, v.z || 0, -(v.y || 0))
  );

  if (entity.closed) {
    points.push(points[0].clone());
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function createCircle(entity: any, color: number): THREE.Line | null {
  const radius = entity.radius || 1;
  const center = entity.center || { x: 0, y: 0, z: 0 };

  const curve = new THREE.EllipseCurve(
    center.x,
    -center.y,
    radius,
    radius,
    0,
    2 * Math.PI,
    false,
    0
  );

  const points = curve.getPoints(32);
  const points3D = points.map(
    (p) => new THREE.Vector3(p.x, center.z || 0, p.y)
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function createArc(entity: any, color: number): THREE.Line | null {
  const radius = entity.radius || 1;
  const center = entity.center || { x: 0, y: 0, z: 0 };
  const startAngle = entity.startAngle || 0;
  const endAngle = entity.endAngle || Math.PI * 2;

  const curve = new THREE.EllipseCurve(
    center.x,
    -center.y,
    radius,
    radius,
    startAngle,
    endAngle,
    false,
    0
  );

  const points = curve.getPoints(32);
  const points3D = points.map(
    (p) => new THREE.Vector3(p.x, center.z || 0, p.y)
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function createText(entity: any, color: number): THREE.Object3D | null {
  // For now, create a small marker where text should be
  const position = entity.position ||
    entity.insertionPoint || { x: 0, y: 0, z: 0 };

  const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const marker = new THREE.Mesh(geometry, material);

  marker.position.set(position.x || 0, position.z || 0, -(position.y || 0));

  return marker;
}

function createInsert(
  entity: any,
  dxf: any,
  color: number
): THREE.Object3D | null {
  // Create a marker for block insertion
  const position = entity.position ||
    entity.insertionPoint || { x: 0, y: 0, z: 0 };

  const geometry = new THREE.BoxGeometry(0.2, 0.2, 0.2);
  const material = new THREE.MeshBasicMaterial({ color: 0xffa500 });
  const marker = new THREE.Mesh(geometry, material);

  marker.position.set(position.x || 0, position.z || 0, -(position.y || 0));

  return marker;
}

function createDimension(entity: any, color: number): THREE.Object3D | null {
  // Create simple dimension lines
  const group = new THREE.Group();

  if (entity.definingPoint && entity.middleOfText) {
    const geometry = new THREE.BufferGeometry();
    const points = [
      new THREE.Vector3(
        entity.definingPoint.x || 0,
        entity.definingPoint.z || 0,
        -(entity.definingPoint.y || 0)
      ),
      new THREE.Vector3(
        entity.middleOfText.x || 0,
        entity.middleOfText.z || 0,
        -(entity.middleOfText.y || 0)
      ),
    ];

    geometry.setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: 0xff00ff });
    const line = new THREE.Line(geometry, material);

    group.add(line);
  }

  return group.children.length > 0 ? group : null;
}

function createSolid(entity: any, color: number): THREE.Mesh | null {
  if (!entity.points || entity.points.length < 3) return null;

  // Create a shape from the points
  const shape = new THREE.Shape();

  entity.points.forEach((point: any, index: number) => {
    if (index === 0) {
      shape.moveTo(point.x || 0, -(point.y || 0));
    } else {
      shape.lineTo(point.x || 0, -(point.y || 0));
    }
  });

  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);
  const material = new THREE.MeshBasicMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.3,
  });

  return new THREE.Mesh(geometry, material);
}

function createPoint(entity: any, color: number): THREE.Points | null {
  const position = entity.position || { x: 0, y: 0, z: 0 };

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(
      [position.x || 0, position.z || 0, -(position.y || 0)],
      3
    )
  );

  const material = new THREE.PointsMaterial({ color, size: 5 });

  return new THREE.Points(geometry, material);
}

function createEllipse(entity: any, color: number): THREE.Line | null {
  const center = entity.center || { x: 0, y: 0, z: 0 };
  const majorAxis = entity.majorAxisEndPoint || { x: 1, y: 0 };
  const ratio = entity.axisRatio || 1;

  const rx = Math.sqrt(majorAxis.x ** 2 + majorAxis.y ** 2);
  const ry = rx * ratio;
  const rotation = Math.atan2(majorAxis.y, majorAxis.x);

  const curve = new THREE.EllipseCurve(
    center.x,
    -center.y,
    rx,
    ry,
    0,
    2 * Math.PI,
    false,
    rotation
  );

  const points = curve.getPoints(64);
  const points3D = points.map(
    (p) => new THREE.Vector3(p.x, center.z || 0, p.y)
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function createSpline(entity: any, color: number): THREE.Line | null {
  if (!entity.controlPoints || entity.controlPoints.length < 2) return null;

  // Create curve from control points
  const points = entity.controlPoints.map(
    (cp: any) => new THREE.Vector3(cp.x || 0, cp.z || 0, -(cp.y || 0))
  );

  const curve = new THREE.CatmullRomCurve3(points);
  const curvePoints = curve.getPoints(50);

  const geometry = new THREE.BufferGeometry().setFromPoints(curvePoints);
  const material = new THREE.LineBasicMaterial({ color });

  return new THREE.Line(geometry, material);
}

function getEntityColor(entity: any, dxf: any): number {
  // ACI color palette
  const aciColors = [
    0x000000, 0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff,
    0xffffff, 0x414141, 0x808080, 0xff0000, 0xffaaaa, 0xbd0000, 0xbd7e7e,
    0x810000,
  ];

  if (entity.color && entity.color !== 256 && entity.color < aciColors.length) {
    return aciColors[entity.color];
  }

  // Try layer color
  const layer = dxf?.tables?.layer?.layers?.[entity.layer || "0"];
  if (layer?.color && layer.color < aciColors.length) {
    return aciColors[layer.color];
  }

  return 0x000000; // Default black
}
