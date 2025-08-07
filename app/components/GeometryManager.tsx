"use client";

import { useRef, useState, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import GroundPlane from "./GroundPlane";
import TransformControls from "./TransformControls";
import InteractiveDrawing from "./InteractiveDrawing";

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
        return <circleGeometry args={[0.5, 16]} />;
      case "line":
        return null;
      case "extruded":
        if (object.shape && object.extrudeDepth) {
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
        <tubeGeometry args={[curve, 2, 0.02, 8, false]} />
        <meshBasicMaterial
          color={isSelected ? "#4ade80" : object.color}
          opacity={isSelected ? 0.7 : 1}
          transparent={isSelected}
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
  const isInteractiveTool = ["line", "rectangle", "circle"].includes(
    activeTool
  );

  return (
    <group>
      {!isInteractiveTool && (
        <GroundPlane
          activeTool={activeTool}
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
