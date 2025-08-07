"use client";

import { useState, useRef } from "react";
import * as THREE from "three";

interface ExtrudeManagerProps {
  isActive: boolean;
  onCreateExtrudedShape: (shape: THREE.Shape, depth: number) => void;
}

export default function ExtrudeManager({
  isActive,
  onCreateExtrudedShape,
}: ExtrudeManagerProps) {
  const [points, setPoints] = useState<THREE.Vector2[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [extrudeDepth, setExtrudeDepth] = useState(1);

  const handleCanvasClick = (event: any) => {
    if (!isActive) return;

    const point = new THREE.Vector2(event.point.x, event.point.z);

    if (!isDrawing) {
      setPoints([point]);
      setIsDrawing(true);
    } else {
      setPoints((prev) => [...prev, point]);
    }
  };

  const completeShape = () => {
    if (points.length < 3) return;

    const shape = new THREE.Shape(points);
    onCreateExtrudedShape(shape, extrudeDepth);

    setPoints([]);
    setIsDrawing(false);
  };

  const cancelShape = () => {
    setPoints([]);
    setIsDrawing(false);
  };

  if (!isActive) return null;

  return (
    <>
      <group onClick={handleCanvasClick}>
        {points.map((point, index) => (
          <mesh key={index} position={[point.x, 0.01, point.y]}>
            <sphereGeometry args={[0.1]} />
            <meshBasicMaterial color="red" />
          </mesh>
        ))}

        {points.length > 1 && (
          <mesh>
            <tubeGeometry
              args={[
                new THREE.CatmullRomCurve3(
                  points.map((p) => new THREE.Vector3(p.x, 0.01, p.y))
                ),
                points.length * 2,
                0.02,
                8,
                false,
              ]}
            />
            <meshBasicMaterial color="red" />
          </mesh>
        )}
      </group>

      {isDrawing && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg shadow-lg border">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium">Depth:</label>
              <input
                type="number"
                min="0.1"
                max="10"
                step="0.1"
                value={extrudeDepth}
                onChange={(e) =>
                  setExtrudeDepth(parseFloat(e.target.value) || 1)
                }
                className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
              />
            </div>
            <button
              onClick={completeShape}
              className="px-3 py-1 bg-green-500 text-white rounded text-sm hover:bg-green-600"
            >
              Complete
            </button>
            <button
              onClick={cancelShape}
              className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">
            Click to add points. Need at least 3 points to create a shape.
          </p>
        </div>
      )}
    </>
  );
}
