"use client";

import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import React from "react";
import GroundPlane from "./GroundPlane";
import TransformControls from "./TransformControls";
import InteractiveDrawing from "./InteractiveDrawing";
import AdvancedRectangleTool from "./AdvancedRectangleTool";

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

interface GeometryManagerProps {
  activeTool: string;
  objects: GeometryObject[];
  onObjectsChange: (objects: GeometryObject[]) => void;
  selectedObject: string | null;
  onSelectObject: (objectId: string | null) => void;
  // DXF import support
  isDxfPreviewing?: boolean;
  onDxfPlacement?: (position: [number, number, number]) => void;
}

function GeometryObject({
  object,
  isSelected,
  onClick,
  meshRef,
}: {
  object: GeometryObject;
  isSelected: boolean;
  onClick: (e: any) => void;
  meshRef?: React.RefObject<THREE.Mesh>;
}) {
  const localMeshRef = useRef<THREE.Mesh>(null);
  const ref = meshRef || localMeshRef;

  const renderGeometry = () => {
    switch (object.type) {
      case "cube":
        return <boxGeometry args={[1, 1, 1]} />;
      case "cylinder":
        return <cylinderGeometry args={[0.5, 0.5, 1, 16]} />;
      case "sphere":
        return <sphereGeometry args={[0.5, 16, 12]} />;
      case "plane":
        return <planeGeometry args={[1, 1]} />;
      case "rectangle":
        return <planeGeometry args={[1, 1]} />;
      case "circle":
        return <circleGeometry args={[object.radius || 0.5, 32]} />;
      case "line":
        return null;
      case "extruded":
        if (object.points && object.points.length >= 3) {
          const shape = new THREE.Shape();
          shape.moveTo(object.points[0].x, object.points[0].y);
          for (let i = 1; i < object.points.length; i++) {
            shape.lineTo(object.points[i].x, object.points[i].y);
          }
          if (object.closed) {
            shape.closePath();
          }
          return (
            <extrudeGeometry
              args={[
                shape,
                { depth: object.depth || 0.1, bevelEnabled: false },
              ]}
            />
          );
        } else if (object.shape && object.extrudeDepth) {
          return (
            <extrudeGeometry
              args={[
                object.shape,
                { depth: object.extrudeDepth, bevelEnabled: false },
              ]}
            />
          );
        }
        return <boxGeometry args={[1, 1, 1]} />;
      case "arc":
        const arcSegments = Math.max(
          8,
          Math.floor(
            ((object.endAngle - object.startAngle) / (Math.PI / 16)) * 32
          )
        );
        return (
          <ringGeometry
            args={[
              (object.radius || 1) * 0.95,
              object.radius || 1,
              arcSegments,
              1,
              object.startAngle || 0,
              (object.endAngle || Math.PI * 2) - (object.startAngle || 0),
            ]}
          />
        );
      case "ellipse":
        return <circleGeometry args={[object.radius || 0.5, 32]} />;
      case "spline":
        return null; // Will be handled specially below
      case "text":
        return null; // Will be handled specially below
      case "point":
        return <sphereGeometry args={[0.05, 8, 8]} />;
      default:
        return <boxGeometry args={[1, 1, 1]} />;
    }
  };

  if (object.type === "line" && object.lineStart && object.lineEnd) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(...object.lineStart),
      new THREE.Vector3(...object.lineEnd),
    ]);
    return (
      <mesh onClick={onClick}>
        <tubeGeometry args={[curve, 2, 0.05, 8, false]} />
        <meshBasicMaterial
          color={isSelected ? "#4ade80" : object.color}
          opacity={isSelected ? 0.7 : 1}
          transparent={isSelected}
        />
      </mesh>
    );
  }

  // Handle spline objects
  if (object.type === "spline" && object.points && object.points.length >= 2) {
    const curve3D = new THREE.CatmullRomCurve3(
      object.points.map((p) => new THREE.Vector3(p.x, 0, p.y))
    );
    return (
      <mesh onClick={onClick}>
        <tubeGeometry args={[curve3D, 64, 0.05, 8, false]} />
        <meshBasicMaterial
          color={isSelected ? "#4ade80" : object.color}
          opacity={isSelected ? 0.7 : 1}
          transparent={isSelected}
        />
      </mesh>
    );
  }

  // Handle text objects
  if (object.type === "text") {
    return (
      <Text
        position={object.position}
        fontSize={0.3}
        color={isSelected ? "#4ade80" : object.color}
        anchorX="center"
        anchorY="middle"
        onClick={onClick}
      >
        {object.text || "[TEXT]"}
      </Text>
    );
  }

  // Handle arc objects specially for proper rotation
  if (object.type === "arc") {
    return (
      <mesh
        ref={ref}
        position={object.position}
        rotation={[Math.PI / 2, 0, 0]} // Rotate to lie flat on XZ plane
        scale={object.scale}
        onClick={onClick}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={isSelected ? "#4ade80" : object.color}
          wireframe={isSelected}
          transparent={isSelected}
          opacity={isSelected ? 0.7 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  // Handle circle objects specially for proper rotation
  if (object.type === "circle") {
    return (
      <mesh
        ref={ref}
        position={object.position}
        rotation={[Math.PI / 2, 0, 0]} // Rotate to lie flat on XZ plane
        scale={object.scale}
        onClick={onClick}
      >
        {renderGeometry()}
        <meshStandardMaterial
          color={isSelected ? "#4ade80" : object.color}
          wireframe={isSelected}
          transparent={isSelected}
          opacity={isSelected ? 0.7 : 1}
          side={THREE.DoubleSide}
        />
      </mesh>
    );
  }

  return (
    <mesh
      ref={ref}
      position={object.position}
      rotation={object.rotation}
      scale={object.scale}
      onClick={onClick}
    >
      {renderGeometry()}
      <meshStandardMaterial
        color={isSelected ? "#4ade80" : object.color}
        wireframe={isSelected}
        transparent={isSelected}
        opacity={isSelected ? 0.7 : 1}
      />
    </mesh>
  );
}

export default function GeometryManager({
  activeTool,
  objects,
  onObjectsChange,
  selectedObject,
  onSelectObject,
  isDxfPreviewing = false,
  onDxfPlacement,
}: GeometryManagerProps) {
  const { camera, raycaster, mouse } = useThree();
  const selectedMeshRef = useRef<THREE.Mesh>(null);
  const [transformMode, setTransformMode] = useState<
    "translate" | "rotate" | "scale"
  >("translate");
  const [isInteractiveDrawing, setIsInteractiveDrawing] = useState(false);

  useEffect(() => {
    // Update transform mode based on active tool
    if (activeTool === "move") setTransformMode("translate");
    else if (activeTool === "rotate") setTransformMode("rotate");
    else if (activeTool === "scale") setTransformMode("scale");
  }, [activeTool]);

  const handleTransformChange = () => {
    if (selectedMeshRef.current && selectedObject) {
      const mesh = selectedMeshRef.current;
      const updatedObject = objects.find((obj) => obj.id === selectedObject);
      if (updatedObject) {
        onObjectsChange(
          objects.map((obj) =>
            obj.id === selectedObject
              ? {
                  ...obj,
                  position: [
                    mesh.position.x,
                    mesh.position.y,
                    mesh.position.z,
                  ] as [number, number, number],
                  rotation: [
                    mesh.rotation.x,
                    mesh.rotation.y,
                    mesh.rotation.z,
                  ] as [number, number, number],
                  scale: [mesh.scale.x, mesh.scale.y, mesh.scale.z] as [
                    number,
                    number,
                    number
                  ],
                }
              : obj
          )
        );
      }
    }
  };

  const handleInteractiveObjectCreate = (object: any) => {
    onObjectsChange([...objects, object]);
    onSelectObject(object.id);
  };

  const createObject = (
    type:
      | "cube"
      | "cylinder"
      | "sphere"
      | "plane"
      | "rectangle"
      | "circle"
      | "line",
    position: [number, number, number],
    endPosition?: [number, number, number]
  ) => {
    const newObject: GeometryObject = {
      id: `${type}-${Date.now()}`,
      type,
      position,
      rotation:
        type === "rectangle" || type === "circle"
          ? [Math.PI / 2, 0, 0]
          : [0, 0, 0],
      scale: [1, 1, 1],
      color:
        type === "line"
          ? "#ef4444"
          : type === "rectangle"
          ? "#3b82f6"
          : type === "circle"
          ? "#10b981"
          : "#6b7280",
      selected: false,
      lineStart: type === "line" ? position : undefined,
      lineEnd: type === "line" ? endPosition : undefined,
    };

    onObjectsChange([...objects, newObject]);
    onSelectObject(newObject.id);
  };

  const handleGroundClick = (point: THREE.Vector3) => {
    // Handle DXF placement
    if (isDxfPreviewing && onDxfPlacement) {
      const position: [number, number, number] = [point.x, 0, point.z];
      onDxfPlacement(position);
      return;
    }

    // Only handle non-interactive drawing tools
    if (["cube", "cylinder", "sphere", "plane"].includes(activeTool)) {
      let position: [number, number, number] = [point.x, 0.5, point.z];
      createObject(activeTool as any, position);
    }
  };

  const handleObjectClick = (event: any, objectId: string) => {
    event.stopPropagation();
    if (activeTool === "select") {
      onSelectObject(selectedObject === objectId ? null : objectId);
    }
  };

  const isTransformTool = ["move", "rotate", "scale"].includes(activeTool);
  const isInteractiveTool = ["line", "circle"].includes(activeTool);
  const isAdvancedRectangleTool = activeTool === "rectangle";

  // Handle advanced rectangle creation
  const handleAdvancedRectangleCreate = (start: THREE.Vector3, end: THREE.Vector3) => {
    const width = Math.abs(end.x - start.x);
    const height = Math.abs(end.z - start.z);
    const centerX = (start.x + end.x) / 2;
    const centerZ = (start.z + end.z) / 2;

    const newRectangle: GeometryObject = {
      id: `advanced-rectangle-${Date.now()}`,
      type: "rectangle",
      position: [centerX, 0.01, centerZ],
      rotation: [0, 0, 0],
      scale: [width, 1, height],
      color: "#3b82f6",
      selected: false,
      width,
      height,
      length: width,
    };

    console.log("🔷 Creating advanced rectangle:", newRectangle);
    onObjectsChange([...objects, newRectangle]);
    onSelectObject(newRectangle.id);
  };

  // Debug logging for objects
  React.useEffect(() => {
    console.log("📦 GeometryManager received objects:", objects);
  }, [objects]);

  return (
    <group>
      {(!isInteractiveTool && !isAdvancedRectangleTool || isDxfPreviewing) && (
        <GroundPlane
          activeTool={isDxfPreviewing ? "dxf_import" : activeTool}
          onCanvasClick={handleGroundClick}
        />
      )}

      {isInteractiveTool && (
        <InteractiveDrawing
          activeTool={activeTool}
          onObjectCreate={handleInteractiveObjectCreate}
          onDrawingStart={() => setIsInteractiveDrawing(true)}
          onDrawingEnd={() => setIsInteractiveDrawing(false)}
        />
      )}

      {isAdvancedRectangleTool && (
        <AdvancedRectangleTool
          isActive={true}
          objects={objects}
          onCreateRectangle={handleAdvancedRectangleCreate}
        />
      )}

      {objects.map((obj) => (
        <GeometryObject
          key={obj.id}
          object={obj}
          isSelected={selectedObject === obj.id}
          onClick={(e) => handleObjectClick(e, obj.id)}
          meshRef={selectedObject === obj.id ? selectedMeshRef : undefined}
        />
      ))}
      <TransformControls
        object={selectedMeshRef.current}
        mode={transformMode}
        enabled={
          isTransformTool && selectedObject !== null && !isInteractiveDrawing
        }
        onChange={handleTransformChange}
      />
    </group>
  );
}
