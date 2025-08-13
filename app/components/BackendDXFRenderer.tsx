"use client";

import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { BackendDXFObject } from "./BackendDXFImporter";

interface BackendDXFRendererProps {
  dxfObjects: BackendDXFObject[];
  activeLayers?: string[];
}

export default function BackendDXFRenderer({
  dxfObjects,
  activeLayers,
}: BackendDXFRendererProps) {
  const { camera } = useThree();

  // Auto-fit camera when DXF loads
  useEffect(() => {
    if (dxfObjects.length === 0) return;

    const firstDXF = dxfObjects[0];
    const size = firstDXF.bounds.size;
    const maxDim = Math.max(size.x, size.z);

    if (maxDim > 0) {
      // Position camera for architectural floor plan view
      const distance = maxDim * 1.5;
      camera.position.set(distance * 0.3, distance * 0.8, distance * 0.3);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      console.log("🎯 Backend DXF camera positioned for architectural view");
    }
  }, [dxfObjects, camera]);

  // Handle layer visibility
  useEffect(() => {
    dxfObjects.forEach((dxfObject) => {
      if (dxfObject.mesh && typeof dxfObject.mesh.traverse === "function") {
        dxfObject.mesh.traverse((child) => {
          if (child.userData?.layer) {
            if (activeLayers && activeLayers.length > 0) {
              child.visible = activeLayers.includes(child.userData.layer);
            } else {
              child.visible = true;
            }
          }
        });
      }
    });
  }, [dxfObjects, activeLayers]);

  return (
    <>
      {dxfObjects.map((dxfObject) => {
        // Safety check to ensure mesh exists and is a THREE.Object3D
        if (!dxfObject.mesh || typeof dxfObject.mesh.traverse !== "function") {
          console.warn("⚠️ Invalid mesh object for DXF:", dxfObject.id);
          return null;
        }

        return (
          <primitive
            key={dxfObject.id}
            object={dxfObject.mesh}
            userData={{
              type: "backend_dxf",
              metadata: dxfObject.metadata,
            }}
          />
        );
      })}
    </>
  );
}

// Backend DXF info panel
export function BackendDXFInfo({
  dxfObjects,
}: {
  dxfObjects: BackendDXFObject[];
}) {
  const [isVisible, setIsVisible] = React.useState(true);

  if (dxfObjects.length === 0) return null;

  // If popup is hidden, show a small floating button to bring it back
  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsVisible(true)}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-lg transition-all duration-200 hover:scale-110"
          title="Show DXF import info"
          aria-label="Show DXF import info"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 border-l-4 border-blue-500 relative">
      {/* Close button */}
      <button
        onClick={() => setIsVisible(false)}
        className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded-full transition-colors duration-200"
        title="Close popup"
        aria-label="Close popup"
      >
        <svg
          className="w-4 h-4 text-gray-500 hover:text-gray-700"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>

      <h3 className="text-sm font-semibold text-gray-800 mb-3 pr-8">
        🚀 Backend-Powered DXF Import
      </h3>
      <div className="space-y-3">
        {dxfObjects.map((obj) => (
          <div key={obj.id} className="border-l-4 border-blue-400 pl-3">
            <div className="text-sm font-medium text-gray-800">
              📄 {obj.metadata?.fileName || "DXF File"}
            </div>
            <div className="text-xs text-gray-600 space-y-1 mt-1">
              <div className="flex justify-between">
                <span>🔧 Entities:</span>
                <span className="font-medium">
                  {obj.metadata?.entityCount || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>🏗️ Faces:</span>
                <span className="font-medium">
                  {obj.metadata?.faceCount || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>📑 Layers:</span>
                <span className="font-medium">
                  {obj.metadata?.layerCount || obj.layers?.length || 0}
                </span>
              </div>
              <div className="flex justify-between">
                <span>📐 Units:</span>
                <span className="font-medium">
                  {obj.metadata?.units || "Unknown"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>📋 DXF Version:</span>
                <span className="font-medium">
                  {obj.metadata?.dxfVersion || "Unknown"}
                </span>
              </div>
              {obj.bounds?.size && (
                <div className="flex justify-between">
                  <span>📏 Size:</span>
                  <span className="font-medium">
                    {obj.bounds.size.x.toFixed(1)} ×{" "}
                    {obj.bounds.size.z.toFixed(1)}
                  </span>
                </div>
              )}

              <div className="mt-2">
                <div className="font-medium text-xs">Active Layers:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {(obj.layers || []).slice(0, 3).map((layer) => (
                    <span
                      key={layer}
                      className="px-1.5 py-0.5 bg-blue-50 text-blue-700 rounded text-xs"
                    >
                      {layer}
                    </span>
                  ))}
                  {obj.layers.length > 3 && (
                    <span className="text-xs text-gray-500">
                      +{obj.layers.length - 3} more
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-2 p-2 bg-green-50 rounded text-xs">
                <div className="font-medium text-green-800">
                  ✅ Backend Processing
                </div>
                <div className="text-green-700">
                  Processed with professional Python libraries (ezdxf + numpy +
                  shapely)
                </div>
              </div>
            </div>
          </div>
        ))}

        {/* Show Again button */}
        <div className="pt-3 border-t border-gray-200">
          <button
            onClick={() => setIsVisible(false)}
            className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium rounded-md transition-colors duration-200"
          >
            ✨ Got it, thanks!
          </button>
        </div>
      </div>
    </div>
  );
}
