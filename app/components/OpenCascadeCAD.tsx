"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";
import openCascadeService, { CADShape } from "../services/OpenCascadeService";

interface OpenCascadeCADProps {
  activeTool: string;
  onObjectCreate: (object: any) => void;
  selectedObjectIds: string[];
}

export default function OpenCascadeCAD({
  activeTool,
  onObjectCreate,
  selectedObjectIds,
}: OpenCascadeCADProps) {
  const { scene } = useThree();
  const [isInitialized, setIsInitialized] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cadShapes, setCadShapes] = useState<Map<string, CADShape>>(new Map());
  const [selectedCADShapes, setSelectedCADShapes] = useState<CADShape[]>([]);

  // Initialize OpenCascade
  useEffect(() => {
    const initializeOC = async () => {
      try {
        setIsLoading(true);
        await openCascadeService.initialize();
        setIsInitialized(true);
        console.log("🚀 OpenCascade CAD engine ready!");
      } catch (error) {
        console.error("Failed to initialize OpenCascade:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeOC();
  }, []);

  // Update selected CAD shapes when selection changes
  useEffect(() => {
    const selected = selectedObjectIds
      .map((id) => cadShapes.get(id))
      .filter(Boolean) as CADShape[];
    setSelectedCADShapes(selected);
  }, [selectedObjectIds, cadShapes]);

  // ============ CAD OPERATIONS ============

  const createCADBox = useCallback(
    (width = 2, height = 2, depth = 2) => {
      if (!isInitialized) return;

      try {
        const cadShape = openCascadeService.createBox(width, height, depth);
        const mesh = convertCADShapeToThreeMesh(cadShape);

        const geometryObject = {
          id: cadShape.id,
          type: "cad_box" as const,
          position: [0, height / 2, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          color: "#4f46e5",
          selected: false,
          cadShape,
          cadMesh: mesh,
          width,
          height,
          length: depth,
        };

        setCadShapes((prev) => new Map(prev).set(cadShape.id, cadShape));
        onObjectCreate(geometryObject);

        console.log("✅ Created CAD Box:", { width, height, depth });
      } catch (error) {
        console.error("❌ Failed to create CAD box:", error);
      }
    },
    [isInitialized, onObjectCreate]
  );

  const createCADCylinder = useCallback(
    (radius = 1, height = 2) => {
      if (!isInitialized) return;

      try {
        const cadShape = openCascadeService.createCylinder(radius, height);
        const mesh = convertCADShapeToThreeMesh(cadShape);

        const geometryObject = {
          id: cadShape.id,
          type: "cad_cylinder" as const,
          position: [0, height / 2, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          color: "#059669",
          selected: false,
          cadShape,
          cadMesh: mesh,
          radius,
          height,
        };

        setCadShapes((prev) => new Map(prev).set(cadShape.id, cadShape));
        onObjectCreate(geometryObject);

        console.log("✅ Created CAD Cylinder:", { radius, height });
      } catch (error) {
        console.error("❌ Failed to create CAD cylinder:", error);
      }
    },
    [isInitialized, onObjectCreate]
  );

  const createCADSphere = useCallback(
    (radius = 1) => {
      if (!isInitialized) return;

      try {
        const cadShape = openCascadeService.createSphere(radius);
        const mesh = convertCADShapeToThreeMesh(cadShape);

        const geometryObject = {
          id: cadShape.id,
          type: "cad_sphere" as const,
          position: [0, radius, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          color: "#dc2626",
          selected: false,
          cadShape,
          cadMesh: mesh,
          radius,
        };

        setCadShapes((prev) => new Map(prev).set(cadShape.id, cadShape));
        onObjectCreate(geometryObject);

        console.log("✅ Created CAD Sphere:", { radius });
      } catch (error) {
        console.error("❌ Failed to create CAD sphere:", error);
      }
    },
    [isInitialized, onObjectCreate]
  );

  // ============ BOOLEAN OPERATIONS ============

  const performUnion = useCallback(() => {
    if (selectedCADShapes.length < 2) {
      alert("Please select at least 2 objects to perform union");
      return;
    }

    try {
      let result = selectedCADShapes[0];

      for (let i = 1; i < selectedCADShapes.length; i++) {
        result = openCascadeService.performUnion(result, selectedCADShapes[i]);
      }

      const mesh = convertCADShapeToThreeMesh(result);

      const geometryObject = {
        id: result.id,
        type: "cad_union" as const,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        color: "#7c3aed",
        selected: false,
        cadShape: result,
        cadMesh: mesh,
      };

      setCadShapes((prev) => new Map(prev).set(result.id, result));
      onObjectCreate(geometryObject);

      console.log("✅ Union operation completed");
    } catch (error) {
      console.error("❌ Union operation failed:", error);
    }
  }, [selectedCADShapes, onObjectCreate]);

  const performDifference = useCallback(() => {
    if (selectedCADShapes.length !== 2) {
      alert("Please select exactly 2 objects to perform difference");
      return;
    }

    try {
      const result = openCascadeService.performDifference(
        selectedCADShapes[0],
        selectedCADShapes[1]
      );

      const mesh = convertCADShapeToThreeMesh(result);

      const geometryObject = {
        id: result.id,
        type: "cad_difference" as const,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        color: "#ea580c",
        selected: false,
        cadShape: result,
        cadMesh: mesh,
      };

      setCadShapes((prev) => new Map(prev).set(result.id, result));
      onObjectCreate(geometryObject);

      console.log("✅ Difference operation completed");
    } catch (error) {
      console.error("❌ Difference operation failed:", error);
    }
  }, [selectedCADShapes, onObjectCreate]);

  const performIntersection = useCallback(() => {
    if (selectedCADShapes.length < 2) {
      alert("Please select at least 2 objects to perform intersection");
      return;
    }

    try {
      let result = selectedCADShapes[0];

      for (let i = 1; i < selectedCADShapes.length; i++) {
        result = openCascadeService.performIntersection(
          result,
          selectedCADShapes[i]
        );
      }

      const mesh = convertCADShapeToThreeMesh(result);

      const geometryObject = {
        id: result.id,
        type: "cad_intersection" as const,
        position: [0, 0, 0] as [number, number, number],
        rotation: [0, 0, 0] as [number, number, number],
        scale: [1, 1, 1] as [number, number, number],
        color: "#0891b2",
        selected: false,
        cadShape: result,
        cadMesh: mesh,
      };

      setCadShapes((prev) => new Map(prev).set(result.id, result));
      onObjectCreate(geometryObject);

      console.log("✅ Intersection operation completed");
    } catch (error) {
      console.error("❌ Intersection operation failed:", error);
    }
  }, [selectedCADShapes, onObjectCreate]);

  // ============ ADVANCED OPERATIONS ============

  const createFillet = useCallback(
    (radius = 0.2) => {
      if (selectedCADShapes.length !== 1) {
        alert("Please select exactly 1 object to create fillet");
        return;
      }

      try {
        const result = openCascadeService.createFillet(
          selectedCADShapes[0],
          radius
        );
        const mesh = convertCADShapeToThreeMesh(result);

        const geometryObject = {
          id: result.id,
          type: "cad_fillet" as const,
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          color: "#be185d",
          selected: false,
          cadShape: result,
          cadMesh: mesh,
          filletRadius: radius,
        };

        setCadShapes((prev) => new Map(prev).set(result.id, result));
        onObjectCreate(geometryObject);

        console.log("✅ Fillet operation completed");
      } catch (error) {
        console.error("❌ Fillet operation failed:", error);
      }
    },
    [selectedCADShapes, onObjectCreate]
  );

  const createChamfer = useCallback(
    (distance = 0.2) => {
      if (selectedCADShapes.length !== 1) {
        alert("Please select exactly 1 object to create chamfer");
        return;
      }

      try {
        const result = openCascadeService.createChamfer(
          selectedCADShapes[0],
          distance
        );
        const mesh = convertCADShapeToThreeMesh(result);

        const geometryObject = {
          id: result.id,
          type: "cad_chamfer" as const,
          position: [0, 0, 0] as [number, number, number],
          rotation: [0, 0, 0] as [number, number, number],
          scale: [1, 1, 1] as [number, number, number],
          color: "#a16207",
          selected: false,
          cadShape: result,
          cadMesh: mesh,
          chamferDistance: distance,
        };

        setCadShapes((prev) => new Map(prev).set(result.id, result));
        onObjectCreate(geometryObject);

        console.log("✅ Chamfer operation completed");
      } catch (error) {
        console.error("❌ Chamfer operation failed:", error);
      }
    },
    [selectedCADShapes, onObjectCreate]
  );

  // ============ UTILITY FUNCTIONS ============

  const convertCADShapeToThreeMesh = (cadShape: CADShape): THREE.Mesh => {
    const meshData = openCascadeService.convertToMesh(cadShape, 0.1);

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(meshData.vertices, 3)
    );
    geometry.setAttribute(
      "normal",
      new THREE.Float32BufferAttribute(meshData.normals, 3)
    );
    geometry.setIndex(meshData.indices);
    geometry.computeVertexNormals();

    const material = new THREE.MeshStandardMaterial({
      color: 0x4f46e5,
      side: THREE.DoubleSide,
    });

    return new THREE.Mesh(geometry, material);
  };

  // ============ TOOL HANDLERS ============

  useEffect(() => {
    if (!isInitialized) return;

    switch (activeTool) {
      case "cad_box":
        createCADBox();
        break;
      case "cad_cylinder":
        createCADCylinder();
        break;
      case "cad_sphere":
        createCADSphere();
        break;
      case "cad_union":
        performUnion();
        break;
      case "cad_difference":
        performDifference();
        break;
      case "cad_intersection":
        performIntersection();
        break;
      case "cad_fillet":
        createFillet();
        break;
      case "cad_chamfer":
        createChamfer();
        break;
    }
  }, [activeTool, isInitialized]);

  // ============ RENDER ============

  if (isLoading) {
    return (
      <>
        {/* Loading indicator */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshBasicMaterial color="#4f46e5" />
        </mesh>
        <Text
          position={[0, 3, 0]}
          fontSize={0.2}
          color="#333333"
          anchorX="center"
          anchorY="middle"
        >
          Loading OpenCascade...
        </Text>
      </>
    );
  }

  if (!isInitialized) {
    return (
      <>
        {/* Error indicator */}
        <mesh position={[0, 2, 0]}>
          <boxGeometry args={[1, 0.2, 1]} />
          <meshBasicMaterial color="#dc2626" />
        </mesh>
      </>
    );
  }

  return (
    <>
      {/* OpenCascade CAD engine is ready and running in the background */}
      {/* All CAD operations are handled through the service */}
    </>
  );
}
