"use client";

import React, { useState, useEffect, useRef } from "react";
import { DXFViewerResult } from "./ProperDXFImporter";
import * as THREE from "three";

interface ProperDXFRendererProps {
  dxfResults: DXFViewerResult[];
  onRemove?: (id: string) => void;
}

export default function ProperDXFRenderer({
  dxfResults,
  onRemove,
}: ProperDXFRendererProps) {
  if (!dxfResults || dxfResults.length === 0) return null;

  console.log("🏗️ Rendering DXF viewer results:", {
    count: dxfResults.length,
    results: dxfResults.map((result) => ({
      id: result.id,
      name: result.name,
      hasViewer: !!result.viewer,
      hasCanvas: !!result.canvas,
    })),
  });

  return (
    <group name="proper-dxf-renderer">
      {dxfResults.map((result) => (
        <DXFViewerRenderer
          key={result.id}
          result={result}
          onRemove={onRemove}
        />
      ))}
    </group>
  );
}

interface DXFViewerRendererProps {
  result: DXFViewerResult;
  onRemove?: (id: string) => void;
}

function DXFViewerRenderer({ result, onRemove }: DXFViewerRendererProps) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    if (result.canvas) {
      console.log(
        `🎨 Creating HIGH QUALITY texture from DXF canvas for ${result.name}`
      );

      // Create high-quality texture from canvas with transparency
      const canvasTexture = new THREE.CanvasTexture(result.canvas);
      canvasTexture.needsUpdate = true;
      canvasTexture.flipY = false;

      // High quality settings
      canvasTexture.generateMipmaps = false;
      canvasTexture.minFilter = THREE.LinearFilter;
      canvasTexture.magFilter = THREE.LinearFilter;
      canvasTexture.format = THREE.RGBAFormat;

      setTexture(canvasTexture);

      // Update texture periodically to capture changes
      const updateInterval = setInterval(() => {
        if (canvasTexture) {
          canvasTexture.needsUpdate = true;
        }
      }, 100);

      return () => {
        clearInterval(updateInterval);
        canvasTexture.dispose();
      };
    }
  }, [result.canvas, result.name]);

  if (!texture) {
    console.log(`⏳ Waiting for texture creation for ${result.name}`);
    return null;
  }

  console.log(`✅ Rendering HIGH QUALITY DXF result: ${result.name}`);

  return (
    <group name={`dxf-result-${result.id}`}>
      {/* Render DXF with high quality settings and NO BACKGROUND */}
      <mesh
        ref={meshRef}
        position={[0, 0.01, 0]} // Slightly above ground
        rotation={[-Math.PI / 2, 0, 0]} // Lie flat
        userData={{
          type: "dxf-viewer-result",
          id: result.id,
          name: result.name,
        }}
      >
        <planeGeometry args={[20, 20]} />
        <meshBasicMaterial
          map={texture}
          transparent={true}
          opacity={1.0}
          side={THREE.DoubleSide}
          // Advanced transparency settings to remove black background
          alphaTest={0.01} // Very low threshold to show only actual content
          depthWrite={false} // Prevent depth issues with transparency
          // Color to white for proper texture rendering
          color={0xffffff}
        />
      </mesh>
    </group>
  );
}

// Controls Component
export function ProperDXFControls({
  dxfResults,
  onRemove,
  onClearAll,
}: {
  dxfResults: DXFViewerResult[];
  onRemove: (id: string) => void;
  onClearAll: () => void;
}) {
  if (!dxfResults || dxfResults.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-800">
          📐 DXF Floor Plans
        </h3>
        {dxfResults.length > 1 && (
          <button
            onClick={onClearAll}
            className="px-2 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      <div className="space-y-3">
        {dxfResults.map((result) => (
          <div
            key={result.id}
            className="border border-gray-200 rounded-md p-3"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="font-medium text-sm text-gray-800">
                  {result.name}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Loaded at{" "}
                  {new Date(result.metadata.importTime).toLocaleTimeString()}
                </div>
              </div>
              <button
                onClick={() => onRemove(result.id)}
                className="px-2 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600 transition-colors ml-2"
              >
                Remove
              </button>
            </div>

            {/* DXF Viewer Controls */}
            <div className="mt-2 pt-2 border-t border-gray-100">
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    if (result.viewer) {
                      // Fit to view
                      try {
                        result.viewer.SetView?.("top");
                      } catch (err) {
                        console.warn("Could not set view:", err);
                      }
                    }
                  }}
                  className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
                >
                  Top View
                </button>
                <button
                  onClick={() => {
                    if (result.viewer) {
                      try {
                        result.viewer.ZoomToFit?.();
                      } catch (err) {
                        console.warn("Could not zoom to fit:", err);
                      }
                    }
                  }}
                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600 transition-colors"
                >
                  Fit View
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Info Component
export function ProperDXFInfo({
  dxfResults,
}: {
  dxfResults: DXFViewerResult[];
}) {
  if (!dxfResults || dxfResults.length === 0) return null;

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-green-800 mb-2">
        📊 DXF Viewer Status
      </h4>
      <div className="space-y-1 text-xs text-green-700">
        <div>Active Floor Plans: {dxfResults.length}</div>
        <div className="mt-2 pt-2 border-t border-green-200">
          {dxfResults.map((result) => (
            <div key={result.id} className="flex justify-between">
              <span>{result.name}:</span>
              <span>✅ Loaded</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
