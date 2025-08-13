import { useState, useCallback, useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

interface RectangleDrawingHookProps {
  activeTool: string;
  onRectangleCreate: (rectangle: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
  selectedLayerId?: string;
}

export function useRectangleDrawing({
  activeTool,
  onRectangleCreate,
  onMeasurementUpdate,
  selectedLayerId,
}: RectangleDrawingHookProps) {
  const { raycaster, camera, scene } = useThree();
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [snapPoints, setSnapPoints] = useState<THREE.Vector3[]>([]);
  const [isSnapping, setIsSnapping] = useState(false);
  const [snapDistance] = useState(0.5); // Snap distance in meters

  // Get all DXF objects for snapping
  useEffect(() => {
    const points: THREE.Vector3[] = [];

    // Find all DXF objects in the scene
    scene.traverse((child) => {
      if (child.userData && child.userData.type === "dxf") {
        // Extract vertices from DXF geometry for snapping
        if (child.geometry) {
          const positions = child.geometry.attributes.position;
          if (positions) {
            for (let i = 0; i < positions.count; i++) {
              const vertex = new THREE.Vector3();
              vertex.fromBufferAttribute(positions, i);
              // Transform to world coordinates
              child.localToWorld(vertex);
              points.push(vertex);
            }
          }
        }
      }
    });

    setSnapPoints(points);
  }, [scene]);

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

  const findSnapPoint = useCallback(
    (point: THREE.Vector3): THREE.Vector3 | null => {
      if (snapPoints.length === 0) return null;

      let closestPoint: THREE.Vector3 | null = null;
      let closestDistance = Infinity;

      snapPoints.forEach((snapPoint) => {
        const distance = point.distanceTo(snapPoint);
        if (distance < snapDistance && distance < closestDistance) {
          closestDistance = distance;
          closestPoint = snapPoint.clone();
        }
      });

      return closestPoint;
    },
    [snapPoints, snapDistance]
  );

  const getCurrentMeasurements = useCallback(() => {
    if (!isDrawing || !startPoint || !currentPoint) return null;

    const width = Math.abs(currentPoint.x - startPoint.x);
    const height = Math.abs(currentPoint.z - startPoint.z);
    const area = width * height;
    const perimeter = 2 * (width + height);

    return {
      width: width.toFixed(3),
      height: height.toFixed(3),
      area: area.toFixed(3),
      perimeter: perimeter.toFixed(3),
    };
  }, [isDrawing, startPoint, currentPoint]);

  // Send measurements to parent component
  useEffect(() => {
    if (onMeasurementUpdate) {
      const measurements = getCurrentMeasurements();
      onMeasurementUpdate({
        isDrawing,
        activeTool: "rectangle",
        measurements,
      });
    }
  }, [
    isDrawing,
    startPoint,
    currentPoint,
    onMeasurementUpdate,
    getCurrentMeasurements,
  ]);

  const handleClick = useCallback(
    (event: any) => {
      if (activeTool !== "rectangle") return;

      const point = getGroundIntersection(event);
      if (!point) return;

      // Check for snapping
      const snappedPoint = findSnapPoint(point);
      const finalPoint = snappedPoint || point;

      if (!isDrawing) {
        // Start drawing
        setStartPoint(finalPoint.clone());
        setCurrentPoint(finalPoint.clone());
        setIsDrawing(true);
        setIsSnapping(!!snappedPoint);
      } else {
        // Finish drawing
        if (startPoint) {
          const width = Math.abs(finalPoint.x - startPoint.x);
          const height = Math.abs(finalPoint.z - startPoint.z);

          // Only create rectangle if it has meaningful dimensions
          if (width > 0.01 && height > 0.01) {
            const centerX = (startPoint.x + finalPoint.x) / 2;
            const centerZ = (startPoint.z + finalPoint.z) / 2;

            const newRectangle = {
              id: `rectangle-${Date.now()}`,
              type: "rectangle",
              position: [centerX, 0.01, centerZ] as [number, number, number],
              rotation: [0, 0, 0] as [number, number, number],
              scale: [1, 1, 1] as [number, number, number],
              color: "#3b82f6",
              selected: false,
              width,
              height,
              area: width * height,
              perimeter: 2 * (width + height),
              startPoint: [startPoint.x, 0, startPoint.z] as [
                number,
                number,
                number
              ],
              endPoint: [finalPoint.x, 0, finalPoint.z] as [
                number,
                number,
                number
              ],
              layerId: selectedLayerId || "default",
              createdAt: new Date(),
              metadata: {
                tool: "rectangle",
                snapped: !!snappedPoint,
                snapPoint: snappedPoint
                  ? [snappedPoint.x, snappedPoint.y, snappedPoint.z]
                  : null,
              },
            };

            onRectangleCreate(newRectangle);
          }
        }

        // Clean up
        setStartPoint(null);
        setCurrentPoint(null);
        setIsDrawing(false);
        setIsSnapping(false);
      }
    },
    [
      activeTool,
      isDrawing,
      startPoint,
      getGroundIntersection,
      findSnapPoint,
      onRectangleCreate,
      selectedLayerId,
    ]
  );

  const handleMouseMove = useCallback(
    (event: any) => {
      if (!isDrawing || !startPoint) return;

      const point = getGroundIntersection(event);
      if (point) {
        // Check for snapping
        const snappedPoint = findSnapPoint(point);
        const finalPoint = snappedPoint || point;
        setCurrentPoint(finalPoint.clone());
        setIsSnapping(!!snappedPoint);
      }
    },
    [isDrawing, startPoint, getGroundIntersection, findSnapPoint]
  );

  const handleKeyDown = useCallback(
    (event: any) => {
      if (event.key === "Escape" && isDrawing) {
        // Cancel drawing
        setStartPoint(null);
        setCurrentPoint(null);
        setIsDrawing(false);
        setIsSnapping(false);
      }
    },
    [isDrawing]
  );

  // Set up event listeners
  useEffect(() => {
    if (activeTool === "rectangle") {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [activeTool, handleKeyDown]);

  return {
    startPoint,
    currentPoint,
    isDrawing,
    isSnapping,
    snapPoints,
    handleClick,
    handleMouseMove,
  };
}
