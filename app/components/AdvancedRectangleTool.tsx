'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import * as THREE from 'three';
import { useThree, useFrame } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface SnapPoint {
  point: THREE.Vector3;
  type: 'endpoint' | 'midpoint' | 'intersection' | 'grid';
  object?: any;
  distance: number;
}

interface AdvancedRectangleToolProps {
  isActive: boolean;
  objects: any[];
  onCreateRectangle: (start: THREE.Vector3, end: THREE.Vector3) => void;
}

export default function AdvancedRectangleTool({
  isActive,
  objects,
  onCreateRectangle,
}: AdvancedRectangleToolProps) {
  const { camera, raycaster, scene, mouse, size } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPoint, setStartPoint] = useState<THREE.Vector3 | null>(null);
  const [currentPoint, setCurrentPoint] = useState<THREE.Vector3 | null>(null);
  const [snapPoint, setSnapPoint] = useState<SnapPoint | null>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  
  const rectanglePreviewRef = useRef<THREE.Mesh>(null);
  const snapIndicatorRef = useRef<THREE.Mesh>(null);
  
  const SNAP_DISTANCE = 0.5;
  
  // Get all snap points from existing geometry
  const getSnapPoints = useCallback((mousePosition: THREE.Vector3): SnapPoint[] => {
    const snapPoints: SnapPoint[] = [];
    
    // Add grid snap points
    const gridSize = 1;
    const snappedX = Math.round(mousePosition.x / gridSize) * gridSize;
    const snappedZ = Math.round(mousePosition.z / gridSize) * gridSize;
    snapPoints.push({
      point: new THREE.Vector3(snappedX, 0, snappedZ),
      type: 'grid',
      distance: mousePosition.distanceTo(new THREE.Vector3(snappedX, 0, snappedZ))
    });
    
    // Add snap points from existing objects
    objects.forEach(obj => {
      if (obj.type === 'line' && obj.lineStart && obj.lineEnd) {
        // Line endpoints
        const start = new THREE.Vector3(...obj.lineStart);
        const end = new THREE.Vector3(...obj.lineEnd);
        
        snapPoints.push({
          point: start,
          type: 'endpoint',
          object: obj,
          distance: mousePosition.distanceTo(start)
        });
        
        snapPoints.push({
          point: end,
          type: 'endpoint',
          object: obj,
          distance: mousePosition.distanceTo(end)
        });
        
        // Line midpoint
        const midpoint = start.clone().lerp(end, 0.5);
        snapPoints.push({
          point: midpoint,
          type: 'midpoint',
          object: obj,
          distance: mousePosition.distanceTo(midpoint)
        });
      } else if (obj.position) {
        // Object centers and corners
        const position = new THREE.Vector3(...obj.position);
        const scale = new THREE.Vector3(...(obj.scale || [1, 1, 1]));
        
        // Center point
        snapPoints.push({
          point: position,
          type: 'intersection',
          object: obj,
          distance: mousePosition.distanceTo(position)
        });
        
        // Corner points for rectangular objects
        if (obj.type === 'cube' || obj.type === 'rectangle') {
          const corners = [
            position.clone().add(new THREE.Vector3(-scale.x/2, 0, -scale.z/2)),
            position.clone().add(new THREE.Vector3(scale.x/2, 0, -scale.z/2)),
            position.clone().add(new THREE.Vector3(scale.x/2, 0, scale.z/2)),
            position.clone().add(new THREE.Vector3(-scale.x/2, 0, scale.z/2)),
          ];
          
          corners.forEach(corner => {
            snapPoints.push({
              point: corner,
              type: 'endpoint',
              object: obj,
              distance: mousePosition.distanceTo(corner)
            });
          });
        }
      }
    });
    
    return snapPoints.sort((a, b) => a.distance - b.distance);
  }, [objects]);
  
  // Find the closest snap point
  const findClosestSnap = useCallback((mousePosition: THREE.Vector3): SnapPoint | null => {
    const snapPoints = getSnapPoints(mousePosition);
    const closest = snapPoints.find(snap => snap.distance <= SNAP_DISTANCE);
    return closest || null;
  }, [getSnapPoints]);
  
  // Update current mouse position and snap detection
  useFrame(() => {
    if (!isActive) return;
    
    const intersectionPoint = new THREE.Vector3();
    raycaster.setFromCamera(mouse, camera);
    
    // Create a ground plane for intersection
    const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    raycaster.ray.intersectPlane(groundPlane, intersectionPoint);
    
    if (intersectionPoint) {
      const snap = findClosestSnap(intersectionPoint);
      setSnapPoint(snap);
      
      const finalPoint = snap ? snap.point : intersectionPoint;
      setCurrentPoint(finalPoint);
      
      // Update dimensions if drawing
      if (isDrawing && startPoint) {
        const width = Math.abs(finalPoint.x - startPoint.x);
        const height = Math.abs(finalPoint.z - startPoint.z);
        setDimensions({ width, height });
      }
    }
  });
  
  const handleMouseDown = useCallback((event: any) => {
    if (!isActive || event.button !== 0) return;
    
    event.stopPropagation();
    
    if (!isDrawing) {
      // Start drawing
      const point = snapPoint ? snapPoint.point.clone() : currentPoint?.clone();
      if (point) {
        setStartPoint(point);
        setIsDrawing(true);
      }
    } else {
      // Complete rectangle
      if (startPoint && currentPoint) {
        const endPoint = snapPoint ? snapPoint.point.clone() : currentPoint.clone();
        onCreateRectangle(startPoint, endPoint);
        
        // Reset state
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
        setSnapPoint(null);
        setDimensions({ width: 0, height: 0 });
      }
    }
  }, [isActive, isDrawing, startPoint, currentPoint, snapPoint, onCreateRectangle]);
  
  // Handle escape key to cancel
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isDrawing) {
        setIsDrawing(false);
        setStartPoint(null);
        setCurrentPoint(null);
        setSnapPoint(null);
        setDimensions({ width: 0, height: 0 });
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDrawing]);
  
  if (!isActive) return null;
  
  return (
    <group>
      {/* Invisible ground plane for mouse events */}
      <mesh
        position={[0, -0.01, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        onPointerDown={handleMouseDown}
        visible={false}
      >
        <planeGeometry args={[200, 200]} />
        <meshBasicMaterial transparent opacity={0} />
      </mesh>
      
      {/* Snap indicator */}
      {snapPoint && (
        <group position={snapPoint.point}>
          <mesh ref={snapIndicatorRef}>
            <boxGeometry args={[0.2, 0.1, 0.2]} />
            <meshBasicMaterial 
              color="#3b82f6" 
              transparent 
              opacity={0.8}
            />
          </mesh>
          <Html>
            <div className="bg-white px-2 py-1 rounded shadow-lg text-xs font-medium border pointer-events-none transform -translate-x-1/2 -translate-y-8">
              {snapPoint.type === 'endpoint' ? 'Endpoint' :
               snapPoint.type === 'midpoint' ? 'Midpoint' :
               snapPoint.type === 'intersection' ? 'Center' :
               'Grid Point'}
            </div>
          </Html>
        </group>
      )}
      
      {/* Rectangle preview during drawing */}
      {isDrawing && startPoint && currentPoint && (
        <group>
          {/* Rectangle preview */}
          <mesh
            position={[
              (startPoint.x + currentPoint.x) / 2,
              0.02,
              (startPoint.z + currentPoint.z) / 2
            ]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry 
              args={[
                Math.abs(currentPoint.x - startPoint.x),
                Math.abs(currentPoint.z - startPoint.z)
              ]} 
            />
            <meshBasicMaterial 
              color="#3b82f6" 
              transparent 
              opacity={0.3}
              side={THREE.DoubleSide}
            />
          </mesh>
          
          {/* Rectangle outline */}
          <lineSegments
            position={[0, 0.03, 0]}
          >
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
            <lineBasicMaterial color="#1d4ed8" linewidth={2} />
          </lineSegments>
          
          {/* Dimension display */}
          <Html position={[
            (startPoint.x + currentPoint.x) / 2,
            0.5,
            (startPoint.z + currentPoint.z) / 2
          ]}>
            <div className="bg-black text-white px-2 py-1 rounded text-xs font-mono pointer-events-none transform -translate-x-1/2">
              {dimensions.width.toFixed(2)} × {dimensions.height.toFixed(2)}
            </div>
          </Html>
        </group>
      )}
    </group>
  );
}