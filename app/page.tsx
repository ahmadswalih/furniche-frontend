"use client";

import { useState, useEffect } from "react";
import Canvas3D from "./components/Canvas3D";
import ClientOnly from "./components/ClientOnly";
import TopMenuBar from "./components/TopMenuBar";
import SimpleToolbar from "./components/SimpleToolbar";
import BottomChat from "./components/BottomChat";
import DXFImportModal from "./components/DXFImportModal";
import BackendDXFRenderer, {
  BackendDXFInfo,
} from "./components/BackendDXFRenderer";
import { BackendDXFObject } from "./components/BackendDXFImporter";
import LayerManager, { Layer } from "./components/LayerManager";
import { LayerSystem } from "./services/LayerSystem";

import RectangleRenderer from "./components/RectangleRenderer";
import SimpleInteractiveDrawing from "./components/SimpleInteractiveDrawing";
import WorkingRectangleTool from "./components/WorkingRectangleTool";
import PushPullTool from "./components/PushPullTool";
import ExtrusionRenderer from "./components/ExtrusionRenderer";
import SketchUpKeyboardShortcuts from "./components/SketchUpKeyboardShortcuts";
import SketchUpShortcutsDisplay from "./components/SketchUpShortcutsDisplay";
import SketchUpToolIndicator from "./components/SketchUpToolIndicator";
import * as THREE from "three";

interface GeometryObject {
  id: string;
  type:
    | "box"
    | "sphere"
    | "cylinder"
    | "plane"
    | "line"
    | "rectangle"
    | "circle"
    | "extruded"
    | "dxf"
    | "cad_box"
    | "cad_cylinder"
    | "cad_sphere"
    | "cad_union"
    | "cad_difference"
    | "cad_intersection"
    | "cad_fillet"
    | "cad_chamfer";
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  color?: string;

  // 2D shape properties
  width?: number;
  height?: number;
  depth?: number;
  radius?: number;
  length?: number;

  // Line-specific properties
  startPoint?: [number, number, number];
  endPoint?: [number, number, number];

  // Circle-specific properties
  center?: [number, number, number];

  // Rectangle-specific properties
  cornerA?: [number, number, number];
  cornerB?: [number, number, number];

  // Extrusion properties
  extrusionHeight?: number;
  profilePoints?: [number, number][];

  // DXF properties
  dxfEntities?: any[];
  fileName?: string;

  // CAD properties (OpenCascade)
  cadShape?: any; // OpenCascade shape object
  cadMesh?: THREE.Mesh; // Three.js mesh from CAD shape

  // Advanced CAD properties
  filletRadius?: number;
  chamferDistance?: number;
}

