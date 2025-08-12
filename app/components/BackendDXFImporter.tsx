"use client";

import React, { useCallback, useState } from "react";
import * as THREE from "three";

// Backend-powered DXF importer - SketchUp level quality
export interface BackendDXFObject {
  id: string;
  type: "backend_dxf";
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
    layerCount: number;
    importTime: number;
    units: string;
    dxfVersion: string;
  };
}

interface DXFImportOptions {
  preserveOrigin: boolean;
  mergeCoplanarFaces: boolean;
  orientFacesConsistently: boolean;
  units: "model" | "meters" | "centimeters" | "millimeters" | "feet" | "inches";
}

interface BackendDXFImporterProps {
  onImportComplete: (objects: BackendDXFObject[]) => void;
}

const BACKEND_URL = "http://localhost:3001"; // Your backend URL

export default function BackendDXFImporter({
  onImportComplete,
}: BackendDXFImporterProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);
  const [progressMessage, setProgressMessage] = useState("");
  const [importOptions, setImportOptions] = useState<DXFImportOptions>({
    preserveOrigin: true,
    mergeCoplanarFaces: true,
    orientFacesConsistently: true,
    units: "meters",
  });

  const uploadToBackend = useCallback(
    async (file: File, options: DXFImportOptions) => {
      setIsProcessing(true);
      setProgress(0);
      setProgressMessage("Uploading file to backend...");

      try {
        // Create FormData for file upload
        const formData = new FormData();
        formData.append("dxfFile", file);
        formData.append("preserveOrigin", options.preserveOrigin.toString());
        formData.append(
          "mergeCoplanarFaces",
          options.mergeCoplanarFaces.toString()
        );
        formData.append(
          "orientFacesConsistently",
          options.orientFacesConsistently.toString()
        );
        formData.append("units", options.units);

        setProgress(10);
        setProgressMessage("Processing DXF with advanced algorithms...");

        // Upload to backend
        const response = await fetch(
          `${BACKEND_URL}/api/enhanced/process-sketchup-dxf`,
          {
            method: "POST",
            body: formData,
          }
        );

        setProgress(30);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `HTTP ${response.status}`);
        }

        setProgress(50);
        setProgressMessage("Converting geometry to Three.js format...");

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || "Backend processing failed");
        }

        setProgress(70);
        setProgressMessage("Creating 3D objects...");

        // Convert backend data to Three.js objects
        const backendDXF = await convertBackendDataToThreeJS(result.data);

        setProgress(100);
        setProgressMessage("Import complete!");

        setTimeout(() => {
          onImportComplete([backendDXF]);
          setIsProcessing(false);
          setShowOptions(false);
          setSelectedFile(null);
          setProgress(0);
          setProgressMessage("");
        }, 500);
      } catch (error) {
        console.error("❌ Backend DXF import failed:", error);
        alert(
          `Failed to import DXF: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        setIsProcessing(false);
        setProgress(0);
        setProgressMessage("");
      }
    },
    [onImportComplete]
  );

  const convertBackendDataToThreeJS = async (
    data: any
  ): Promise<BackendDXFObject> => {
    const group = new THREE.Group();
    let entityCount = 0;
    let faceCount = 0;

    // Convert lines
    data.geometry.lines?.forEach((lineData: any) => {
      const geometry = new THREE.BufferGeometry();
      const points = lineData.points.map(
        (p: number[]) => new THREE.Vector3(p[0], p[1], p[2])
      );
      geometry.setFromPoints(points);

      const material = new THREE.LineBasicMaterial({
        color: getColorFromDXFColor(lineData.color),
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { layer: lineData.layer, type: lineData.type };
      group.add(line);
      entityCount++;
    });

    // Convert faces (filled areas)
    data.geometry.faces?.forEach((faceData: any) => {
      if (faceData.vertices.length >= 3) {
        const shape = new THREE.Shape();

        // Create shape from vertices
        faceData.vertices.forEach((vertex: number[], index: number) => {
          if (index === 0) {
            shape.moveTo(vertex[0], vertex[2]); // X, Z coordinates
          } else {
            shape.lineTo(vertex[0], vertex[2]);
          }
        });
        shape.closePath();

        // Create extruded geometry for visual depth
        const extrudeSettings = {
          steps: 1,
          depth: 0.01, // Small extrusion for visibility
          bevelEnabled: false,
        };

        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        const material = new THREE.MeshStandardMaterial({
          color: getColorFromDXFColor(faceData.color),
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.7,
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.rotation.x = -Math.PI / 2; // Rotate to horizontal
        mesh.userData = {
          layer: faceData.layer,
          type: "face",
          entity_type: faceData.entity_type,
        };
        group.add(mesh);
        faceCount++;
      }
    });

    // Convert circles
    data.geometry.circles?.forEach((circleData: any) => {
      const radius = circleData.radius;
      const center = circleData.center;

      const curve = new THREE.EllipseCurve(
        center[0],
        center[2],
        radius,
        radius,
        0,
        2 * Math.PI,
        false,
        0
      );

      const points = curve.getPoints(64);
      const points3D = points.map(
        (p) => new THREE.Vector3(p.x, center[1], p.y)
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
      const material = new THREE.LineBasicMaterial({
        color: getColorFromDXFColor(circleData.color),
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { layer: circleData.layer, type: "circle" };
      group.add(line);
      entityCount++;
    });

    // Convert arcs
    data.geometry.arcs?.forEach((arcData: any) => {
      const radius = arcData.radius;
      const center = arcData.center;
      const startAngle = arcData.start_angle;
      const endAngle = arcData.end_angle;

      const curve = new THREE.EllipseCurve(
        center[0],
        center[2],
        radius,
        radius,
        startAngle,
        endAngle,
        false,
        0
      );

      const points = curve.getPoints(32);
      const points3D = points.map(
        (p) => new THREE.Vector3(p.x, center[1], p.y)
      );

      const geometry = new THREE.BufferGeometry().setFromPoints(points3D);
      const material = new THREE.LineBasicMaterial({
        color: getColorFromDXFColor(arcData.color),
        linewidth: 2,
      });

      const line = new THREE.Line(geometry, material);
      line.userData = { layer: arcData.layer, type: "arc" };
      group.add(line);
      entityCount++;
    });

    // Convert text as markers
    data.geometry.texts?.forEach((textData: any) => {
      const geometry = new THREE.BoxGeometry(0.1, 0.1, 0.1);
      const material = new THREE.MeshBasicMaterial({ color: 0x0066cc });
      const marker = new THREE.Mesh(geometry, material);

      marker.position.set(
        textData.position[0],
        textData.position[1],
        textData.position[2]
      );
      marker.userData = {
        layer: textData.layer,
        type: "text",
        text: textData.text,
        height: textData.height,
      };
      group.add(marker);
      entityCount++;
    });

    // Convert points
    data.geometry.points?.forEach((pointData: any) => {
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.Float32BufferAttribute(pointData.position, 3)
      );

      const material = new THREE.PointsMaterial({
        color: getColorFromDXFColor(pointData.color),
        size: 5,
      });

      const points = new THREE.Points(geometry, material);
      points.userData = { layer: pointData.layer, type: "point" };
      group.add(points);
      entityCount++;
    });

    // Calculate bounds
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3());

    // Center the group if not preserving origin
    if (!importOptions.preserveOrigin) {
      group.position.sub(center);
      group.position.y = 0;
    }

    return {
      id: data.id,
      type: "backend_dxf",
      mesh: group,
      layers: data.layers.map((l: any) => l.name),
      bounds: {
        min: new THREE.Vector3(box.min.x, box.min.y, box.min.z),
        max: new THREE.Vector3(box.max.x, box.max.y, box.max.z),
        center,
        size,
      },
      metadata: {
        fileName: data.metadata.fileName,
        entityCount,
        faceCount,
        layerCount: data.layers.length,
        importTime: Date.now(),
        units: data.metadata.units,
        dxfVersion: data.metadata.dxf_version || "Unknown",
      },
    };
  };

  const getColorFromDXFColor = (dxfColor: number): number => {
    // AutoCAD ACI color palette
    const aciColors = [
      0x000000, 0xff0000, 0xffff00, 0x00ff00, 0x00ffff, 0x0000ff, 0xff00ff,
      0xffffff, 0x414141, 0x808080, 0xff0000, 0xffaaaa, 0xbd0000, 0xbd7e7e,
      0x810000, 0x000000,
    ];

    if (dxfColor && dxfColor !== 256 && dxfColor < aciColors.length) {
      return aciColors[dxfColor];
    }

    return 0x000000; // Default black
  };

  const handleFileSelect = useCallback((file: File) => {
    setSelectedFile(file);
    setShowOptions(true);
  }, []);

  const handleImport = useCallback(() => {
    if (selectedFile) {
      uploadToBackend(selectedFile, importOptions);
    }
  }, [selectedFile, importOptions, uploadToBackend]);

  const handleCancel = useCallback(() => {
    setShowOptions(false);
    setSelectedFile(null);
  }, []);

  return (
    <div className="space-y-4">
      {!showOptions && !isProcessing && (
        <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center bg-gradient-to-r from-blue-50 to-indigo-50">
          <input
            type="file"
            accept=".dxf,.DXF"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
            id="backend-dxf-input"
          />
          <label
            htmlFor="backend-dxf-input"
            className="cursor-pointer inline-flex items-center space-x-2 px-8 py-4 border border-transparent text-lg font-medium rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 shadow-lg"
          >
            <span>🚀</span>
            <span>Backend-Powered DXF Import</span>
          </label>
          <p className="mt-2 text-sm text-gray-600">
            Professional-grade DXF processing with Python + ezdxf
          </p>
        </div>
      )}

      {/* Import Options Dialog */}
      {showOptions && !isProcessing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 w-96 max-h-96 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-800">
                Import DXF
              </h2>
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
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-md hover:from-blue-700 hover:to-indigo-700"
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
            <h3 className="text-lg font-medium mb-4">Processing DXF File...</h3>
            <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mb-4">{progressMessage}</p>
            <div className="text-xs text-gray-500">{progress}% complete</div>
          </div>
        </div>
      )}
    </div>
  );
}
