"use client";

import { useState, useCallback, useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface SimpleInteractiveDrawingProps {
  activeTool: string;
  onObjectCreate: (object: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
}

export default function SimpleInteractiveDrawing({
  activeTool,
  onObjectCreate,
  onMeasurementUpdate,
}: SimpleInteractiveDrawingProps) {
  const { raycaster, camera } = useThree();
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  const getCurrentMeasurements = useCallback(() => {
    if (!isDrawing || !startPoint || !currentPoint) return null;

    switch (activeTool) {
      case "line":
        const length = startPoint.distanceTo(currentPoint);
        const angle =
          Math.atan2(
            currentPoint.x - startPoint.x,
            currentPoint.z - startPoint.z
          ) *
          (180 / Math.PI);
        return { length: length.toFixed(2), angle: angle.toFixed(1) };
      case "rectangle":
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.z - startPoint.z);
        return { width: width.toFixed(2), height: height.toFixed(2) };
      case "circle":
        const radius = startPoint.distanceTo(currentPoint);
        return { radius: radius.toFixed(2), diameter: (radius * 2).toFixed(2) };
      default:
        return null;
    }
  }, [isDrawing, startPoint, currentPoint, activeTool]);

  // Send measurements to parent component
  useEffect(() => {
    if (onMeasurementUpdate) {
      const measurements = getCurrentMeasurements();
      onMeasurementUpdate({
        isDrawing,
        activeTool,
        measurements,
      });
    }
  }, [
    isDrawing,
    activeTool,
    startPoint,
    currentPoint,
    onMeasurementUpdate,
    getCurrentMeasurements,
  ]);

  const getGroundIntersection = useCallback(
    (event: any) => {
      const mouse = new THREE.Vector2();
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
      raycaster.setFromCamera(mouse, camera);

      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
      const intersection = new THREE.Vector3();

      if (raycaster.ray.intersectPlane(plane, intersection)) {
        return intersection;
      }
      return null;
    },
    [camera, raycaster]
  );

  const handleClick = useCallback(
    (event: any) => {
      if (!["line", "rectangle", "circle"].includes(activeTool)) return;

      const point = getGroundIntersection(event);
      if (!point) return;

      if (!isDrawing) {
        setStartPoint(point.clone());
        setCurrentPoint(point.clone());
        setIsDrawing(true);
      } else {
        // Finish drawing
        if (startPoint) {
          let newObject;

          switch (activeTool) {
            case "line":
              newObject = {
                id: `line-${Date.now()}`,
                type: "line",
                position: [0, 0.1, 0] as [number, number, number],
                rotation: [0, 0, 0] as [number, number, number],
                scale: [1, 1, 1] as [number, number, number],
                color: "#ef4444",
                selected: false,
                lineStart: [startPoint.x, 0.1, startPoint.z] as [
                  number,
                  number,
                  number
                ],
                lineEnd: [point.x, 0.1, point.z] as [number, number, number],
                length: startPoint.distanceTo(point),
              };
              break;
            case "rectangle":
              const width = Math.abs(point.x - startPoint.x);
              const height = Math.abs(point.z - startPoint.z);
              const centerX = (startPoint.x + point.x) / 2;
              const centerZ = (startPoint.z + point.z) / 2;
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
              const radius = startPoint.distanceTo(point);
              newObject = {
                id: `circle-${Date.now()}`,
                type: "cylinder",
                position: [startPoint.x, 0.05, startPoint.z] as [
                  number,
                  number,
                  number
                ],
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
        }

        setStartPoint(null);
        setCurrentPoint(null);
        setIsDrawing(false);
      }
    },
    [activeTool, isDrawing, startPoint, getGroundIntersection, onObjectCreate]
  );

  const handleMouseMove = useCallback(
    (event: any) => {
      if (!isDrawing || !startPoint) return;

      const point = getGroundIntersection(event);
      if (point) {
        setCurrentPoint(point.clone());
      }
    },
    [isDrawing, startPoint, getGroundIntersection]
  );

  const renderPreview = () => {
    if (!isDrawing || !startPoint || !currentPoint) return null;

    switch (activeTool) {
      case "line":
        const lineLength = startPoint.distanceTo(currentPoint);
        const direction = new THREE.Vector3()
          .subVectors(currentPoint, startPoint)
          .normalize();
        const lineCenter = new THREE.Vector3()
          .addVectors(startPoint, currentPoint)
          .multiplyScalar(0.5);
        const angle = Math.atan2(direction.x, direction.z);

        return (
          <group>
            {/* Line preview */}
            <mesh
              position={[lineCenter.x, 0.1, lineCenter.z]}
              rotation={[0, angle, 0]}
            >
              <boxGeometry args={[0.02, 0.02, lineLength]} />
              <meshBasicMaterial color="#ef4444" opacity={0.7} transparent />
            </mesh>

            {/* Direction arrow */}
            <mesh
              position={[currentPoint.x, 0.1, currentPoint.z]}
              rotation={[0, angle, 0]}
            >
              <coneGeometry args={[0.05, 0.1, 8]} />
              <meshBasicMaterial color="#ef4444" />
            </mesh>
          </group>
        );

      case "rectangle":
        const width = Math.abs(currentPoint.x - startPoint.x);
        const height = Math.abs(currentPoint.z - startPoint.z);
        const centerX = (startPoint.x + currentPoint.x) / 2;
        const centerZ = (startPoint.z + currentPoint.z) / 2;

        return (
          <group>
            {/* Rectangle preview */}
            <mesh position={[centerX, 0.05, centerZ]}>
              <boxGeometry args={[width, 0.1, height]} />
              <meshBasicMaterial color="#3b82f6" opacity={0.5} transparent />
            </mesh>

            {/* Width dimension line */}
            <mesh position={[centerX, 0.2, startPoint.z - 0.3]}>
              <boxGeometry args={[width, 0.01, 0.01]} />
              <meshBasicMaterial color="#333333" />
            </mesh>

            {/* Height dimension line */}
            <mesh position={[startPoint.x - 0.3, 0.2, centerZ]}>
              <boxGeometry args={[0.01, 0.01, height]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
          </group>
        );

      case "circle":
        const radius = startPoint.distanceTo(currentPoint);

        return (
          <group>
            {/* Circle preview */}
            <mesh position={[startPoint.x, 0.05, startPoint.z]}>
              <cylinderGeometry args={[radius, radius, 0.1, 32]} />
              <meshBasicMaterial color="#10b981" opacity={0.5} transparent />
            </mesh>

            {/* Radius line */}
            <mesh
              position={[
                startPoint.x + (currentPoint.x - startPoint.x) / 2,
                0.1,
                startPoint.z + (currentPoint.z - startPoint.z) / 2,
              ]}
              rotation={[
                0,
                Math.atan2(
                  currentPoint.x - startPoint.x,
                  currentPoint.z - startPoint.z
                ),
                0,
              ]}
            >
              <boxGeometry args={[0.01, 0.01, radius]} />
              <meshBasicMaterial color="#333333" />
            </mesh>
          </group>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {/* Ground plane for interaction */}
      <mesh
        position={[0, -0.001, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerMove={handleMouseMove}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial visible={false} />
      </mesh>

      {/* Preview */}
      {renderPreview()}

      {/* Start point indicator */}
      {isDrawing && startPoint && (
        <mesh position={[startPoint.x, 0.05, startPoint.z]}>
          <sphereGeometry args={[0.1]} />
          <meshBasicMaterial color="#ff0000" />
        </mesh>
      )}
    </>
  );
}
