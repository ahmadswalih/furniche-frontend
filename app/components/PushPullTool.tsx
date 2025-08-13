'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface PushPullToolProps {
  activeTool: string;
  rectangles: any[];
  onExtrusionCreate: (extrusion: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
}

export default function PushPullTool({
  activeTool,
  rectangles,
  onExtrusionCreate,
  onMeasurementUpdate,
}: PushPullToolProps) {
  const { raycaster, camera, mouse } = useThree();
  const [hoveredRectangle, setHoveredRectangle] = useState<any>(null);
  const [selectedRectangle, setSelectedRectangle] = useState<any>(null);
  const [isExtruding, setIsExtruding] = useState(false);
  const [startMouseY, setStartMouseY] = useState(0);
  const [currentHeight, setCurrentHeight] = useState(0);
  const [extrusionPreview, setExtrusionPreview] = useState<any>(null);

  // Only show when push-pull tool is active
  if (activeTool !== 'push-pull') {
    return null;
  }

  // Handle mouse movement for hover detection and extrusion
  const handlePointerMove = useCallback((event: any) => {
    if (isExtruding && selectedRectangle) {
      // Calculate extrusion height based on mouse Y movement - MUCH MORE SENSITIVE
      const deltaY = (event.clientY - startMouseY) * -0.05; // 5x more sensitive
      const newHeight = deltaY; // Allow negative heights for intrusion
      setCurrentHeight(newHeight);

      // Update measurements
      if (onMeasurementUpdate) {
        const volume = selectedRectangle.width * selectedRectangle.height * newHeight;
        onMeasurementUpdate({
          isDrawing: true,
          activeTool: 'push-pull',
          measurements: {
            height: newHeight.toFixed(3),
            volume: volume.toFixed(3),
            baseArea: (selectedRectangle.width * selectedRectangle.height).toFixed(3),
          },
        });
      }
      return;
    }

    // Cast ray to detect rectangles for hovering
    raycaster.setFromCamera(mouse, camera);
    
    // Create intersection objects for rectangles
    const intersectObjects: THREE.Object3D[] = [];
    rectangles.forEach((rectangle) => {
      // Create a temporary mesh for intersection testing
      const tempGeometry = new THREE.PlaneGeometry(rectangle.width, rectangle.height);
      const tempMesh = new THREE.Mesh(tempGeometry);
      tempMesh.position.set(...rectangle.position);
      tempMesh.rotation.set(...rectangle.rotation);
      tempMesh.userData = { rectangleId: rectangle.id };
      intersectObjects.push(tempMesh);
    });

    const intersects = raycaster.intersectObjects(intersectObjects, false);
    
    if (intersects.length > 0) {
      const intersectedRectangleId = intersects[0].object.userData.rectangleId;
      const rectangle = rectangles.find(r => r.id === intersectedRectangleId);
      setHoveredRectangle(rectangle);
    } else {
      setHoveredRectangle(null);
    }

    // Clean up temporary meshes
    intersectObjects.forEach(obj => {
      if (obj.geometry) obj.geometry.dispose();
    });
  }, [raycaster, mouse, camera, rectangles, isExtruding, selectedRectangle, startMouseY, onMeasurementUpdate]);

  // Handle mouse clicks for starting/ending extrusion
  const handleClick = useCallback((event: any) => {
    if (isExtruding && selectedRectangle) {
      // Complete extrusion
      const finalHeight = currentHeight;
      
      if (Math.abs(finalHeight) > 0.05) { // Minimum extrusion/intrusion height
        const extrusion = {
          id: `extrusion-${Date.now()}`,
          type: 'extrusion',
          baseRectangleId: selectedRectangle.id,
          position: selectedRectangle.position,
          rotation: [0, 0, 0] as [number, number, number], // Keep upright
          scale: [1, 1, 1] as [number, number, number],
          width: selectedRectangle.width,
          height: selectedRectangle.height,
          depth: Math.abs(finalHeight), // Always positive for geometry
          volume: selectedRectangle.width * selectedRectangle.height * Math.abs(finalHeight),
          isIntrusion: finalHeight < 0, // Track if this is an intrusion
          baseArea: selectedRectangle.width * selectedRectangle.height,
          createdAt: new Date(),
          color: selectedRectangle.color || '#3b82f6',
        };

        console.log('🏗️ Creating extrusion:', extrusion);
        onExtrusionCreate(extrusion);
      }

      // Reset state
      setIsExtruding(false);
      setSelectedRectangle(null);
      setCurrentHeight(0);
      setExtrusionPreview(null);

      if (onMeasurementUpdate) {
        onMeasurementUpdate({
          isDrawing: false,
          activeTool: 'push-pull',
          measurements: null,
        });
      }
    } else if (hoveredRectangle) {
      // Start extrusion
      setSelectedRectangle(hoveredRectangle);
      setIsExtruding(true);
      setStartMouseY(event.clientY);
      setCurrentHeight(0); // Start at zero height
    }
  }, [isExtruding, selectedRectangle, hoveredRectangle, currentHeight, onExtrusionCreate, onMeasurementUpdate]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isExtruding) {
        console.log('❌ Push/Pull cancelled');
        setIsExtruding(false);
        setSelectedRectangle(null);
        setCurrentHeight(0);
        setExtrusionPreview(null);
        
        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            isDrawing: false,
            activeTool: 'push-pull',
            measurements: null,
          });
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isExtruding, onMeasurementUpdate]);

  return (
    <group>
      {/* Invisible interaction plane */}
      <mesh
        position={[0, -0.05, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerMove={handlePointerMove}
        onClick={handleClick}
        visible={false}
      >
        <planeGeometry args={[1000, 1000]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Dotted surface preview on hovered rectangle */}
      {hoveredRectangle && !isExtruding && (
        <group>
          {/* Dotted surface overlay */}
          <mesh
            position={[
              hoveredRectangle.position[0],
              hoveredRectangle.position[1] + 0.01,
              hoveredRectangle.position[2],
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[hoveredRectangle.width, hoveredRectangle.height]} />
            <meshBasicMaterial
              color="#10b981"
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>

          {/* Dotted outline */}
          <lineSegments
            position={[
              hoveredRectangle.position[0],
              hoveredRectangle.position[1] + 0.02,
              hoveredRectangle.position[2],
            ]}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={8}
                array={new Float32Array([
                  -hoveredRectangle.width/2, 0, -hoveredRectangle.height/2,
                  hoveredRectangle.width/2, 0, -hoveredRectangle.height/2,
                  hoveredRectangle.width/2, 0, -hoveredRectangle.height/2,
                  hoveredRectangle.width/2, 0, hoveredRectangle.height/2,
                  hoveredRectangle.width/2, 0, hoveredRectangle.height/2,
                  -hoveredRectangle.width/2, 0, hoveredRectangle.height/2,
                  -hoveredRectangle.width/2, 0, hoveredRectangle.height/2,
                  -hoveredRectangle.width/2, 0, -hoveredRectangle.height/2,
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#059669"
              linewidth={2}
              transparent
              opacity={0.8}
            />
          </lineSegments>

          {/* Hover instruction */}
          <Html position={[
            hoveredRectangle.position[0],
            hoveredRectangle.position[1] + 0.5,
            hoveredRectangle.position[2]
          ]}>
            <div className="bg-green-600 text-white px-3 py-1 rounded text-sm font-medium pointer-events-none transform -translate-x-1/2">
              Click to start Push/Pull
            </div>
          </Html>
        </group>
      )}

      {/* Extrusion/Intrusion preview during dragging */}
      {isExtruding && selectedRectangle && Math.abs(currentHeight) > 0.01 && (
        <group>
          {/* 3D preview of extrusion/intrusion */}
          <mesh
            position={[
              selectedRectangle.position[0],
              selectedRectangle.position[1] + (currentHeight < 0 ? currentHeight / 2 : currentHeight / 2),
              selectedRectangle.position[2],
            ]}
          >
            <boxGeometry args={[selectedRectangle.width, Math.abs(currentHeight), selectedRectangle.height]} />
            <meshBasicMaterial
              color={currentHeight < 0 ? "#ef4444" : "#3b82f6"} // Red for intrusion, blue for extrusion
              transparent
              opacity={0.6}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>

          {/* Extrusion/Intrusion outline */}
          <lineSegments
            position={[
              selectedRectangle.position[0],
              selectedRectangle.position[1] + (currentHeight < 0 ? currentHeight / 2 : currentHeight / 2),
              selectedRectangle.position[2],
            ]}
          >
            <edgesGeometry>
              <boxGeometry args={[selectedRectangle.width, Math.abs(currentHeight), selectedRectangle.height]} />
            </edgesGeometry>
            <lineBasicMaterial
              color={currentHeight < 0 ? "#dc2626" : "#1d4ed8"} // Red for intrusion, blue for extrusion
              linewidth={2}
              depthTest={false}
            />
          </lineSegments>

          {/* Height indicator with intrusion/extrusion label */}
          <Html position={[
            selectedRectangle.position[0] + selectedRectangle.width / 2 + 0.5,
            selectedRectangle.position[1] + currentHeight / 2,
            selectedRectangle.position[2]
          ]}>
            <div className={`px-3 py-2 rounded text-sm font-mono pointer-events-none ${
              currentHeight < 0 ? 'bg-red-600' : 'bg-blue-600'
            } text-white`}>
              {currentHeight < 0 ? 'Intrusion' : 'Extrusion'}: {Math.abs(currentHeight).toFixed(2)}m
            </div>
          </Html>

          {/* Base outline to show original rectangle */}
          <lineSegments
            position={[
              selectedRectangle.position[0],
              selectedRectangle.position[1] + 0.01,
              selectedRectangle.position[2],
            ]}
          >
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={8}
                array={new Float32Array([
                  -selectedRectangle.width/2, 0, -selectedRectangle.height/2,
                  selectedRectangle.width/2, 0, -selectedRectangle.height/2,
                  selectedRectangle.width/2, 0, -selectedRectangle.height/2,
                  selectedRectangle.width/2, 0, selectedRectangle.height/2,
                  selectedRectangle.width/2, 0, selectedRectangle.height/2,
                  -selectedRectangle.width/2, 0, selectedRectangle.height/2,
                  -selectedRectangle.width/2, 0, selectedRectangle.height/2,
                  -selectedRectangle.width/2, 0, -selectedRectangle.height/2,
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial
              color="#ef4444"
              linewidth={1}
              transparent
              opacity={0.6}
            />
          </lineSegments>
        </group>
      )}

      {/* Instruction text when tool is active but nothing is hovered */}
      {!hoveredRectangle && !isExtruding && (
        <Html position={[0, 2, 0]}>
          <div className="bg-black text-white px-4 py-2 rounded text-sm font-medium pointer-events-none transform -translate-x-1/2">
            Hover over a rectangle to use Push/Pull
          </div>
        </Html>
      )}
    </group>
  );
}