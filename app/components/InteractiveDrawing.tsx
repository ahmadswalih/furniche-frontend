"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

interface InteractiveDrawingProps {
  activeTool: string;
  onObjectCreate: (object: any) => void;
  onDrawingStart: () => void;
  onDrawingEnd: () => void;
}

interface DrawingState {
  isDrawing: boolean;
  startPoint: THREE.Vector3 | null;
  currentPoint: THREE.Vector3 | null;
  previewObject: any;
}

export default function InteractiveDrawing({
  activeTool,
  onObjectCreate,
  onDrawingStart,
  onDrawingEnd,
}: InteractiveDrawingProps) {
  const { camera, raycaster } = useThree();
  const [drawingState, setDrawingState] = useState<DrawingState>({
    isDrawing: false,
    startPoint: null,
    currentPoint: null,
    previewObject: null,
  });

  const [showDimensionInput, setShowDimensionInput] = useState(false);
  const [dimensionValue, setDimensionValue] = useState("");
  const [dimensionType, setDimensionType] = useState<
    "length" | "width" | "radius"
  >("length");

  const groundPlaneRef = useRef<THREE.Mesh>(null);

  const getGroundIntersection = useCallback(
    (event: any) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);

      // Create an invisible ground plane for intersection
      const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
      const groundMaterial = new THREE.MeshBasicMaterial({ visible: false });
      const ground = new THREE.Mesh(groundGeometry, groundMaterial);
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = 0;

      const intersects = raycaster.intersectObject(ground);
      if (intersects.length > 0) {
        return intersects[0].point;
      }
      return null;
    },
    [camera, raycaster]
  );

  const handleCanvasClick = useCallback(
    (event: any) => {
      if (!["line", "rectangle", "circle"].includes(activeTool)) return;

      const point = getGroundIntersection(event);
      if (!point) return;

      if (!drawingState.isDrawing) {
        // Start drawing
        setDrawingState({
          isDrawing: true,
          startPoint: point.clone(),
          currentPoint: point.clone(),
          previewObject: null,
        });
        onDrawingStart();
      } else {
        // End drawing
        finishDrawing(point);
      }
    },
    [activeTool, drawingState.isDrawing, getGroundIntersection, onDrawingStart]
  );

  const handleMouseMove = useCallback(
    (event: any) => {
      if (!drawingState.isDrawing || !drawingState.startPoint) return;

      const point = getGroundIntersection(event);
      if (!point) return;

      setDrawingState((prev) => ({
        ...prev,
        currentPoint: point.clone(),
      }));
    },
    [drawingState.isDrawing, drawingState.startPoint, getGroundIntersection]
  );

  const finishDrawing = useCallback(
    (endPoint: THREE.Vector3) => {
      if (!drawingState.startPoint) return;

      const start = drawingState.startPoint;
      const end = endPoint;

      let newObject;

      switch (activeTool) {
        case "line":
          const lineLength = start.distanceTo(end);
          newObject = {
            id: `line-${Date.now()}`,
            type: "line",
            position: [0, 0.1, 0] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [1, 1, 1] as [number, number, number],
            color: "#ef4444",
            selected: false,
            lineStart: [start.x, 0.1, start.z] as [number, number, number],
            lineEnd: [end.x, 0.1, end.z] as [number, number, number],
            length: lineLength,
          };
          break;

        case "rectangle":
          const width = Math.abs(end.x - start.x);
          const height = Math.abs(end.z - start.z);
          const centerX = (start.x + end.x) / 2;
          const centerZ = (start.z + end.z) / 2;
          newObject = {
            id: `rectangle-${Date.now()}`,
            type: "cube",
            position: [centerX, 0.05, centerZ] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [width, 0.1, height] as [number, number, number],
            color: "#3b82f6",
            selected: false,
            width,
            height,
          };
          break;

        case "circle":
          const radius = start.distanceTo(end);
          newObject = {
            id: `circle-${Date.now()}`,
            type: "cylinder",
            position: [start.x, 0.05, start.z] as [number, number, number],
            rotation: [0, 0, 0] as [number, number, number],
            scale: [radius, 0.1, radius] as [number, number, number],
            color: "#10b981",
            selected: false,
            radius,
          };
          break;
      }

      if (newObject) {
        onObjectCreate(newObject);
      }

      // Reset drawing state
      setDrawingState({
        isDrawing: false,
        startPoint: null,
        currentPoint: null,
        previewObject: null,
      });
      onDrawingEnd();
    },
    [drawingState.startPoint, activeTool, onObjectCreate, onDrawingEnd]
  );

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === "Escape" && drawingState.isDrawing) {
        // Cancel drawing
        setDrawingState({
          isDrawing: false,
          startPoint: null,
          currentPoint: null,
          previewObject: null,
        });
        onDrawingEnd();
      } else if (event.key === "Enter" && drawingState.isDrawing) {
        // Show dimension input
        setShowDimensionInput(true);
        if (activeTool === "line") setDimensionType("length");
        else if (activeTool === "rectangle") setDimensionType("width");
        else if (activeTool === "circle") setDimensionType("radius");
      }
    },
    [drawingState.isDrawing, activeTool, onDrawingEnd]
  );

  const applyDimension = useCallback(() => {
    if (!drawingState.startPoint || !dimensionValue) return;

    const value = parseFloat(dimensionValue);
    if (isNaN(value) || value <= 0) return;

    let endPoint = new THREE.Vector3();

    switch (activeTool) {
      case "line":
        // For line, extend in the direction of current mouse or default direction
        const direction = drawingState.currentPoint
          ? new THREE.Vector3()
              .subVectors(drawingState.currentPoint, drawingState.startPoint)
              .normalize()
          : new THREE.Vector3(1, 0, 0); // Default to X direction
        endPoint = drawingState.startPoint
          .clone()
          .add(direction.multiplyScalar(value));
        break;

      case "rectangle":
        // For rectangle, create a square with given width or use current proportions
        const currentWidth = drawingState.currentPoint
          ? Math.abs(drawingState.currentPoint.x - drawingState.startPoint.x)
          : value;
        const currentHeight = drawingState.currentPoint
          ? Math.abs(drawingState.currentPoint.z - drawingState.startPoint.z)
          : value;

        if (dimensionType === "width") {
          endPoint = new THREE.Vector3(
            drawingState.startPoint.x + value,
            0,
            drawingState.startPoint.z + (currentHeight / currentWidth) * value
          );
        } else {
          endPoint = new THREE.Vector3(
            drawingState.startPoint.x + value,
            0,
            drawingState.startPoint.z + value
          );
        }
        break;

      case "circle":
        // For circle, use the value as radius
        endPoint = new THREE.Vector3(
          drawingState.startPoint.x + value,
          0,
          drawingState.startPoint.z
        );
        break;
    }

    finishDrawing(endPoint);
    setShowDimensionInput(false);
    setDimensionValue("");
  }, [
    drawingState.startPoint,
    drawingState.currentPoint,
    dimensionValue,
    activeTool,
    dimensionType,
    finishDrawing,
  ]);

  // Add event listeners
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.addEventListener("keydown", handleKeyPress);
      return () => window.removeEventListener("keydown", handleKeyPress);
    }
  }, [handleKeyPress]);

  const renderPreview = () => {
    if (
      !drawingState.isDrawing ||
      !drawingState.startPoint ||
      !drawingState.currentPoint
    )
      return null;

    const start = drawingState.startPoint;
    const current = drawingState.currentPoint;

    switch (activeTool) {
      case "line":
        const points = [start, current];
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(start.x, start.y + 0.1, start.z),
          new THREE.Vector3(current.x, current.y + 0.1, current.z),
        ]);
        return (
          <mesh>
            <tubeGeometry args={[curve, 2, 0.02, 8, false]} />
            <meshBasicMaterial color="#ef4444" opacity={0.7} transparent />
          </mesh>
        );

      case "rectangle":
        const width = Math.abs(current.x - start.x);
        const height = Math.abs(current.z - start.z);
        const centerX = (start.x + current.x) / 2;
        const centerZ = (start.z + current.z) / 2;
        return (
          <mesh position={[centerX, 0.05, centerZ]}>
            <boxGeometry args={[width, 0.1, height]} />
            <meshBasicMaterial color="#3b82f6" opacity={0.5} transparent />
          </mesh>
        );

      case "circle":
        const radius = start.distanceTo(current);
        return (
          <mesh position={[start.x, 0.05, start.z]}>
            <cylinderGeometry args={[radius, radius, 0.1, 32]} />
            <meshBasicMaterial color="#10b981" opacity={0.5} transparent />
          </mesh>
        );

      default:
        return null;
    }
  };

  const getCurrentDimensions = () => {
    if (!drawingState.startPoint || !drawingState.currentPoint) return "";

    const start = drawingState.startPoint;
    const current = drawingState.currentPoint;

    switch (activeTool) {
      case "line":
        return `Length: ${start.distanceTo(current).toFixed(2)}m`;
      case "rectangle":
        const width = Math.abs(current.x - start.x);
        const height = Math.abs(current.z - start.z);
        return `Width: ${width.toFixed(2)}m, Height: ${height.toFixed(2)}m`;
      case "circle":
        const radius = start.distanceTo(current);
        return `Radius: ${radius.toFixed(2)}m`;
      default:
        return "";
    }
  };

  return (
    <>
      {/* Invisible ground plane for click detection */}
      <mesh
        ref={groundPlaneRef}
        position={[0, -0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleCanvasClick}
        onPointerMove={handleMouseMove}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Preview objects */}
      {renderPreview()}

      {/* Start point indicator */}
      {drawingState.isDrawing && drawingState.startPoint && (
        <mesh
          position={[
            drawingState.startPoint.x,
            0.05,
            drawingState.startPoint.z,
          ]}
        >
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}

      {/* UI for drawing feedback */}
      {drawingState.isDrawing && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border z-50">
          <p className="text-sm font-medium text-gray-700 mb-2">
            Drawing {activeTool}
          </p>
          <p className="text-xs text-gray-600 mb-2">{getCurrentDimensions()}</p>
          <div className="flex gap-2 text-xs text-gray-500">
            <span>• Click to finish</span>
            <span>• Press Enter for precise input</span>
            <span>• Press Escape to cancel</span>
          </div>
        </div>
      )}

      {/* Dimension input dialog */}
      {showDimensionInput && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-xl border z-50">
          <h3 className="text-lg font-semibold mb-4">Enter Dimension</h3>
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {dimensionType.charAt(0).toUpperCase() + dimensionType.slice(1)}{" "}
                (meters)
              </label>
              <input
                type="number"
                min="0.1"
                step="0.1"
                value={dimensionValue}
                onChange={(e) => setDimensionValue(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter value..."
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") applyDimension();
                  if (e.key === "Escape") {
                    setShowDimensionInput(false);
                    setDimensionValue("");
                  }
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={applyDimension}
                className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Apply
              </button>
              <button
                onClick={() => {
                  setShowDimensionInput(false);
                  setDimensionValue("");
                }}
                className="flex-1 px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