export default function Home() {
  const [activeTool, setActiveTool] = useState("select");
  const [objects, setObjects] = useState<GeometryObject[]>([]);
  const [selectedObjectId, setSelectedObjectId] = useState<string | null>(null);
  const [drawingMeasurements, setDrawingMeasurements] = useState<any>(null);

  // Backend-powered DXF state - THE ULTIMATE SOLUTION
  const [backendDXFs, setBackendDXFs] = useState<BackendDXFObject[]>([]);
  const [activeDXFLayers, setActiveDXFLayers] = useState<string[]>([]);

  // Layer system state
  const [layerSystem] = useState(() => new LayerSystem());
  const [layers, setLayers] = useState<Layer[]>([]);
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [showLayerManager, setShowLayerManager] = useState(false);

  // Rectangle drawing state
  const [rectangles, setRectangles] = useState<any[]>([]);
  const [selectedRectangleId, setSelectedRectangleId] = useState<string | null>(
    null
  );
  const [showRectangleManager, setShowRectangleManager] = useState(true);

  // Extrusion state (for Push/Pull tool)
  const [extrusions, setExtrusions] = useState<any[]>([]);
  const [selectedExtrusionId, setSelectedExtrusionId] = useState<string | null>(
    null
  );

  // UI state
  const [showDXFImportModal, setShowDXFImportModal] = useState(false);

  const selectedObject =
    objects.find((obj) => obj.id === selectedObjectId) || null;

  // Layer management functions
  const updateLayers = () => {
    setLayers(layerSystem.getAllLayers());
  };

  const handleLayerUpdate = (layerId: string, updates: Partial<Layer>) => {
    layerSystem.updateLayer(layerId, updates);
    updateLayers();
  };

  const handleLayerDelete = (layerId: string) => {
    layerSystem.deleteLayer(layerId);
    updateLayers();
  };

  const handleLayerCreate = (layerData: Omit<Layer, "id" | "createdAt">) => {
    layerSystem.createLayer(layerData);
    updateLayers();
  };

  const handleLayerVisibilityChange = (layerId: string, visible: boolean) => {
    layerSystem.setLayerVisibility(layerId, visible);
    updateLayers();
  };

  const handleLayerLockChange = (layerId: string, locked: boolean) => {
    layerSystem.setLayerLock(layerId, locked);
    updateLayers();
  };

  const handleLayerSelect = (layerId: string) => {
    setSelectedLayerId(layerId);
  };

  // Rectangle creation handler
  const handleRectangleCreate = (rectangle: any) => {
    console.log("🔷 Rectangle created:", rectangle);

    // Add to rectangles array
    setRectangles((prev) => [...prev, rectangle]);

    // Add to selected layer if one is selected
    if (selectedLayerId) {
      layerSystem.addObjectToLayer(selectedLayerId, rectangle.id);
      updateLayers();
    } else {
      // Add to default layer if no layer is selected
      const defaultLayer = layers.find((l) => l.name === "Default");
      if (defaultLayer) {
        layerSystem.addObjectToLayer(defaultLayer.id, rectangle.id);
        updateLayers();
      }
    }
  };

  // Rectangle selection handler
  const handleRectangleSelect = (rectangleId: string) => {
    console.log("🔷 Selecting rectangle:", rectangleId);
    setSelectedRectangleId(rectangleId);
    setSelectedObjectId(null); // Clear other selections
    setSelectedExtrusionId(null); // Clear extrusion selections
  };

  // Extrusion creation handler (for Push/Pull tool)
  const handleExtrusionCreate = (extrusion: any) => {
    console.log("🏗️ Extrusion created:", extrusion);
    setExtrusions((prev) => [...prev, extrusion]);

    // Add to selected layer if one is selected
    if (selectedLayerId) {
      layerSystem.addObjectToLayer(selectedLayerId, extrusion.id);
      updateLayers();
    }
  };

  // Extrusion selection handler
  const handleExtrusionSelect = (extrusionId: string) => {
    setSelectedExtrusionId(extrusionId);
    setSelectedRectangleId(null); // Clear other selections
    setSelectedObjectId(null);
  };

  // Initialize layers on mount
  useEffect(() => {
    updateLayers();
  }, []);

  // Backend DXF handlers - THE ULTIMATE SOLUTION
  const handleBackendDXFImport = (dxfObjects: BackendDXFObject[]) => {
    console.log("🚀 Backend DXF import complete:", dxfObjects);
    setBackendDXFs((prev) => [...prev, ...dxfObjects]);

    // Automatically create layers for imported DXF files
    dxfObjects.forEach((dxfObject) => {
      const layer = layerSystem.createDXFLayer(dxfObject);
      console.log(`📚 Created layer for DXF: ${layer.name}`);
    });
    updateLayers();

    // Auto-enable all layers
    const allLayers = dxfObjects.flatMap((obj) => obj.layers);
    const uniqueLayers = Array.from(
      new Set([...activeDXFLayers, ...allLayers])
    );
    setActiveDXFLayers(uniqueLayers);
  };

  const clearBackendDXFs = () => {
    setBackendDXFs([]);
  };

  // Step export handler (simplified)
  const handleStepExport = () => {
    console.log("📤 STEP export requested");
    // Implement STEP export functionality
  };

  // AI command handler (simplified)
  const handleAICommand = (command: string) => {
    console.log("🤖 AI command:", command);
    // Implement AI command functionality
  };

  // SketchUp-style keyboard shortcuts handler
  const handleSketchUpAction = (action: string) => {
    console.log("🎹 SketchUp action:", action);

    switch (action) {
      case "undo":
        // Implement undo functionality
        console.log("⬅️ Undo");
        break;
      case "redo":
        // Implement redo functionality
        console.log("➡️ Redo");
        break;
      case "save":
        // Implement save functionality
        console.log("💾 Save");
        break;
      case "deleteSelected":
        if (selectedObjectId) {
          setObjects((prev) =>
            prev.filter((obj) => obj.id !== selectedObjectId)
          );
          setSelectedObjectId(null);
          console.log("🗑️ Deleted selected object");
        }
        break;
      case "selectAll":
        console.log("🎯 Select All");
        break;
      case "cancelOperation":
        setSelectedObjectId(null);
        console.log("❌ Cancel operation");
        break;
      case "confirmOperation":
        console.log("✅ Confirm operation");
        break;
      case "isometric":
        console.log("📐 Isometric view");
        break;
      case "wireframe":
        console.log("🔲 Wireframe view");
        break;
      case "xray":
        console.log("👻 X-ray view");
        break;
      default:
        console.log("Unknown action:", action);
    }
  };

  function handleCreateExtrudedShape(shape: GeometryObject) {
    console.log("🏗️ Creating extruded shape:", shape);
    setObjects((prev) => [...prev, shape]);
  }

  function handleUpdateObject(id: string, updates: Partial<GeometryObject>) {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  }

  const isDrawingTool = (tool: string) => {
    return [
      "line",
      "rectangle",
      "circle",
      "push-pull",
      "cad_box",
      "cad_cylinder",
      "cad_sphere",
    ].includes(tool);
  };

  return (
    <div
      className={`h-screen flex flex-col bg-gray-100 overflow-hidden max-w-full ${
        activeTool === "rectangle" ? "cursor-crosshair" : "cursor-default"
      }`}
    >
      {/* SketchUp-style Keyboard Shortcuts */}
      <SketchUpKeyboardShortcuts
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onAction={handleSketchUpAction}
      />

      {/* SketchUp-style Tool Indicator */}
      {/* <SketchUpToolIndicator activeTool={activeTool} /> */}
      {/* Drawing measurements display (outside Canvas to avoid R3F errors) */}
      {drawingMeasurements && drawingMeasurements.isDrawing && (
        <div className="absolute top-20 left-4 bg-black/80 text-white p-3 rounded-lg text-sm font-mono z-50">
          <div className="text-yellow-300 mb-1">
            {drawingMeasurements.activeTool.toUpperCase()} Tool Active
          </div>
          {drawingMeasurements.measurements && (
            <div className="space-y-1">
              {Object.entries(drawingMeasurements.measurements).map(
                ([key, value]) => (
                  <div key={key} className="flex justify-between">
                    <span className="capitalize">{key}:</span>
                    <span className="ml-2 text-cyan-300">
                      {typeof value === "number"
                        ? value.toFixed(2)
                        : String(value)}
                      {typeof value === "number" && key === "volume"
                        ? "m³"
                        : ""}
                      {typeof value === "number" &&
                      (key === "baseArea" || key === "area")
                        ? "m²"
                        : ""}
                      {typeof value === "number" &&
                      !["angle", "volume", "baseArea", "area"].includes(key)
                        ? "m"
                        : ""}
                      {key === "angle" ? "°" : ""}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      {/* Top Menu Bar */}
      <TopMenuBar
        onDXFImport={() => setShowDXFImportModal(true)}
        onLayerManagerToggle={() => setShowLayerManager(!showLayerManager)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Toolbar */}
        <SimpleToolbar activeTool={activeTool} onToolChange={setActiveTool} />

        {/* Canvas Area */}
        <div className="flex-1 relative overflow-hidden">
          {/* Layer Manager Overlay */}
          {showLayerManager && (
            <div className="absolute top-4 left-4 z-20">
              <LayerManager
                layers={layers}
                onLayerUpdate={handleLayerUpdate}
                onLayerDelete={handleLayerDelete}
                onLayerCreate={handleLayerCreate}
                onLayerVisibilityChange={handleLayerVisibilityChange}
                onLayerLockChange={handleLayerLockChange}
                selectedLayerId={selectedLayerId || undefined}
                onLayerSelect={handleLayerSelect}
              />
            </div>
          )}

          {/* DXF Info Panel (top-right) */}
          {backendDXFs.length > 0 && (
            <div className="absolute top-4 right-4 space-y-4 z-10">
              <div className="bg-white rounded-lg shadow-lg p-4 max-w-xs">
                <BackendDXFInfo dxfObjects={backendDXFs} />
                <div className="flex space-x-2 mt-3">
                  <button
                    onClick={() => setShowLayerManager(!showLayerManager)}
                    className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
                  >
                    📚 {showLayerManager ? "Hide" : "Show"} Layers
                  </button>
                  <button
                    onClick={clearBackendDXFs}
                    className="flex-1 px-3 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors"
                  >
                    🗑️ Clear
                  </button>
                </div>
              </div>
            </div>
          )}

          <ClientOnly>
            <Canvas3D
              activeTool={activeTool}
              onRectangleCreate={handleRectangleCreate}
              onMeasurementUpdate={setDrawingMeasurements}
              selectedLayerId={selectedLayerId || undefined}
              onBackgroundClick={() => {
                // Auto-deselect when clicking on background
                console.log("🎯 Background clicked - clearing all selections");
                setSelectedRectangleId(null);
                setSelectedObjectId(null);
                setSelectedExtrusionId(null);
              }}
            >
              {/* Interactive Drawing Tools (for other tools) */}
              {isDrawingTool(activeTool) && activeTool !== "rectangle" && (
                <SimpleInteractiveDrawing
                  activeTool={activeTool}
                  onObjectCreate={(obj: any) => {
                    setObjects((prev) => [...prev, obj]);
                  }}
                  onMeasurementUpdate={setDrawingMeasurements}
                />
              )}

              {/* Working Rectangle Drawing Tool */}
              {activeTool === "rectangle" && (
                <WorkingRectangleTool
                  activeTool={activeTool}
                  onRectangleCreate={handleRectangleCreate}
                  onMeasurementUpdate={setDrawingMeasurements}
                  selectedLayerId={selectedLayerId || undefined}
                  layers={layers}
                />
              )}

              {/* Push/Pull Tool */}
              {activeTool === "push-pull" && (
                <PushPullTool
                  activeTool={activeTool}
                  rectangles={rectangles}
                  onExtrusionCreate={handleExtrusionCreate}
                  onMeasurementUpdate={setDrawingMeasurements}
                />
              )}

              {/* Backend DXF Renderer - THE ULTIMATE SOLUTION */}
              <BackendDXFRenderer
                dxfObjects={backendDXFs}
                activeLayers={activeDXFLayers}
              />

              {/* Rectangle Renderer */}
              <RectangleRenderer
                rectangles={rectangles}
                selectedObjectId={selectedRectangleId || undefined}
                onRectangleSelect={handleRectangleSelect}
                selectedLayerId={selectedLayerId || undefined}
                layers={layers}
              />

              {/* Extrusion Renderer */}
              <ExtrusionRenderer
                extrusions={extrusions}
                selectedObjectId={selectedExtrusionId || undefined}
                onExtrusionSelect={handleExtrusionSelect}
                selectedLayerId={selectedLayerId || undefined}
                layers={layers}
              />

              {/* Legacy object rendering - enabled while GeometryManager has type conflicts */}
              {true &&
                objects.map((obj) => {
                  const isSelected = selectedObjectId === obj.id;

                  // Handle CAD mesh objects (from OpenCascade.js)
                  if (obj.cadMesh) {
                    return (
                      <primitive
                        key={obj.id}
                        object={obj.cadMesh}
                        position={obj.position}
                        rotation={obj.rotation || [0, 0, 0]}
                        scale={obj.scale || [1, 1, 1]}
                        onClick={(e: any) => {
                          e.stopPropagation();
                          setSelectedObjectId(obj.id);
                        }}
                        userData={{ id: obj.id, type: obj.type }}
                      />
                    );
                  }

                  // Handle regular geometry objects
                  return (
                    <mesh
                      key={obj.id}
                      position={obj.position}
                      rotation={obj.rotation || [0, 0, 0]}
                      scale={obj.scale || [1, 1, 1]}
                      onClick={(e: any) => {
                        e.stopPropagation();
                        setSelectedObjectId(obj.id);
                      }}
                      userData={{ id: obj.id, type: obj.type }}
                    >
                      {obj.type === "box" && (
                        <boxGeometry
                          args={[
                            obj.width || 1,
                            obj.height || 1,
                            obj.depth || 1,
                          ]}
                        />
                      )}
                      {obj.type === "sphere" && (
                        <sphereGeometry args={[obj.radius || 0.5]} />
                      )}
                      {obj.type === "cylinder" && (
                        <cylinderGeometry
                          args={[
                            obj.radius || 0.5,
                            obj.radius || 0.5,
                            obj.height || 1,
                          ]}
                        />
                      )}
                      {obj.type === "plane" && (
                        <planeGeometry
                          args={[obj.width || 1, obj.height || 1]}
                        />
                      )}
                      <meshStandardMaterial
                        color={isSelected ? "#ff6b6b" : obj.color || "#888"}
                        wireframe={isSelected}
                      />
                    </mesh>
                  );
                })}
            </Canvas3D>
          </ClientOnly>
        </div>
      </div>

      {/* Bottom Chat */}
      <BottomChat />

      {/* DXF Import Modal */}
      <DXFImportModal
        isOpen={showDXFImportModal}
        onClose={() => setShowDXFImportModal(false)}
        onImportComplete={handleBackendDXFImport}
      />

      {/* Rectangle Manager Panel - Bottom Right */}
      {rectangles.length > 0 && showRectangleManager && (
        <div className="fixed bottom-20 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80">
            <div className="bg-gradient-to-r from-green-500 to-green-600 text-white p-4 rounded-t-lg relative">
              <h3 className="text-lg font-semibold pr-8">
                🔷 Rectangle Manager
              </h3>
              <div className="text-sm opacity-90">
                {rectangles.length} rectangle
                {rectangles.length !== 1 ? "s" : ""} created
              </div>
              {/* Close Button */}
              <button
                onClick={() => setShowRectangleManager(false)}
                className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors duration-200"
                title="Close Rectangle Manager"
                aria-label="Close Rectangle Manager"
              >
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto">
              {rectangles.map((rectangle) => (
                <div
                  key={rectangle.id}
                  className={`p-3 border-b border-gray-100 cursor-pointer transition-colors ${
                    selectedRectangleId === rectangle.id
                      ? "bg-blue-50 border-l-4 border-blue-500"
                      : "hover:bg-gray-50"
                  }`}
                  onClick={() => handleRectangleSelect(rectangle.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg">🔷</span>
                      <span className="font-medium text-gray-900">
                        {rectangle.width.toFixed(2)}m ×{" "}
                        {rectangle.height.toFixed(2)}m
                      </span>
                    </div>
                    <div className="text-xs text-gray-500">
                      {rectangle.area.toFixed(2)}m²
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-gray-600">
                    <div>Perimeter: {rectangle.perimeter.toFixed(2)}m</div>
                    <div>Layer: {rectangle.layerId}</div>
                    <div>
                      Created: {rectangle.createdAt.toLocaleTimeString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200">
              <div className="flex space-x-2">
                <button
                  onClick={() => setRectangles([])}
                  className="flex-1 px-3 py-2 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition-colors"
                >
                  🗑️ Clear All
                </button>
                <button
                  onClick={() => setSelectedRectangleId(null)}
                  className="flex-1 px-3 py-2 bg-gray-500 text-white rounded text-sm hover:bg-gray-600 transition-colors"
                >
                  ✨ Deselect
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Show Rectangle Manager Button (when hidden) */}
      {rectangles.length > 0 && !showRectangleManager && (
        <div className="fixed bottom-20 right-4 z-50">
          <button
            onClick={() => setShowRectangleManager(true)}
            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
            title="Show Rectangle Manager"
            aria-label="Show Rectangle Manager"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
          </button>
        </div>
      )}

      {/* SketchUp-style Keyboard Shortcuts Display */}
      <SketchUpShortcutsDisplay />
    </div>
  );
}
