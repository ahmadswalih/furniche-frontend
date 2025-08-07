"use client";

import { useState } from "react";
import Canvas3D from "./components/Canvas3D";
import Toolbar from "./components/Toolbar";
import PropertiesPanel from "./components/PropertiesPanel";
import GeometryManager from "./components/GeometryManager";
import CenterAIAssistant from "./components/CenterAIAssistant";
import FloatingAIPrompt from "./components/FloatingAIPrompt";
import DXFImporter from "./components/DXFImporter";
import ExtrudeManager from "./components/ExtrudeManager";
import DXFPreview from "./components/DXFPreview";
import SimpleInteractiveDrawing from "./components/SimpleInteractiveDrawing";
import SimpleTransformControls from "./components/SimpleTransformControls";
import * as THREE from "three";

interface GeometryObject {
  id: string;
  type:
    | "cube"
    | "cylinder"
    | "sphere"
    | "plane"
    | "rectangle"
    | "circle"
    | "line"
    | "extruded";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  lineStart?: [number, number, number];
  lineEnd?: [number, number, number];
  shape?: THREE.Shape;
  extrudeDepth?: number;
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
}

export default function Home() {
  const [activeTool, setActiveTool] = useState("select");
  const [objects, setObjects] = useState<GeometryObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [dxfPreviewObjects, setDxfPreviewObjects] = useState<any[]>([]);
  const [isDxfPreviewing, setIsDxfPreviewing] = useState(false);
  const [drawingMeasurements, setDrawingMeasurements] = useState<any>(null);

  const selectedObject =
    objects.find((obj) => obj.id === selectedObjectId) || null;
  const { handleDXFFile } = DXFImporter({
    onImportComplete: handleDXFImportPreview,
  });

  const handleCreateExtrudedShape = (shape: THREE.Shape, depth: number) => {
    const newExtruded: GeometryObject = {
      id: `extruded-${Date.now()}`,
      type: "extruded",
      position: [0, depth / 2, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      color: "#8b5cf6",
      selected: false,
      shape,
      extrudeDepth: depth,
    };
    setObjects((prev) => [...prev, newExtruded]);
    setActiveTool("select");
  };

  const handleUpdateObject = (
    objectId: string,
    updates: Partial<GeometryObject>
  ) => {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === objectId ? { ...obj, ...updates } : obj))
    );
  };

  function handleDXFImportPreview(importedObjects: any[]) {
    setDxfPreviewObjects(importedObjects);
    setIsDxfPreviewing(true);
  }

  function handleDXFImport(position: [number, number, number]) {
    const newObjects: GeometryObject[] = dxfPreviewObjects.map((obj) => {
      if (obj.type === "line") {
        return {
          id: obj.id,
          type: "line",
          position: [position[0], position[1], position[2]],
          rotation: [0, 0, 0],
          scale: [1, 1, 1],
          color: obj.color || "#6b7280",
          selected: false,
          lineStart: [
            obj.start[0] + position[0],
            obj.start[1] + position[1],
            obj.start[2] + position[2],
          ] as [number, number, number],
          lineEnd: [
            obj.end[0] + position[0],
            obj.end[1] + position[1],
            obj.end[2] + position[2],
          ] as [number, number, number],
        };
      }
      return {
        id: obj.id,
        type: obj.type || "cube",
        position: [
          (obj.position?.[0] || 0) + position[0],
          (obj.position?.[1] || 0) + position[1],
          (obj.position?.[2] || 0) + position[2],
        ] as [number, number, number],
        rotation: obj.rotation || [0, 0, 0],
        scale: obj.scale || [1, 1, 1],
        color: obj.color || "#6b7280",
        selected: false,
      };
    });

    setObjects((prev) => [...prev, ...newObjects]);
    setDxfPreviewObjects([]);
    setIsDxfPreviewing(false);
  }

  const handleAICommand = (command: string) => {
    const cmd = command.toLowerCase();

    if (cmd.includes("create") && cmd.includes("cube")) {
      const newCube: GeometryObject = {
        id: `ai-cube-${Date.now()}`,
        type: "cube",
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        color: "#3b82f6",
        selected: false,
      };
      setObjects((prev) => [...prev, newCube]);
      setActiveTool("select");
    } else if (cmd.includes("create") && cmd.includes("room")) {
      const roomObjects: GeometryObject[] = [
        {
          id: `ai-floor-${Date.now()}`,
          type: "cube",
          position: [0, -0.1, 0],
          rotation: [0, 0, 0],
          scale: [10, 0.2, 10],
          color: "#d1d5db",
          selected: false,
        },
        {
          id: `ai-wall1-${Date.now()}`,
          type: "cube",
          position: [0, 2, -5],
          rotation: [0, 0, 0],
          scale: [10, 4, 0.2],
          color: "#f3f4f6",
          selected: false,
        },
        {
          id: `ai-wall2-${Date.now()}`,
          type: "cube",
          position: [-5, 2, 0],
          rotation: [0, 0, 0],
          scale: [0.2, 4, 10],
          color: "#f3f4f6",
          selected: false,
        },
      ];
      setObjects((prev) => [...prev, ...roomObjects]);
    } else if (cmd.includes("sofa") || cmd.includes("couch")) {
      const sofa: GeometryObject = {
        id: `ai-sofa-${Date.now()}`,
        type: "cube",
        position: [0, 0.4, 0],
        rotation: [0, 0, 0],
        scale: [3, 0.8, 1.2],
        color: "#6366f1",
        selected: false,
      };
      setObjects((prev) => [...prev, sofa]);
    }
  };

  const isDrawingTool = [
    "cube",
    "cylinder",
    "sphere",
    "plane",
    "rectangle",
    "circle",
    "line",
  ].includes(activeTool);

  return (
    <div
      className={`w-screen h-screen bg-gray-100 relative overflow-hidden ${
        isDrawingTool ? "cursor-crosshair" : "cursor-default"
      }`}
    >
      <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 bg-white px-4 py-2 rounded-lg shadow">
            Furniche - AI Interior Design Studio
          </h1>
          <p className="text-sm text-gray-600 bg-white/80 px-3 py-1 rounded-b-lg">
            The Cursor for Interior Designers • Press{" "}
            <kbd className="bg-gray-200 px-1 rounded text-xs">Cmd+K</kbd> for AI
            {isDrawingTool && (
              <span className="ml-2 text-blue-600 font-medium">
                • Click on canvas to draw
              </span>
            )}
          </p>
        </div>
      </div>

      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDxfImport={handleDXFFile}
      />

      <PropertiesPanel
        selectedObject={selectedObject}
        onUpdateObject={handleUpdateObject}
      />

      <CenterAIAssistant onCommand={handleAICommand} />
      <FloatingAIPrompt onCommand={handleAICommand} />

      {isDxfPreviewing && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border z-50">
          <p className="text-sm font-medium text-gray-700">
            Move your mouse to position the DXF file, then click to place it
          </p>
          <button
            onClick={() => {
              setDxfPreviewObjects([]);
              setIsDxfPreviewing(false);
            }}
            className="mt-2 px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
          >
            Cancel
          </button>
        </div>
      )}

      <div className="w-full h-full">
        <Canvas3D activeTool={activeTool}>
          {/* Render objects with selection support */}
          {objects.map((obj) => {
            const isSelected = selectedObjectId === obj.id;
            return (
              <mesh
                key={obj.id}
                position={obj.position}
                rotation={obj.rotation}
                scale={obj.scale}
                onClick={(e) => {
                  e.stopPropagation();
                  if (activeTool === "select") {
                    setSelectedObjectId(isSelected ? null : obj.id);
                  }
                }}
              >
                {obj.type === "cube" && <boxGeometry args={[1, 1, 1]} />}
                {obj.type === "cylinder" && (
                  <cylinderGeometry args={[0.5, 0.5, 1, 16]} />
                )}
                {obj.type === "sphere" && (
                  <sphereGeometry args={[0.5, 16, 12]} />
                )}
                {obj.type === "line" &&
                  obj.lineStart &&
                  obj.lineEnd &&
                  (() => {
                    const start = new THREE.Vector3(...obj.lineStart);
                    const end = new THREE.Vector3(...obj.lineEnd);
                    const direction = new THREE.Vector3().subVectors(
                      end,
                      start
                    );
                    const length = direction.length();
                    const center = new THREE.Vector3()
                      .addVectors(start, end)
                      .multiplyScalar(0.5);
                    direction.normalize();
                    const angle = Math.atan2(direction.x, direction.z);

                    return (
                      <group
                        key="line-group"
                        position={[center.x, center.y, center.z]}
                        rotation={[0, angle, 0]}
                      >
                        <boxGeometry args={[0.02, 0.02, length]} />
                      </group>
                    );
                  })()}
                <meshStandardMaterial
                  color={isSelected ? "#4ade80" : obj.color}
                  wireframe={isSelected}
                  transparent={isSelected}
                  opacity={isSelected ? 0.7 : 1}
                />
              </mesh>
            );
          })}

          {/* Interactive drawing for line, rectangle, circle */}
          {["line", "rectangle", "circle"].includes(activeTool) && (
            <SimpleInteractiveDrawing
              activeTool={activeTool}
              onObjectCreate={(obj) => {
                setObjects((prev) => [...prev, obj]);
                setSelectedObjectId(obj.id);
              }}
              onMeasurementUpdate={setDrawingMeasurements}
            />
          )}

          {/* Ground plane for basic shape tools */}
          {["cube", "cylinder", "sphere", "plane"].includes(activeTool) && (
            <mesh
              position={[0, -0.001, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
              onClick={(e) => {
                e.stopPropagation();
                const point = e.point;
                let position: [number, number, number] = [
                  point.x,
                  0.5,
                  point.z,
                ];

                const newObject: GeometryObject = {
                  id: `${activeTool}-${Date.now()}`,
                  type: activeTool as any,
                  position,
                  rotation: [0, 0, 0],
                  scale: [1, 1, 1],
                  color: "#6b7280",
                  selected: false,
                };

                setObjects((prev) => [...prev, newObject]);
                setSelectedObjectId(newObject.id);
              }}
            >
              <planeGeometry args={[1000, 1000]} />
              <meshBasicMaterial visible={false} />
            </mesh>
          )}

          {/* Transform controls for move/rotate/scale tools */}
          {["move", "rotate", "scale"].includes(activeTool) &&
            selectedObject && (
              <SimpleTransformControls
                selectedObject={selectedObject}
                transformMode={
                  activeTool === "move"
                    ? "translate"
                    : activeTool === "rotate"
                    ? "rotate"
                    : "scale"
                }
                onTransform={(updates) => {
                  handleUpdateObject(selectedObjectId!, updates);
                }}
              />
            )}
        </Canvas3D>
      </div>

      {/* Measurement display UI outside Canvas */}
      {drawingMeasurements?.isDrawing && drawingMeasurements?.measurements && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-lg shadow-lg border z-50">
          <div className="text-sm font-medium text-gray-700 mb-2">
            Drawing {drawingMeasurements.activeTool}
          </div>
          <div className="flex gap-4 text-xs text-gray-600">
            {drawingMeasurements.activeTool === "line" && (
              <>
                <span>
                  Length:{" "}
                  <strong>{drawingMeasurements.measurements?.length}m</strong>
                </span>
                <span>
                  Angle:{" "}
                  <strong>{drawingMeasurements.measurements?.angle}°</strong>
                </span>
              </>
            )}
            {drawingMeasurements.activeTool === "rectangle" && (
              <>
                <span>
                  Width:{" "}
                  <strong>{drawingMeasurements.measurements?.width}m</strong>
                </span>
                <span>
                  Height:{" "}
                  <strong>{drawingMeasurements.measurements?.height}m</strong>
                </span>
              </>
            )}
            {drawingMeasurements.activeTool === "circle" && (
              <>
                <span>
                  Radius:{" "}
                  <strong>{drawingMeasurements.measurements?.radius}m</strong>
                </span>
                <span>
                  Diameter:{" "}
                  <strong>{drawingMeasurements.measurements?.diameter}m</strong>
                </span>
              </>
            )}
          </div>
          <div className="text-xs text-gray-500 mt-2">
            Click to finish • Press Escape to cancel
          </div>
        </div>
      )}
    </div>
  );
}
