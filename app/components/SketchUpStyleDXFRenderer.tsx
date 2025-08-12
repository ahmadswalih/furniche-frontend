"use client";

import React, { useEffect } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { SketchUpDXFObject } from "./SketchUpStyleDXFImporter";

interface SketchUpStyleDXFRendererProps {
  dxfObjects: SketchUpDXFObject[];
  activeLayers?: string[];
}

export default function SketchUpStyleDXFRenderer({
  dxfObjects,
  activeLayers,
}: SketchUpStyleDXFRendererProps) {
  const { camera } = useThree();

  // Auto-fit camera when DXF loads
  useEffect(() => {
    if (dxfObjects.length === 0) return;

    const firstDXF = dxfObjects[0];
    const size = firstDXF.bounds.size;
    const maxDim = Math.max(size.x, size.z);

    if (maxDim > 0) {
      // Position camera to see entire DXF (top-down view like SketchUp)
      const distance = maxDim * 1.2;
      camera.position.set(0, distance, distance * 0.2);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      console.log("📷 SketchUp camera positioned for floor plan view");
    }
  }, [dxfObjects, camera]);

  // Handle layer visibility
  useEffect(() => {
    dxfObjects.forEach((dxfObject) => {
      dxfObject.mesh.traverse((child) => {
        if (child.userData.layer) {
          if (activeLayers && activeLayers.length > 0) {
            child.visible = activeLayers.includes(child.userData.layer);
          } else {
            child.visible = true;
          }
        }
      });
    });
  }, [dxfObjects, activeLayers]);

  return (
    <>
      {dxfObjects.map((dxfObject) => (
        <primitive
          key={dxfObject.id}
          object={dxfObject.mesh}
          userData={{
            type: "sketchup_dxf",
            metadata: dxfObject.metadata,
          }}
        />
      ))}
    </>
  );
}

// SketchUp-style DXF info panel
export function SketchUpDXFInfo({
  dxfObjects,
}: {
  dxfObjects: SketchUpDXFObject[];
}) {
  if (dxfObjects.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        🎨 SketchUp-Style DXF Import
      </h3>
      <div className="space-y-3">
        {dxfObjects.map((obj) => (
          <div key={obj.id} className="border-l-4 border-green-500 pl-3">
            <div className="text-sm font-medium text-gray-800">
              📄 {obj.metadata.fileName}
            </div>
            <div className="text-xs text-gray-600 space-y-1 mt-1">
              <div>🔧 Entities: {obj.metadata.entityCount}</div>
              <div>🏗️ Faces: {obj.metadata.faceCount}</div>
              <div>
                📏 Size: {obj.bounds.size.x.toFixed(1)} ×{" "}
                {obj.bounds.size.z.toFixed(1)}
              </div>
              <div>📐 Units: {obj.metadata.units}</div>
              <div>📑 Layers: {obj.layers.length}</div>
              <div className="mt-2">
                <div className="font-medium">Layers:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {obj.layers.slice(0, 5).map((layer) => (
                    <span
                      key={layer}
                      className="px-1.5 py-0.5 bg-green-50 text-green-700 rounded text-xs"
                    >
                      {layer}
                    </span>
                  ))}
                  {obj.layers.length > 5 && (
                    <span className="text-xs text-gray-500">
                      +{obj.layers.length - 5} more
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
