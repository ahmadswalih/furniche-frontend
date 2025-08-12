"use client";

import React, { useCallback, useState } from "react";
import * as THREE from "three";
import { Shape, ExtrudeGeometry, Path } from "three";

// SketchUp-style DXF import with filled faces
export interface SketchUpDXFObject {
  id: string;
  type: "sketchup_dxf";
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
    faceCount: number;
    importTime: number;
    units: string;
  };
}

interface DXFImportOptions {
  preserveOrigin: boolean;
  mergeCoplanarFaces: boolean;
  orientFacesConsistently: boolean;
  units: "model" | "meters" | "centimeters" | "millimeters" | "feet" | "inches";
}

interface SketchUpStyleDXFImporterProps {
  onImportComplete: (objects: SketchUpDXFObject[]) => void;
}

export default function SketchUpStyleDXFImporter({
  onImportComplete,
}: SketchUpStyleDXFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [importOptions, setImportOptions] = useState<DXFImportOptions>({
    preserveOrigin: true,
    mergeCoplanarFaces: true,
    orientFacesConsistently: true,
    units: "model",
  });

  const processImport = useCallback(
    async (file: File, options: DXFImportOptions) => {
      setIsProcessing(true);
      setProgress(0);
      console.log("🎨 SketchUp-style DXF Import starting:", file.name, options);

      try {
        setProgress(10);
        const text = await file.text();

        setProgress(20);
        // Import DXF parser
        const DxfParser = (await import("dxf-parser")).default;
        const parser = new DxfParser();
        const dxf = parser.parseSync(text);

        if (!dxf || !dxf.entities) {
          throw new Error("Invalid DXF file");
        }

        setProgress(30);
        console.log("📊 DXF parsed successfully:", {
          entities: dxf.entities.length,
          layers: Object.keys(dxf.tables?.layer?.layers || {}),
          units: dxf.header?.$INSUNITS,
        });

        // Create the main group for all entities
        const group = new THREE.Group();
        const layers = new Set<string>();
        let entityCount = 0;
        let faceCount = 0;

        // Get unit scale
        const unitScale = getUnitScale(dxf, options.units);

        // Step 1: Collect all entities by layer
        const entitiesByLayer: Map<string, any[]> = new Map();
        dxf.entities.forEach((entity: any) => {
          const layer = entity.layer || "0";
          if (!entitiesByLayer.has(layer)) {
            entitiesByLayer.set(layer, []);
          }
          entitiesByLayer.get(layer)!.push(entity);
          layers.add(layer);
        });

        setProgress(40);

        // Step 2: Process each layer to find closed loops and create faces
        let layerProgress = 40;
        const layerProgressIncrement = 40 / entitiesByLayer.size;

        for (const [layer, entities] of entitiesByLayer) {
          console.log(
            `🔧 Processing layer: ${layer} with ${entities.length} entities`
          );

          if (options.mergeCoplanarFaces) {
            // Find closed loops and create faces
            const faces = findClosedLoops(entities);
            console.log(
              `📐 Found ${faces.length} closed loops in layer ${layer}`
            );
            faces.forEach((face) => {
              const mesh = createFaceFromLoop(face, layer, dxf);
              if (mesh) {
                group.add(mesh);
                faceCount++;
                console.log(`✅ Created face for layer ${layer}`);
              }
            });
          }

          // Also add individual entities as lines
          entities.forEach((entity: any) => {
            const entityMesh = createEntityMesh(entity, dxf, unitScale);
            if (entityMesh) {
              entityMesh.userData = { layer, entityType: entity.type };
              group.add(entityMesh);
              entityCount++;
            } else {
              console.log(`⚠️ Failed to create mesh for entity:`, entity.type);
            }
          });

          layerProgress += layerProgressIncrement;
          setProgress(Math.round(layerProgress));
        }

        console.log(
          `📊 Total created: ${entityCount} entities, ${faceCount} faces`
        );

        setProgress(85);

        // Calculate bounds
        const box = new THREE.Box3().setFromObject(group);
        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        // Apply origin settings
        if (!options.preserveOrigin) {
          group.position.sub(center);
          group.position.y = 0; // Keep on ground
        }

        // Apply unit scaling
        if (unitScale !== 1) {
          group.scale.multiplyScalar(unitScale);
        }

        setProgress(95);

        // Create SketchUp-style DXF object
        const sketchUpDXF: SketchUpDXFObject = {
          id: `sketchup-dxf-${Date.now()}`,
          type: "sketchup_dxf",
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
            faceCount,
            importTime: Date.now(),
            units: options.units,
          },
        };

        console.log("✅ SketchUp-style DXF import complete:", sketchUpDXF);
        setProgress(100);

        setTimeout(() => {
          onImportComplete([sketchUpDXF]);
          setIsProcessing(false);
          setShowOptions(false);
          setSelectedFile(null);
          setProgress(0);
        }, 500);
      } catch (error) {
        console.error("❌ SketchUp-style DXF import failed:", error);
        alert(`Failed to import DXF: ${error}`);
        setIsProcessing(false);
        setProgress(0);
      }
    },
    [onImportComplete]
  );

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setShowOptions(true);
  }, []);

  const handleImport = useCallback(() => {
    if (selectedFile) {
      processImport(selectedFile, importOptions);
    }
  }, [selectedFile, importOptions, processImport]);

  const handleCancel = useCallback(() => {
    setShowOptions(false);
    setSelectedFile(null);
  }, []);

  return (
    <div className="space-y-4">
      {!showOptions && !isProcessing && (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
          <input
            type="file"
            accept=".dxf,.DXF"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="sketchup-dxf-input"
          />
          <label
            htmlFor="sketchup-dxf-input"
            className="cursor-pointer inline-flex items-center space-x-2 px-6 py-3 border border-transparent text-lg font-medium rounded-md bg-green-600 text-white hover:bg-green-700"
          >
            <span>🎨</span>
            <span>SketchUp-Style DXF Import</span>
          </label>
        </div>
      )}

      {/* Import Options Dialog */}
      {showOptions && !isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Import DXF</h2>
              <button
                onClick={handleCancel}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              {/* Position Options */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Position</h3>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Preserve drawing origin</span>
                  <input
                    type="checkbox"
                    checked={importOptions.preserveOrigin}
                    onChange={(e) =>
                      setImportOptions({
                        ...importOptions,
                        preserveOrigin: e.target.checked,
                      })
                    }
                    className="toggle"
                  />
                </label>
              </div>

              {/* Geometry Options */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Geometry</h3>
                <label className="flex items-center justify-between mb-2">
                  <span className="text-sm">Merge coplanar faces</span>
                  <input
                    type="checkbox"
                    checked={importOptions.mergeCoplanarFaces}
                    onChange={(e) =>
                      setImportOptions({
                        ...importOptions,
                        mergeCoplanarFaces: e.target.checked,
                      })
                    }
                    className="toggle"
                  />
                </label>
                <label className="flex items-center justify-between">
                  <span className="text-sm">Orient faces consistently</span>
                  <input
                    type="checkbox"
                    checked={importOptions.orientFacesConsistently}
                    onChange={(e) =>
                      setImportOptions({
                        ...importOptions,
                        orientFacesConsistently: e.target.checked,
                      })
                    }
                    className="toggle"
                  />
                </label>
              </div>

              {/* Scale Options */}
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Scale</h3>
                <label className="block">
                  <span className="text-sm mb-1 block">Units</span>
                  <select
                    value={importOptions.units}
                    onChange={(e) =>
                      setImportOptions({
                        ...importOptions,
                        units: e.target.value as DXFImportOptions["units"],
                      })
                    }
                    className="w-full border border-gray-300 rounded px-3 py-2"
                  >
                    <option value="model">In model</option>
                    <option value="meters">Meters</option>
                    <option value="centimeters">Centimeters</option>
                    <option value="millimeters">Millimeters</option>
                    <option value="feet">Feet</option>
                    <option value="inches">Inches</option>
                  </select>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Import
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Progress Dialog */}
      {isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Sending Model...</h3>
            <div className="w-full bg-gray-200 rounded-full h-2.5">
              <div
                className="bg-blue-600 h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <button
              onClick={() => setIsProcessing(false)}
              className="mt-4 w-full py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Find closed loops in entities to create faces
function findClosedLoops(entities: any[]): any[][] {
  const loops: any[][] = [];
  const polylines = entities.filter(
    (e) => (e.type === "LWPOLYLINE" || e.type === "POLYLINE") && e.closed
  );

  // Each closed polyline is a potential face
  polylines.forEach((polyline) => {
    loops.push([polyline]);
  });

  // TODO: Also find loops from connected LINE entities
  // This requires more complex graph analysis

  return loops;
}

// Create a filled face from a closed loop
function createFaceFromLoop(
  loop: any[],
  layer: string,
  dxf: any
): THREE.Mesh | null {
  if (loop.length === 0) return null;

  const shape = new THREE.Shape();
  const entity = loop[0]; // For now, handle single polyline loops

  if (!entity.vertices || entity.vertices.length < 3) return null;

  // Create shape from vertices
  entity.vertices.forEach((vertex: any, index: number) => {
    if (index === 0) {
      shape.moveTo(vertex.x || 0, -(vertex.y || 0));
    } else {
      if (vertex.bulge && index > 0) {
        // Handle arc segments
        const prevVertex = entity.vertices[index - 1];
        const nextVertex = entity.vertices[index + 1] || entity.vertices[0];
        // Add arc using quadraticCurveTo or similar
        shape.lineTo(vertex.x || 0, -(vertex.y || 0));
      } else {
        shape.lineTo(vertex.x || 0, -(vertex.y || 0));
      }
    }
  });

  shape.closePath();

  // Create geometry with small extrusion for visibility
  const extrudeSettings = {
    steps: 1,
    depth: 0.1,
    bevelEnabled: false,
  };

  const geometry = new ExtrudeGeometry(shape, extrudeSettings);

  // Get layer color
  const color = getLayerColor(layer, dxf);
  const material = new THREE.MeshStandardMaterial({
    color,
    side: THREE.DoubleSide,
    transparent: true,
    opacity: 0.8,
  });

  const mesh = new THREE.Mesh(geometry, material);
  mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal
  mesh.userData = { layer, type: "face" };

  return mesh;
}

// Create line mesh for entity
function createEntityMesh(
  entity: any,
  dxf: any,
  scale: number
): THREE.Object3D | null {
  const color = getEntityColor(entity, dxf);

  switch (entity.type) {
    case "LINE":
      return createLine(entity, color, scale);
    case "LWPOLYLINE":
      return createLWPolyline(entity, color, scale);
    case "POLYLINE":
      return createPolyline(entity, color, scale);
    case "CIRCLE":
      return createCircle(entity, color, scale);
    case "ARC":
      return createArc(entity, color, scale);
    case "TEXT":
    case "MTEXT":
      return createText(entity, color, scale);
    default:
      return null;
  }
}

// Line creation functions with proper scaling
function createLine(
  entity: any,
  color: number,
  scale: number
): THREE.Line | null {
  const start = entity.vertices?.[0] || entity.start || { x: 0, y: 0, z: 0 };
  const end = entity.vertices?.[1] || entity.end || { x: 0, y: 0, z: 0 };

  const points = [
    new THREE.Vector3(start.x * scale, start.z * scale, -start.y * scale),
    new THREE.Vector3(end.x * scale, end.z * scale, -end.y * scale),
  ];

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

function createLWPolyline(
  entity: any,
  color: number,
  scale: number
): THREE.Line | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points: THREE.Vector3[] = [];

  entity.vertices.forEach((vertex: any) => {
    points.push(
      new THREE.Vector3(
        vertex.x * scale,
        vertex.z * scale || 0,
        -vertex.y * scale
      )
    );
  });

  if (entity.closed) {
    points.push(points[0].clone());
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

function createPolyline(
  entity: any,
  color: number,
  scale: number
): THREE.Line | null {
  if (!entity.vertices || entity.vertices.length < 2) return null;

  const points = entity.vertices.map(
    (v: any) => new THREE.Vector3(v.x * scale, v.z * scale || 0, -v.y * scale)
  );

  if (entity.closed) {
    points.push(points[0].clone());
  }

  const geometry = new THREE.BufferGeometry().setFromPoints(points);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

function createCircle(
  entity: any,
  color: number,
  scale: number
): THREE.Line | null {
  const radius = (entity.radius || 1) * scale;
  const center = entity.center || { x: 0, y: 0, z: 0 };

  const curve = new THREE.EllipseCurve(
    center.x * scale,
    -center.y * scale,
    radius,
    radius,
    0,
    2 * Math.PI,
    false,
    0
  );

  const points = curve.getPoints(64);
  const points3D = points.map(
    (p) => new THREE.Vector3(p.x, (center.z || 0) * scale, p.y)
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

function createArc(
  entity: any,
  color: number,
  scale: number
): THREE.Line | null {
  const radius = (entity.radius || 1) * scale;
  const center = entity.center || { x: 0, y: 0, z: 0 };
  const startAngle = entity.startAngle || 0;
  const endAngle = entity.endAngle || Math.PI * 2;

  const curve = new THREE.EllipseCurve(
    center.x * scale,
    -center.y * scale,
    radius,
    radius,
    startAngle,
    endAngle,
    false,
    0
  );

  const points = curve.getPoints(32);
  const points3D = points.map(
    (p) => new THREE.Vector3(p.x, (center.z || 0) * scale, p.y)
  );

  const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
  const material = new THREE.LineBasicMaterial({ color, linewidth: 2 });

  return new THREE.Line(geometry, material);
}

function createText(
  entity: any,
  color: number,
  scale: number
): THREE.Object3D | null {
  // Create text marker
  const position = entity.position ||
    entity.insertionPoint || { x: 0, y: 0, z: 0 };

  const geometry = new THREE.BoxGeometry(0.2 * scale, 0.2 * scale, 0.2 * scale);
  const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
  const marker = new THREE.Mesh(geometry, material);

  marker.position.set(
    position.x * scale || 0,
    position.z * scale || 0,
    -position.y * scale || 0
  );

  return marker;
}

// Get unit scale factor
function getUnitScale(dxf: any, targetUnit: string): number {
  if (targetUnit === "model") return 1;

  const insunits = dxf.header?.$INSUNITS || 0;
  const unitMap: Record<number, number> = {
    0: 1, // Unitless
    1: 25.4, // Inches to mm
    2: 304.8, // Feet to mm
    3: 1609344, // Miles to mm
    4: 1, // Millimeters
    5: 10, // Centimeters to mm
    6: 1000, // Meters to mm
    9: 0.0254, // Microinches to mm
    10: 0.001, // Mils to mm
    11: 1000000, // Yards to mm
    12: 1e-6, // Angstroms to mm
    13: 1e-9, // Nanometers to mm
    14: 1e-6, // Microns to mm
    15: 100, // Decimeters to mm
    16: 10000, // Decameters to mm
    17: 100000, // Hectometers to mm
    18: 1e9, // Gigameters to mm
  };

  const sourceScale = unitMap[insunits] || 1;

  // Convert to target unit
  const targetScales: Record<string, number> = {
    millimeters: 1,
    centimeters: 0.1,
    meters: 0.001,
    inches: 0.0393701,
    feet: 0.00328084,
  };

  const targetScale = targetScales[targetUnit] || 1;
  return targetScale / sourceScale;
}

// Get entity color
function getEntityColor(entity: any, dxf: any): number {
  const aciColors = [
    0x000000, 0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff,
    0xffffff, 0x414141, 0x808080, 0xff0000, 0xffaaaa, 0xbd0000, 0xbd7e7e,
    0x810000,
  ];

  if (entity.color && entity.color !== 256 && entity.color < aciColors.length) {
    return aciColors[entity.color];
  }

  const layer = dxf?.tables?.layer?.layers?.[entity.layer || "0"];
  if (layer?.color && layer.color < aciColors.length) {
    return aciColors[layer.color];
  }

  return 0x000000;
}

// Get layer color
function getLayerColor(layerName: string, dxf: any): number {
  const layer = dxf?.tables?.layer?.layers?.[layerName];
  const aciColors = [
    0x000000, 0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff,
    0xffffff, 0x414141, 0x808080,
  ];

  if (layer?.color && layer.color < aciColors.length) {
    return aciColors[layer.color];
  }

  return 0x888888; // Default gray
}
