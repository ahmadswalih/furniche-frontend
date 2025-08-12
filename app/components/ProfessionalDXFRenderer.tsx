"use client";

import React, { useEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";
import { ProfessionalDXFObject } from "./ProfessionalDXFImporter";

interface ProfessionalDXFRendererProps {
  dxfObjects: ProfessionalDXFObject[];
  activeLayers?: string[];
}

export default function ProfessionalDXFRenderer({
  dxfObjects,
  activeLayers,
}: ProfessionalDXFRendererProps) {
  const { camera, scene } = useThree();
  const groupRefs = useRef<(THREE.Group | null)[]>([]);

  // Auto-fit camera when DXF loads
  useEffect(() => {
    if (dxfObjects.length === 0) return;

    const firstDXF = dxfObjects[0];
    const size = firstDXF.bounds.size;
    const maxDim = Math.max(size.x, size.z);

    if (maxDim > 0) {
      // Position camera to see entire DXF
      const distance = maxDim * 1.5;
      camera.position.set(distance * 0.5, distance * 0.8, distance * 0.5);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();

      console.log("📷 Professional camera positioned for DXF");
    }
  }, [dxfObjects, camera]);

  // Handle layer visibility
  useEffect(() => {
    groupRefs.current.forEach((group) => {
      if (!group) return;

      group.traverse((child) => {
        if (child.userData.layer) {
          if (activeLayers && activeLayers.length > 0) {
            child.visible = activeLayers.includes(child.userData.layer);
          } else {
            child.visible = true;
          }
        }
      });
    });
  }, [activeLayers]);

  return (
    <>
      {dxfObjects.map((dxfObject, index) => (
        <primitive
          key={dxfObject.id}
          ref={(ref: THREE.Group) => {
            groupRefs.current[index] = ref;
          }}
          object={dxfObject.mesh}
          userData={{
            type: "professional_dxf",
            metadata: dxfObject.metadata,
          }}
        />
      ))}
    </>
  );
}

// Professional DXF info panel
export function ProfessionalDXFInfo({
  dxfObjects,
}: {
  dxfObjects: ProfessionalDXFObject[];
}) {
  if (dxfObjects.length === 0) return null;

  return (
    <div className="bg-white rounded-lg shadow-lg p-4">
      <h3 className="text-sm font-semibold text-gray-800 mb-3">
        🎯 Professional DXF Import
      </h3>
      <div className="space-y-3">
        {dxfObjects.map((obj) => (
          <div key={obj.id} className="border-l-4 border-purple-500 pl-3">
            <div className="text-sm font-medium text-gray-800">
              📄 {obj.metadata.fileName}
            </div>
            <div className="text-xs text-gray-600 space-y-1 mt-1">
              <div>🔧 Entities: {obj.metadata.entityCount}</div>
              <div>
                📏 Size: {obj.bounds.size.x.toFixed(1)} ×{" "}
                {obj.bounds.size.z.toFixed(1)}
              </div>
              <div>📑 Layers: {obj.layers.length}</div>
              <div className="mt-2">
                <div className="font-medium">Layers:</div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {obj.layers.slice(0, 5).map((layer) => (
                    <span
                      key={layer}
                      className="px-1.5 py-0.5 bg-purple-50 text-purple-700 rounded text-xs"
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
