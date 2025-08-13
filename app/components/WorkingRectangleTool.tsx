'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';
import * as THREE from 'three';

interface WorkingRectangleToolProps {
  activeTool: string;
  onRectangleCreate: (rectangle: any) => void;
  onMeasurementUpdate?: (measurements: any) => void;
  selectedLayerId?: string;
  layers: any[];
}

export default function WorkingRectangleTool({
  activeTool,
  onRectangleCreate,
  onMeasurementUpdate,
  selectedLayerId,
  layers,
}: WorkingRectangleToolProps) {
  const { raycaster, camera, scene, mouse } = useThree();
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const minimumRectangleDistance = 0.1; // Minimum distance before showing preview
  const groundPlaneRef = useRef<THREE.Mesh>(null);

  // Only show when rectangle tool is active
  if (activeTool !== 'rectangle') {
    return null;
  }

  // console.log('🔷 WorkingRectangleTool render - activeTool:', activeTool, 'currentPoint:', currentPoint, 'isDrawing:', isDrawing);

  // Handle mouse movement with onPointerMove - SIMPLIFIED
  const handlePointerMove = useCallback((event: any) => {
    // Cast ray to ground plane
    raycaster.setFromCamera(mouse, camera);
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const intersection = new THREE.Vector3();
    
    if (raycaster.ray.intersectPlane(groundPlane, intersection)) {
      setCurrentPoint(intersection);
      
      // Only show preview when actively drawing and moved minimum distance
      if (isDrawing && startPoint) {
        const distance = intersection.distanceTo(startPoint);
        setShowPreview(distance >= minimumRectangleDistance);
        
        // Update measurements only when drawing
        if (onMeasurementUpdate) {
          const width = Math.abs(intersection.x - startPoint.x);
          const height = Math.abs(intersection.z - startPoint.z);
          const area = width * height;
          const perimeter = 2 * (width + height);
          
          onMeasurementUpdate({
            isDrawing: true,
            activeTool: 'rectangle',
            measurements: {
              width: width.toFixed(3),
              height: height.toFixed(3),
              area: area.toFixed(3),
              perimeter: perimeter.toFixed(3),
            },
          });
        }
      }
    }
  }, [raycaster, mouse, camera, isDrawing, startPoint, onMeasurementUpdate, minimumRectangleDistance]);

  // No more snap points - user has full control

  // Handle mouse clicks
  const handleClick = useCallback((event: any) => {
    event.stopPropagation();
    
    if (!currentPoint) return;
    
    if (!isDrawing) {
      // Start drawing
      setStartPoint(currentPoint.clone());
      setIsDrawing(true);
      setShowPreview(false); // Don't show preview until mouse moves
    } else if (startPoint) {
      // Complete rectangle
      const width = Math.abs(currentPoint.x - startPoint.x);
      const height = Math.abs(currentPoint.z - startPoint.z);
      
      if (width > 0.1 && height > 0.1) { // Minimum size check
        const centerX = (startPoint.x + currentPoint.x) / 2;
        const centerZ = (startPoint.z + currentPoint.z) / 2;
        const area = width * height;
        const perimeter = 2 * (width + height);
        
        const rectangle = {
          id: `rectangle-${Date.now()}`,
          type: 'rectangle',
          startPoint: [startPoint.x, startPoint.y, startPoint.z],
          endPoint: [currentPoint.x, currentPoint.y, currentPoint.z],
          position: [centerX, 0.01, centerZ] as [number, number, number],
          rotation: [-Math.PI / 2, 0, 0] as [number, number, number], // Ensure it lies flat on ground
          scale: [1, 1, 1] as [number, number, number],
          width,
          height,
          area,
          perimeter,
          layerId: selectedLayerId || 'default',
          createdAt: new Date(),
          color: '#3b82f6',
          selected: false,
        };
        
        // console.log('🔷 Creating rectangle:', rectangle);
        onRectangleCreate(rectangle);
        
        // Reset state
        setStartPoint(null);
        setCurrentPoint(null);
        setIsDrawing(false);
        setShowPreview(false);
        
        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            isDrawing: false,
            activeTool: 'rectangle',
            measurements: null,
          });
        }
      }
    }
  }, [currentPoint, isDrawing, startPoint, onRectangleCreate, selectedLayerId, onMeasurementUpdate]);

  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawing) {
        // console.log('❌ Rectangle drawing cancelled');
        setStartPoint(null);
        setCurrentPoint(null);
        setIsDrawing(false);
        setShowPreview(false);
        
        if (onMeasurementUpdate) {
          onMeasurementUpdate({
            isDrawing: false,
            activeTool: 'rectangle',
            measurements: null,
          });
        }
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing, onMeasurementUpdate]);

  return (
    <group>
      {/* Invisible ground plane for mouse interaction */}
      <mesh
        ref={groundPlaneRef}
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={handleClick}
        onPointerMove={handlePointerMove}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>

      {/* Drawing preview - only show after minimum distance */}
      {isDrawing && startPoint && currentPoint && showPreview && (
        <group>
          {/* Rectangle preview - lying flat on ground with fixed scaling */}
          <mesh
            position={[
              (startPoint.x + currentPoint.x) / 2,
              0.02,
              (startPoint.z + currentPoint.z) / 2,
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry
              args={[
                Math.abs(currentPoint.x - startPoint.x),
                Math.abs(currentPoint.z - startPoint.z),
              ]}
            />
            <meshBasicMaterial
              color='#3b82f6'
              transparent
              opacity={0.3}
              side={THREE.DoubleSide}
              depthTest={false}
            />
          </mesh>
          
          {/* Rectangle outline - simplified */}
          <lineSegments position={[0, 0.03, 0]}>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={8}
                array={new Float32Array([
                  startPoint.x, 0, startPoint.z,
                  currentPoint.x, 0, startPoint.z,
                  currentPoint.x, 0, startPoint.z,
                  currentPoint.x, 0, currentPoint.z,
                  currentPoint.x, 0, currentPoint.z,
                  startPoint.x, 0, currentPoint.z,
                  startPoint.x, 0, currentPoint.z,
                  startPoint.x, 0, startPoint.z,
                ])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial 
              color='#1d4ed8' 
              linewidth={2}
              depthTest={false}
            />
          </lineSegments>
          
          {/* Dimension display */}
          <Html position={[
            (startPoint.x + currentPoint.x) / 2,
            0.5,
            (startPoint.z + currentPoint.z) / 2
          ]}>
            <div className="bg-black text-white px-2 py-1 rounded text-xs font-mono pointer-events-none transform -translate-x-1/2">
              {Math.abs(currentPoint.x - startPoint.x).toFixed(2)} × {Math.abs(currentPoint.z - startPoint.z).toFixed(2)}m
            </div>
          </Html>
        </group>
      )}

      {/* No snap point indicators - user has full control */}

      {/* Start point indicator - always show when drawing */}
      {isDrawing && startPoint && (
        <mesh position={[startPoint.x, 0.05, startPoint.z]}>
          <sphereGeometry args={[0.08]} />
          <meshBasicMaterial color="#ef4444" />
        </mesh>
      )}

      {/* Start point instruction text - show before preview appears */}
      {isDrawing && startPoint && !showPreview && (
        <Html position={[startPoint.x, 0.8, startPoint.z]}>
          <div className="bg-black text-white px-3 py-1 rounded text-sm font-medium pointer-events-none transform -translate-x-1/2">
            Move mouse to set rectangle size
          </div>
        </Html>
      )}

      {/* Subtle cursor position indicator (when tool is active and not drawing) */}
      {currentPoint && !isDrawing && (
        <mesh position={[currentPoint.x, 0.01, currentPoint.z]}>
          <ringGeometry args={[0.05, 0.08, 8]} />
          <meshBasicMaterial color="#6b7280" transparent opacity={0.3} />
        </mesh>
      )}

    </group>
  );
}