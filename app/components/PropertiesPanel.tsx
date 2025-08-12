"use client";

import { useState } from "react";

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
    | "extruded"
    | "cad_box"
    | "cad_cylinder"
    | "cad_sphere"
    | "cad_union"
    | "cad_difference"
    | "cad_intersection"
    | "cad_fillet"
    | "cad_chamfer";
  position: [number, number, number];
  rotation: [number, number, number];
  scale: [number, number, number];
  color: string;
  selected: boolean;
  lineStart?: [number, number, number];
  lineEnd?: [number, number, number];
  length?: number;
  width?: number;
  height?: number;
  radius?: number;
  // CAD-specific properties
  cadShape?: any;
  cadMesh?: any;
  filletRadius?: number;
  chamferDistance?: number;
}

interface PropertiesPanelProps {
  selectedObject: GeometryObject | null;
  onUpdateObject: (objectId: string, updates: Partial<GeometryObject>) => void;
}

export default function PropertiesPanel({
  selectedObject,
  onUpdateObject,
}: PropertiesPanelProps) {
  const [collapsed, setCollapsed] = useState(false);

  if (!selectedObject) {
    return (
      <div className="absolute right-4 top-4 w-64 bg-white shadow-lg rounded-lg border p-4">
        <h3 className="font-semibold text-gray-700 mb-2">Properties</h3>
        <p className="text-gray-500 text-sm">
          Select an object to edit its properties
        </p>
      </div>
    );
  }

  const handlePositionChange = (axis: 0 | 1 | 2, value: number) => {
    const newPosition = [...selectedObject.position] as [
      number,
      number,
      number
    ];
    newPosition[axis] = value;
    onUpdateObject(selectedObject.id, { position: newPosition });
  };

  const handleRotationChange = (axis: 0 | 1 | 2, value: number) => {
    const newRotation = [...selectedObject.rotation] as [
      number,
      number,
      number
    ];
    newRotation[axis] = (value * Math.PI) / 180; // Convert to radians
    onUpdateObject(selectedObject.id, { rotation: newRotation });
  };

  const handleScaleChange = (axis: 0 | 1 | 2, value: number) => {
    const newScale = [...selectedObject.scale] as [number, number, number];
    newScale[axis] = value;
    onUpdateObject(selectedObject.id, { scale: newScale });
  };

  return (
    <div
      className={`absolute right-4 top-4 bg-white !text-black shadow-lg rounded-lg border transition-all duration-300 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="p-2 border-b flex items-center justify-between">
        <h3
          className={`font-semibold text-gray-700 ${
            collapsed ? "hidden" : "block"
          }`}
        >
          Properties
        </h3>
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          {collapsed ? "◀️" : "▶️"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Object Type
            </label>
            <div className="px-3 py-2 bg-gray-50 rounded-md text-sm capitalize">
              {selectedObject.type}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Color
            </label>
            <input
              type="color"
              value={selectedObject.color}
              onChange={(e) =>
                onUpdateObject(selectedObject.id, { color: e.target.value })
              }
              className="w-full h-8 rounded-md border border-gray-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Position
            </label>
            <div className="space-y-2">
              {["X", "Y", "Z"].map((axis, index) => (
                <div key={axis} className="flex items-center space-x-2">
                  <span className="w-4 text-xs font-medium text-gray-500">
                    {axis}:
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    value={selectedObject.position[index].toFixed(2)}
                    onChange={(e) =>
                      handlePositionChange(
                        index as 0 | 1 | 2,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Rotation (degrees)
            </label>
            <div className="space-y-2">
              {["X", "Y", "Z"].map((axis, index) => (
                <div key={axis} className="flex items-center space-x-2">
                  <span className="w-4 text-xs font-medium text-gray-500">
                    {axis}:
                  </span>
                  <input
                    type="number"
                    step="1"
                    value={(
                      (selectedObject.rotation[index] * 180) /
                      Math.PI
                    ).toFixed(0)}
                    onChange={(e) =>
                      handleRotationChange(
                        index as 0 | 1 | 2,
                        parseFloat(e.target.value) || 0
                      )
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Dimensions Section */}
          {(selectedObject.length !== undefined ||
            selectedObject.width !== undefined ||
            selectedObject.radius !== undefined) && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dimensions
              </label>
              <div className="space-y-2">
                {selectedObject.length !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Length:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.length.toFixed(2)}
                      onChange={(e) => {
                        const newLength = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          length: newLength,
                        });
                        // Update line endpoints if it's a line
                        if (
                          selectedObject.type === "line" &&
                          selectedObject.lineStart &&
                          selectedObject.lineEnd
                        ) {
                          const direction = new Array(3)
                            .fill(0)
                            .map(
                              (_, i) =>
                                selectedObject.lineEnd![i] -
                                selectedObject.lineStart![i]
                            );
                          const currentLength = Math.sqrt(
                            direction.reduce((sum, d) => sum + d * d, 0)
                          );
                          const scale = newLength / currentLength;
                          const newEnd = selectedObject.lineStart.map(
                            (start, i) => start + direction[i] * scale
                          ) as [number, number, number];
                          onUpdateObject(selectedObject.id, {
                            lineEnd: newEnd,
                            length: newLength,
                          });
                        }
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}
                {selectedObject.width !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Width:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.width.toFixed(2)}
                      onChange={(e) => {
                        const newWidth = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          width: newWidth,
                          scale: [
                            newWidth,
                            selectedObject.scale[1],
                            selectedObject.scale[2],
                          ] as [number, number, number],
                        });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}
                {selectedObject.height !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Height:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.height.toFixed(2)}
                      onChange={(e) => {
                        const newHeight = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          height: newHeight,
                          scale: [
                            selectedObject.scale[0],
                            selectedObject.scale[1],
                            newHeight,
                          ] as [number, number, number],
                        });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}
                {selectedObject.radius !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Radius:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.radius.toFixed(2)}
                      onChange={(e) => {
                        const newRadius = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          radius: newRadius,
                          scale: [
                            newRadius,
                            selectedObject.scale[1],
                            newRadius,
                          ] as [number, number, number],
                        });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}

                {/* CAD-specific properties */}
                {selectedObject.filletRadius !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Fillet:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.filletRadius.toFixed(2)}
                      onChange={(e) => {
                        const newRadius = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          filletRadius: newRadius,
                        });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}
                {selectedObject.chamferDistance !== undefined && (
                  <div className="flex items-center space-x-2">
                    <span className="w-12 text-xs font-medium text-gray-500">
                      Chamfer:
                    </span>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={selectedObject.chamferDistance.toFixed(2)}
                      onChange={(e) => {
                        const newDistance = parseFloat(e.target.value) || 0.1;
                        onUpdateObject(selectedObject.id, {
                          chamferDistance: newDistance,
                        });
                      }}
                      className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                    />
                    <span className="text-xs text-gray-400">m</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* CAD Object Information */}
          {selectedObject.type.startsWith("cad_") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                CAD Information
              </label>
              <div className="bg-blue-50 p-3 rounded-md">
                <p className="text-xs text-blue-700 mb-1">
                  <strong>Type:</strong>{" "}
                  {selectedObject.type.replace("cad_", "").toUpperCase()}
                </p>
                <p className="text-xs text-blue-600">
                  Professional CAD object created with OpenCascade.js
                </p>
                {selectedObject.type === "cad_union" && (
                  <p className="text-xs text-blue-600 mt-1">
                    Result of Boolean Union operation
                  </p>
                )}
                {selectedObject.type === "cad_difference" && (
                  <p className="text-xs text-blue-600 mt-1">
                    Result of Boolean Difference operation
                  </p>
                )}
                {selectedObject.type === "cad_intersection" && (
                  <p className="text-xs text-blue-600 mt-1">
                    Result of Boolean Intersection operation
                  </p>
                )}
                {selectedObject.type === "cad_fillet" && (
                  <p className="text-xs text-blue-600 mt-1">
                    Filleted object with rounded edges
                  </p>
                )}
                {selectedObject.type === "cad_chamfer" && (
                  <p className="text-xs text-blue-600 mt-1">
                    Chamfered object with angled edges
                  </p>
                )}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Scale
            </label>
            <div className="space-y-2">
              {["X", "Y", "Z"].map((axis, index) => (
                <div key={axis} className="flex items-center space-x-2">
                  <span className="w-4 text-xs font-medium text-gray-500">
                    {axis}:
                  </span>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    value={selectedObject.scale[index].toFixed(2)}
                    onChange={(e) =>
                      handleScaleChange(
                        index as 0 | 1 | 2,
                        parseFloat(e.target.value) || 0.1
                      )
                    }
                    className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
