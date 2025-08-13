"use client";

import { useState } from "react";
import { X, Upload, Loader2 } from "lucide-react";
import { BackendDXFObject } from "./BackendDXFImporter";
import * as THREE from "three";

interface DXFImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (dxfObjects: BackendDXFObject[]) => void;
}

export default function DXFImportModal({
  isOpen,
  onClose,
  onImportComplete,
}: DXFImportModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [message, setMessage] = useState("");

  // Import options
  const [preserveOrigin, setPreserveOrigin] = useState(true);
  const [mergeCoplanarFaces, setMergeCoplanarFaces] = useState(true);
  const [orientFacesConsistently, setOrientFacesConsistently] = useState(true);
  const [units, setUnits] = useState("meters");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.name.toLowerCase().endsWith(".dxf")) {
      setSelectedFile(file);
      setMessage("");
    } else {
      setMessage("Please select a valid DXF file");
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      setMessage("Please select a DXF file first");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setMessage("Uploading and processing DXF file...");

    try {
      const formData = new FormData();
      formData.append("dxfFile", selectedFile);
      formData.append("preserveOrigin", preserveOrigin.toString());
      formData.append("mergeCoplanarFaces", mergeCoplanarFaces.toString());
      formData.append(
        "orientFacesConsistently",
        orientFacesConsistently.toString()
      );
      formData.append("units", units);

      // Simulate progress
      setUploadProgress(25);
      setMessage("Processing DXF entities...");

      const response = await fetch(
        "http://localhost:3001/api/enhanced/process-sketchup-dxf",
        {
          method: "POST",
          body: formData,
        }
      );
      console.log("🔍 Response:", response);
      setUploadProgress(75);
      setMessage("Finalizing 3D geometry...");

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      setUploadProgress(100);
      setMessage("Import complete!");

      // Debug: Log the backend response structure
      console.log("🔍 Backend DXF Response:", result);
      console.log("🔍 Backend DXF Data:", result.data);
      console.log("🔍 Backend DXF Metadata:", result.data?.metadata);
      console.log("🔍 Backend DXF Bounds:", result.data?.bounds);

      // Convert backend JSON data to THREE.js objects
      const convertBackendDataToThreeJS = (data: any): THREE.Group => {
        try {
          const group = new THREE.Group();
          group.name = "BackendDXF";

          // Create lines
          if (data.geometry?.lines) {
            data.geometry.lines.forEach((line: any, index: number) => {
              // Skip lines that don't have valid points
              if (
                !line.points ||
                !Array.isArray(line.points) ||
                line.points.length === 0
              ) {
                console.warn(
                  `⚠️ Skipping line ${index}: Invalid or missing points`,
                  line
                );
                return;
              }

              const points = line.points.map(
                (p: number[]) => new THREE.Vector3(p[0], p[1], p[2])
              );
              const geometry = new THREE.BufferGeometry().setFromPoints(points);
              const material = new THREE.LineBasicMaterial({
                color: line.color || 0x000000,
                linewidth: 1,
              });
              const lineObj = new THREE.Line(geometry, material);
              lineObj.userData = {
                layer: line.layer || "0",
                type: "line",
                index,
              };
              group.add(lineObj);
            });
          }

          // Create faces
          if (data.geometry?.faces) {
            console.log(
              "🔍 Total faces to process:",
              data.geometry.faces.length
            );
            let processedFaces = 0;
            let skippedFaces = 0;

            data.geometry.faces.forEach((face: any, index: number) => {
              console.log(`🔍 Processing face ${index}:`, face);
              console.log(`🔍 Face ${index} keys:`, Object.keys(face));
              console.log(`🔍 Face ${index} points:`, face.points);
              console.log(`🔍 Face ${index} points type:`, typeof face.points);
              console.log(
                `🔍 Face ${index} points isArray:`,
                Array.isArray(face.points)
              );

              // Skip faces that don't have valid points
              if (
                !face.points ||
                !Array.isArray(face.points) ||
                face.points.length === 0
              ) {
                console.warn(
                  `⚠️ Skipping face ${index}: Invalid or missing points`,
                  face
                );
                skippedFaces++;
                return;
              }

              const points = face.points.map(
                (p: number[]) => new THREE.Vector3(p[0], p[1], p[2])
              );

              // Create geometry from points
              const geometry = new THREE.BufferGeometry();
              const vertices = new Float32Array(points.length * 3);
              points.forEach((point: THREE.Vector3, i: number) => {
                vertices[i * 3] = point.x;
                vertices[i * 3 + 1] = point.y;
                vertices[i * 3 + 2] = point.z;
              });
              geometry.setAttribute(
                "position",
                new THREE.BufferAttribute(vertices, 3)
              );

              // Create faces for triangulation (simple approach)
              if (points.length >= 3) {
                const indices = [];
                for (let i = 1; i < points.length - 1; i++) {
                  indices.push(0, i, i + 1);
                }
                geometry.setIndex(indices);
              }

              geometry.computeVertexNormals();

              const material = new THREE.MeshStandardMaterial({
                color: face.color || 0x888888,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.8,
              });
              const mesh = new THREE.Mesh(geometry, material);
              mesh.userData = {
                layer: face.layer || "0",
                type: "face",
                index,
              };
              group.add(mesh);
              processedFaces++;
            });

            console.log(
              `✅ Faces processing complete: ${processedFaces} processed, ${skippedFaces} skipped`
            );
          }

          // Create circles
          if (data.geometry?.circles) {
            data.geometry.circles.forEach((circle: any, index: number) => {
              // Skip circles that don't have valid center or radius
              if (
                !circle.center ||
                !Array.isArray(circle.center) ||
                circle.center.length < 3 ||
                typeof circle.radius !== "number" ||
                circle.radius <= 0
              ) {
                console.warn(
                  `⚠️ Skipping circle ${index}: Invalid center or radius`,
                  circle
                );
                return;
              }

              const geometry = new THREE.CircleGeometry(circle.radius, 32);
              const material = new THREE.LineBasicMaterial({
                color: circle.color || 0x000000,
              });
              const circleObj = new THREE.LineLoop(
                new THREE.EdgesGeometry(geometry),
                material
              );
              circleObj.position.set(
                circle.center[0],
                circle.center[1],
                circle.center[2]
              );
              circleObj.userData = {
                layer: circle.layer || "0",
                type: "circle",
                index,
              };
              group.add(circleObj);
            });
          }

          // Add points/markers
          if (data.geometry?.points) {
            data.geometry.points.forEach((point: any, index: number) => {
              // Skip points that don't have valid position
              if (
                !point.position ||
                !Array.isArray(point.position) ||
                point.position.length < 3
              ) {
                console.warn(
                  `⚠️ Skipping point ${index}: Invalid position`,
                  point
                );
                return;
              }

              const geometry = new THREE.SphereGeometry(0.05, 8, 8);
              const material = new THREE.MeshBasicMaterial({
                color: point.color || 0xff0000,
              });
              const sphere = new THREE.Mesh(geometry, material);
              sphere.position.set(
                point.position[0],
                point.position[1],
                point.position[2]
              );
              sphere.userData = {
                layer: point.layer || "0",
                type: "point",
                index,
              };
              group.add(sphere);
            });
          }

          return group;
        } catch (error) {
          console.error("Error converting backend data to THREE.js:", error);
          // Return an empty group if conversion fails
          const fallbackGroup = new THREE.Group();
          fallbackGroup.name = "BackendDXF-Error";
          return fallbackGroup;
        }
      };

      // Convert backend response to frontend format
      const threejsMesh = convertBackendDataToThreeJS(result.data);
      const dxfObject: BackendDXFObject = {
        id: `backend-dxf-${Date.now()}`,
        type: "backend_dxf",
        mesh: threejsMesh, // The processed 3D data converted to THREE.js Group
        metadata: {
          fileName: selectedFile.name,
          entityCount: result.data?.metadata?.entity_counts
            ? Object.values(result.data.metadata.entity_counts).reduce(
                (a: number, b: any) => a + (Number(b) || 0),
                0
              )
            : 0,
          faceCount: result.data?.metadata?.face_count || 0,
          layerCount: result.data?.layers?.length || 0,
          units: result.data?.metadata?.units || "meters",
          dxfVersion: result.data?.metadata?.dxf_version || "Unknown",
          importTime: Date.now(),
        },
        bounds: result.data?.bounds
          ? {
              min: new THREE.Vector3(
                result.data.bounds.min?.[0] || 0,
                result.data.bounds.min?.[1] || 0,
                result.data.bounds.min?.[2] || 0
              ),
              max: new THREE.Vector3(
                result.data.bounds.max?.[0] || 0,
                result.data.bounds.max?.[1] || 0,
                result.data.bounds.max?.[2] || 0
              ),
              center: new THREE.Vector3(
                result.data.bounds.center?.[0] || 0,
                result.data.bounds.center?.[1] || 0,
                result.data.bounds.center?.[2] || 0
              ),
              size: new THREE.Vector3(
                result.data.bounds.size?.[0] || 0,
                result.data.bounds.size?.[1] || 0,
                result.data.bounds.size?.[2] || 0
              ),
            }
          : {
              min: new THREE.Vector3(0, 0, 0),
              max: new THREE.Vector3(0, 0, 0),
              center: new THREE.Vector3(0, 0, 0),
              size: new THREE.Vector3(0, 0, 0),
            },
        layers:
          result.data?.layers?.map((layer: any) => layer.name || layer) || [],
      };

      onImportComplete([dxfObject]);

      // Reset and close
      setTimeout(() => {
        resetForm();
        onClose();
      }, 1000);
    } catch (error) {
      console.error("DXF import error:", error);
      setMessage("Import failed: " + (error as Error).message);
      setUploadProgress(0);
    } finally {
      setIsUploading(false);
    }
  };

  const resetForm = () => {
    setSelectedFile(null);
    setIsUploading(false);
    setUploadProgress(0);
    setMessage("");
    setPreserveOrigin(true);
    setMergeCoplanarFaces(true);
    setOrientFacesConsistently(true);
    setUnits("meters");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-6 rounded-t-xl flex items-center justify-between">
          <h2 className="text-xl font-semibold">Import DXF Floor Plan</h2>
          <button
            onClick={() => {
              resetForm();
              onClose();
            }}
            className="text-white hover:bg-blue-700 p-1 rounded transition-colors"
            disabled={isUploading}
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* File Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select DXF File
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors">
              <input
                type="file"
                accept=".dxf"
                onChange={handleFileSelect}
                disabled={isUploading}
                className="hidden"
                id="dxf-file-input"
              />
              <label
                htmlFor="dxf-file-input"
                className="cursor-pointer flex flex-col items-center space-y-2"
              >
                <Upload className="text-gray-400" size={32} />
                <span className="text-sm text-gray-600">
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select DXF file"}
                </span>
              </label>
            </div>
          </div>

          {/* Import Options */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-gray-700">
              Import Options
            </h3>

            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={preserveOrigin}
                  onChange={(e) => setPreserveOrigin(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">Preserve origin</span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={mergeCoplanarFaces}
                  onChange={(e) => setMergeCoplanarFaces(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Merge coplanar faces
                </span>
              </label>

              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={orientFacesConsistently}
                  onChange={(e) => setOrientFacesConsistently(e.target.checked)}
                  disabled={isUploading}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm text-gray-700">
                  Orient faces consistently
                </span>
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Units
              </label>
              <select
                value={units}
                onChange={(e) => setUnits(e.target.value)}
                disabled={isUploading}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="meters">Meters</option>
                <option value="centimeters">Centimeters</option>
                <option value="millimeters">Millimeters</option>
                <option value="feet">Feet</option>
                <option value="inches">Inches</option>
              </select>
            </div>
          </div>

          {/* Progress and Messages */}
          {(isUploading || message) && (
            <div className="space-y-2">
              {isUploading && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}
              <p className="text-sm text-gray-700 text-center">{message}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isUploading}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleImport}
              disabled={!selectedFile || isUploading}
              className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              {isUploading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <span>Import</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
