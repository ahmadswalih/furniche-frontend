"use client";

import { useState } from "react";
import Canvas3D from "./components/Canvas3D";
import ClientOnly from "./components/ClientOnly";
import Toolbar from "./components/Toolbar";
import PropertiesPanel from "./components/PropertiesPanel";
import GeometryManager from "./components/GeometryManager";
import CenterAIAssistant from "./components/CenterAIAssistant";
import FloatingAIPrompt from "./components/FloatingAIPrompt";
import DXFImporter from "./components/DXFImporter";
import SimpleDXFImporter, {
  SimpleDXFObject,
} from "./components/SimpleDXFImporter";
import SimpleDXFRenderer, {
  SimpleDXFInfo,
} from "./components/SimpleDXFRenderer";
import ProfessionalDXFImporter, {
  ProfessionalDXFObject,
} from "./components/ProfessionalDXFImporter";
import ProfessionalDXFRenderer, {
  ProfessionalDXFInfo,
} from "./components/ProfessionalDXFRenderer";
import SketchUpStyleDXFImporter, {
  SketchUpDXFObject,
} from "./components/SketchUpStyleDXFImporter";
import SketchUpStyleDXFRenderer, {
  SketchUpDXFInfo,
} from "./components/SketchUpStyleDXFRenderer";
import BackendDXFImporter, {
  BackendDXFObject,
} from "./components/BackendDXFImporter";
import BackendDXFRenderer, {
  BackendDXFInfo,
} from "./components/BackendDXFRenderer";
import ComprehensiveDXFImporter, {
  DXFFloorPlan,
} from "./components/ComprehensiveDXFImporter";
import ComprehensiveDXFRenderer, {
  DXFFloorPlanControls,
  DXFFloorPlanInfo,
} from "./components/ComprehensiveDXFRenderer";
import ProperDXFImporter, {
  DXFViewerResult,
} from "./components/ProperDXFImporter";
import ProperDXFRenderer, {
  ProperDXFControls,
  ProperDXFInfo,
} from "./components/ProperDXFRenderer";
import ExtrudeManager from "./components/ExtrudeManager";
import DXFPreview from "./components/DXFPreview";
import SimpleInteractiveDrawing from "./components/SimpleInteractiveDrawing";
import SimpleTransformControls from "./components/SimpleTransformControls";
import OpenCascadeCAD from "./components/OpenCascadeCAD";
import OpenCascadeTest from "./components/OpenCascadeTest";
import DirectDXFParser, { DXFEntity } from "./components/DirectDXFParser";
import ProfessionalDXFParser from "./components/ProfessionalDXFParser";
import DirectDXFRenderer, {
  DirectDXFLayerControls,
} from "./components/DirectDXFRenderer";
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
  const [dxfPreviewObjects, setDxfPreviewObjects] = useState<any[]>([]);
  const [isDxfPreviewing, setIsDxfPreviewing] = useState(false);
  const [drawingMeasurements, setDrawingMeasurements] = useState<any>(null);

  // Proper DXF state - MAIN IMPORTER USING dxf-viewer
  const [properDXFs, setProperDXFs] = useState<DXFViewerResult[]>([]);

  // DXF state - Simple and reliable (backup)
  const [simpleDXFs, setSimpleDXFs] = useState<SimpleDXFObject[]>([]);

  // Professional DXF state
  const [professionalDXFs, setProfessionalDXFs] = useState<
    ProfessionalDXFObject[]
  >([]);

  // SketchUp-style DXF state
  const [sketchUpDXFs, setSketchUpDXFs] = useState<SketchUpDXFObject[]>([]);

  // Backend-powered DXF state - THE ULTIMATE SOLUTION
  const [backendDXFs, setBackendDXFs] = useState<BackendDXFObject[]>([]);

  // Comprehensive DXF state - BACKUP IMPORTER
  const [comprehensiveDXFs, setComprehensiveDXFs] = useState<DXFFloorPlan[]>(
    []
  );
  const [activeDXFLayers, setActiveDXFLayers] = useState<string[]>([]);

  // Direct DXF state - NO SEPARATE CANVAS (main solution)
  const [directDXFEntities, setDirectDXFEntities] = useState<DXFEntity[]>([]);
  const [visibleDXFLayers, setVisibleDXFLayers] = useState<Set<string>>(
    new Set()
  );

  const selectedObject =
    objects.find((obj) => obj.id === selectedObjectId) || null;
  const { handleDXFFile } = DXFImporter({
    onImportComplete: handleDXFImportPreview,
  });

  // Proper DXF handlers - MAIN IMPORTER USING dxf-viewer
  const handleProperDXFImport = (result: DXFViewerResult) => {
    console.log("🏗️ Importing proper DXF floor plan:", result);
    setProperDXFs((prev) => [...prev, result]);
  };

  const removeProperDXF = (id: string) => {
    setProperDXFs((prev) => {
      const result = prev.find((r) => r.id === id);
      if (result?.viewer) {
        try {
          result.viewer.Destroy();
        } catch (err) {
          console.warn("Error destroying DXF viewer:", err);
        }
      }
      return prev.filter((r) => r.id !== id);
    });
  };

  const clearAllProperDXFs = () => {
    properDXFs.forEach((result) => {
      if (result.viewer) {
        try {
          result.viewer.Destroy();
        } catch (err) {
          console.warn("Error destroying DXF viewer:", err);
        }
      }
    });
    setProperDXFs([]);
  };

  // Comprehensive DXF handlers - BACKUP IMPORTER
  const handleComprehensiveDXFImport = (floorPlan: DXFFloorPlan) => {
    console.log("🏗️ Importing comprehensive DXF floor plan:", floorPlan);
    setComprehensiveDXFs((prev) => [...prev, floorPlan]);

    // Auto-enable all layers for the new floor plan
    const newLayers = Object.keys(floorPlan.layers);
    setActiveDXFLayers((prev) => Array.from(new Set([...prev, ...newLayers])));
  };

  const handleComprehensiveDXFLayerToggle = (
    floorPlanId: string,
    layer: string,
    visible: boolean
  ) => {
    setActiveDXFLayers((prev) => {
      if (visible) {
        return Array.from(new Set([...prev, layer]));
      } else {
        return prev.filter((l) => l !== layer);
      }
    });
  };

  const clearAllComprehensiveDXFs = () => {
    setComprehensiveDXFs([]);
    setActiveDXFLayers([]);
  };

  // Direct DXF handlers - NO SEPARATE CANVAS SOLUTION
  const handleDirectDXFLoaded = (entities: DXFEntity[]) => {
    console.log("🎯 Direct DXF loaded - NO separate canvas:", entities.length);
    setDirectDXFEntities(entities);

    // Initialize all layers as visible
    const layers = new Set(entities.map((e) => e.layer || "0"));
    setVisibleDXFLayers(layers);
  };

  const handleDirectDXFLayerToggle = (layer: string, visible: boolean) => {
    setVisibleDXFLayers((prev) => {
      const newSet = new Set(prev);
      if (visible) {
        newSet.add(layer);
      } else {
        newSet.delete(layer);
      }
      return newSet;
    });
  };

  const clearDirectDXF = () => {
    setDirectDXFEntities([]);
    setVisibleDXFLayers(new Set());
  };

  // Simple DXF handlers - FALLBACK IMPORTER
  const handleSimpleDXFImport = (dxfObjects: SimpleDXFObject[]) => {
    console.log("🏗️ Importing simple DXF objects:", dxfObjects);
    setSimpleDXFs((prev) => [...prev, ...dxfObjects]);
  };

  const handleProfessionalDXFImport = (dxfObjects: ProfessionalDXFObject[]) => {
    console.log("🎯 Importing professional DXF objects:", dxfObjects);
    setProfessionalDXFs((prev) => [...prev, ...dxfObjects]);

    // Auto-enable all layers
    const allLayers = dxfObjects.flatMap((obj) => obj.layers);
    const uniqueLayers = Array.from(
      new Set([...activeDXFLayers, ...allLayers])
    );
    setActiveDXFLayers(uniqueLayers);
  };

  const handleSketchUpDXFImport = (dxfObjects: SketchUpDXFObject[]) => {
    console.log("🎨 Importing SketchUp-style DXF objects:", dxfObjects);
    setSketchUpDXFs((prev) => [...prev, ...dxfObjects]);

    // Auto-enable all layers
    const allLayers = dxfObjects.flatMap((obj) => obj.layers);
    const uniqueLayers = Array.from(
      new Set([...activeDXFLayers, ...allLayers])
    );
    setActiveDXFLayers(uniqueLayers);
  };

  // Backend DXF handlers - THE ULTIMATE SOLUTION
  const handleBackendDXFImport = (dxfObjects: BackendDXFObject[]) => {
    console.log("🚀 Backend DXF import complete:", dxfObjects);
    setBackendDXFs((prev) => [...prev, ...dxfObjects]);

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

  const clearAllSimpleDXFs = () => {
    setSimpleDXFs([]);
  };

  function handleDXFImportPreview(entities: any[]) {
    console.log("🏗️ DXF Import Preview - entities received:", entities);
    setDxfPreviewObjects(entities);
    setIsDxfPreviewing(true);
  }

  function handleDXFImport(position: [number, number, number]) {
    if (dxfPreviewObjects.length === 0) return;

    console.log("🏗️ Placing DXF at position:", position);

    const newDxfObject: GeometryObject = {
      id: `dxf-${Date.now()}`,
      type: "dxf",
      position,
      dxfEntities: dxfPreviewObjects,
      fileName: "imported-dxf",
    };

    setObjects((prev) => [...prev, newDxfObject]);
    setDxfPreviewObjects([]);
    setIsDxfPreviewing(false);
  }

  function handleCreateExtrudedShape(shape: GeometryObject) {
    console.log("🏗️ Creating extruded shape:", shape);
    setObjects((prev) => [...prev, shape]);
  }

  function handleUpdateObject(id: string, updates: Partial<GeometryObject>) {
    setObjects((prev) =>
      prev.map((obj) => (obj.id === id ? { ...obj, ...updates } : obj))
    );
  }

  function handleStepExport() {
    console.log("📤 Exporting STEP file...");
    // This will be handled by the OpenCascade service
    alert("STEP export functionality coming soon!");
  }

  const handleAICommand = (command: string) => {
    const cmd = command.toLowerCase();

    if (
      cmd.includes("create") &&
      (cmd.includes("cube") || cmd.includes("box"))
    ) {
      const newBox: GeometryObject = {
        id: `ai-box-${Date.now()}`,
        type: "box",
        position: [0, 1, 0],
        width: 2,
        height: 2,
        depth: 2,
        color: "#4f46e5",
      };
      setObjects((prev) => [...prev, newBox]);
    } else if (cmd.includes("create") && cmd.includes("sphere")) {
      const newSphere: GeometryObject = {
        id: `ai-sphere-${Date.now()}`,
        type: "sphere",
        position: [0, 1, 0],
        radius: 1,
        color: "#ef4444",
      };
      setObjects((prev) => [...prev, newSphere]);
    } else if (cmd.includes("delete") && cmd.includes("all")) {
      setObjects([]);
    } else if (cmd.includes("clear")) {
      setObjects([]);
    }
  };

  const isDrawingTool = (tool: string) => {
    return [
      "line",
      "rectangle",
      "circle",
      "cad_box",
      "cad_cylinder",
      "cad_sphere",
    ].includes(tool);
  };

  return (
    <div className="h-screen flex flex-col bg-gray-100">
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
                      {typeof value === "number" && key !== "angle" ? "m" : ""}
                      {key === "angle" ? "°" : ""}
                    </span>
                  </div>
                )
              )}
            </div>
          )}
        </div>
      )}

      <Toolbar
        activeTool={activeTool}
        onToolChange={setActiveTool}
        onDxfImport={handleDXFFile}
        onStepExport={handleStepExport}
      />

      <PropertiesPanel
        selectedObject={selectedObject as any}
        onUpdateObject={(objectId: string, updates: any) => {
          handleUpdateObject(objectId, updates);
        }}
      />

      {/* DXF Control Panel - MAIN INTERFACE */}
      <div className="absolute top-4 right-4 space-y-4 z-10">
        {/* Proper DXF Floor Plans - MAIN */}
        {properDXFs.length > 0 && (
          <>
            <ProperDXFControls
              dxfResults={properDXFs}
              onRemove={removeProperDXF}
              onClearAll={clearAllProperDXFs}
            />
            <ProperDXFInfo dxfResults={properDXFs} />
          </>
        )}

        {/* Comprehensive DXF Floor Plans - BACKUP */}
        {comprehensiveDXFs.length > 0 && (
          <>
            <DXFFloorPlanControls
              floorPlans={comprehensiveDXFs}
              activeLayers={activeDXFLayers}
              onLayerToggle={handleComprehensiveDXFLayerToggle}
              onFloorPlanToggle={(floorPlanId, visible) => {
                console.log(`Toggle floor plan ${floorPlanId}: ${visible}`);
              }}
            />
            <DXFFloorPlanInfo floorPlans={comprehensiveDXFs} />
            <button
              onClick={clearAllComprehensiveDXFs}
              className="w-full px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors"
            >
              🗑️ Clear Custom Floor Plans
            </button>
          </>
        )}

        {/* Backend DXF Info - THE ULTIMATE SOLUTION */}
        {backendDXFs.length > 0 && (
          <>
            <BackendDXFInfo dxfObjects={backendDXFs} />
            <button
              onClick={clearBackendDXFs}
              className="w-full px-3 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 transition-colors"
            >
              🗑️ Clear Backend DXFs
            </button>
          </>
        )}

        {/* SketchUp-style DXF Info */}
        {sketchUpDXFs.length > 0 && (
          <>
            <SketchUpDXFInfo dxfObjects={sketchUpDXFs} />
            <button
              onClick={() => setSketchUpDXFs([])}
              className="w-full px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors"
            >
              🗑️ Clear SketchUp DXFs
            </button>
          </>
        )}

        {/* Professional DXF Info */}
        {professionalDXFs.length > 0 && (
          <>
            <ProfessionalDXFInfo dxfObjects={professionalDXFs} />
            <button
              onClick={() => setProfessionalDXFs([])}
              className="w-full px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700 transition-colors"
            >
              🗑️ Clear Professional DXFs
            </button>
          </>
        )}

        {/* Simple DXF Fallback */}
        {simpleDXFs.length > 0 && (
          <>
            <SimpleDXFInfo dxfObjects={simpleDXFs} />
            <button
              onClick={clearAllSimpleDXFs}
              className="w-full px-3 py-2 bg-yellow-600 text-white rounded-lg text-sm hover:bg-yellow-700 transition-colors"
            >
              🗑️ Clear Simple DXFs
            </button>
          </>
        )}

        {/* DXF Import Interface */}
        <div className="bg-white rounded-lg shadow-lg p-4">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">
            🏗️ Floor Plan Import
          </h3>

          {/* MAIN BACKEND DXF IMPORTER - THE ULTIMATE SOLUTION */}
          <div className="space-y-3">
            <div className="p-3 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-400 rounded-lg">
              <h4 className="text-sm font-semibold text-indigo-800 mb-2">
                🚀 Backend-Powered DXF Import (ULTIMATE!)
              </h4>
              <p className="text-xs text-indigo-700 mb-3">
                Professional Python-powered DXF processing with ezdxf + shapely
                for perfect SketchUp-level results!
              </p>
              <BackendDXFImporter onImportComplete={handleBackendDXFImport} />
            </div>

            <div className="p-3 bg-gradient-to-r from-green-50 to-blue-50 border border-green-300 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                🎨 SketchUp-Style DXF Import (Frontend Only)
              </h4>
              <p className="text-xs text-green-700 mb-3">
                Import with options dialog, filled faces, and proper unit
                scaling - frontend processing only
              </p>
              <SketchUpStyleDXFImporter
                onImportComplete={handleSketchUpDXFImport}
              />
            </div>

            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="text-sm font-semibold text-green-800 mb-2">
                🎯 Professional DXF (Like FreeCAD)
              </h4>
              <p className="text-xs text-green-700 mb-3">
                Professional DXF parser using dxf-parser library - clean vector
                lines like FreeCAD
              </p>
              <ProfessionalDXFParser onDXFLoaded={handleDirectDXFLoaded} />
            </div>

            {/* BACKUP COMPREHENSIVE IMPORTER */}
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="text-sm font-semibold text-blue-800 mb-2">
                🔧 Custom Parser
              </h4>
              <p className="text-xs text-blue-700 mb-3">
                Custom DXF parser (backup option if main importer has issues)
              </p>
              <ComprehensiveDXFImporter
                onImportComplete={handleComprehensiveDXFImport}
              />
            </div>
          </div>

          {/* Alternative importers */}
          <details className="mt-4">
            <summary className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
              📐 Alternative Importers
            </summary>
            <div className="mt-3 space-y-3">
              <div className="p-2 bg-gray-50 rounded">
                <h5 className="text-xs font-medium text-gray-600 mb-1">
                  Canvas-Based DXF (Separate Canvas)
                </h5>
                <p className="text-xs text-gray-500 mb-2">
                  Note: May cause UI conflicts
                </p>
                <ProperDXFImporter onImportComplete={handleProperDXFImport} />
              </div>

              <div className="p-2 bg-gray-50 rounded">
                <h5 className="text-xs font-medium text-gray-600 mb-1">
                  Custom Direct Parser
                </h5>
                <DirectDXFParser onDXFLoaded={handleDirectDXFLoaded} />
              </div>

              <div className="p-2 bg-gray-50 rounded">
                <h5 className="text-xs font-medium text-gray-600 mb-1">
                  Basic DXF
                </h5>
                <SimpleDXFImporter onImportComplete={handleSimpleDXFImport} />
              </div>

              <div className="p-2 bg-purple-50 rounded border border-purple-200">
                <h5 className="text-xs font-medium text-purple-700 mb-1">
                  🎯 Professional DXF (three-dxf approach)
                </h5>
                <p className="text-xs text-purple-600 mb-2">
                  Industry-standard DXF parsing with proper coordinate system
                </p>
                <ProfessionalDXFImporter
                  onImportComplete={handleProfessionalDXFImport}
                />
              </div>
            </div>
          </details>
        </div>

        {/* Direct DXF Layer Controls */}
        {directDXFEntities.length > 0 && (
          <DirectDXFLayerControls
            entities={directDXFEntities}
            onLayerToggle={handleDirectDXFLayerToggle}
            onClear={clearDirectDXF}
          />
        )}
      </div>

      <div className="flex-1 relative">
        <ClientOnly>
          <Canvas3D activeTool={activeTool}>
            {/* Interactive Drawing Tools */}
            {isDrawingTool(activeTool) && (
              <SimpleInteractiveDrawing
                activeTool={activeTool}
                onObjectCreate={(obj: any) => {
                  setObjects((prev) => [...prev, obj]);
                }}
                onMeasurementUpdate={setDrawingMeasurements}
              />
            )}

            {/* DIRECT DXF RENDERER - MAIN VECTOR SOLUTION (NO SEPARATE CANVAS) */}
            <DirectDXFRenderer
              entities={directDXFEntities.filter((entity) =>
                visibleDXFLayers.has(entity.layer || "0")
              )}
              position={[0, 0.01, 0]}
              scale={1}
              visible={true}
            />

            {/* PROPER DXF RENDERER - BACKUP (SEPARATE CANVAS) */}
            <ProperDXFRenderer
              dxfResults={properDXFs}
              onRemove={removeProperDXF}
            />

            {/* COMPREHENSIVE DXF RENDERER - BACKUP FLOOR PLAN IMPORTER */}
            <ComprehensiveDXFRenderer
              floorPlans={comprehensiveDXFs}
              activeLayers={activeDXFLayers}
              onLayerVisibilityChange={handleComprehensiveDXFLayerToggle}
            />

            {/* Simple DXF Renderer - Fallback */}
            <SimpleDXFRenderer dxfObjects={simpleDXFs} />

            {/* Professional DXF Renderer - Based on three-dxf approach */}
            <ProfessionalDXFRenderer
              dxfObjects={professionalDXFs}
              activeLayers={activeDXFLayers}
            />

            {/* Backend DXF Renderer - THE ULTIMATE SOLUTION */}
            <BackendDXFRenderer
              dxfObjects={backendDXFs}
              activeLayers={activeDXFLayers}
            />

            {/* SketchUp-style DXF Renderer - With filled faces */}
            <SketchUpStyleDXFRenderer
              dxfObjects={sketchUpDXFs}
              activeLayers={activeDXFLayers}
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
                        args={[obj.width || 1, obj.height || 1, obj.depth || 1]}
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
                      <planeGeometry args={[obj.width || 1, obj.height || 1]} />
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

      <CenterAIAssistant onCommand={handleAICommand} />
      <FloatingAIPrompt onCommand={handleAICommand} />
      <OpenCascadeTest />
    </div>
  );
}
