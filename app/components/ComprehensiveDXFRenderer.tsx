"use client";

import React, { useMemo, useState } from "react";
import { DXFFloorPlan, DXFEntity } from "./ComprehensiveDXFImporter";
import * as THREE from "three";

interface ComprehensiveDXFRendererProps {
  floorPlans: DXFFloorPlan[];
  activeLayers?: string[];
  onLayerVisibilityChange?: (
    floorPlanId: string,
    layer: string,
    visible: boolean
  ) => void;
}

export default function ComprehensiveDXFRenderer({
  floorPlans,
  activeLayers = [],
  onLayerVisibilityChange,
}: ComprehensiveDXFRendererProps) {
  if (!floorPlans || floorPlans.length === 0) return null;

  console.log("🏗️ Rendering comprehensive DXF floor plans:", {
    count: floorPlans.length,
    plans: floorPlans.map((plan) => ({
      id: plan.id,
      name: plan.name,
      entities: plan.entities.length,
      layers: Object.keys(plan.layers).length,
    })),
  });

  return (
    <group name="comprehensive-dxf-floor-plans">
      {floorPlans.map((floorPlan) => (
        <DXFFloorPlanRenderer
          key={floorPlan.id}
          floorPlan={floorPlan}
          activeLayers={activeLayers}
          onLayerVisibilityChange={onLayerVisibilityChange}
        />
      ))}
    </group>
  );
}

interface DXFFloorPlanRendererProps {
  floorPlan: DXFFloorPlan;
  activeLayers: string[];
  onLayerVisibilityChange?: (
    floorPlanId: string,
    layer: string,
    visible: boolean
  ) => void;
}

function DXFFloorPlanRenderer({
  floorPlan,
  activeLayers,
  onLayerVisibilityChange,
}: DXFFloorPlanRendererProps) {
  // Group entities by layer for efficient rendering
  const layerGroups = useMemo(() => {
    const groups: { [key: string]: DXFEntity[] } = {};

    floorPlan.entities.forEach((entity) => {
      if (!groups[entity.layer]) {
        groups[entity.layer] = [];
      }
      groups[entity.layer].push(entity);
    });

    return groups;
  }, [floorPlan.entities]);

  console.log("📐 Rendering floor plan:", {
    name: floorPlan.name,
    totalEntities: floorPlan.entities.length,
    layers: Object.keys(layerGroups),
    bounds: floorPlan.bounds,
  });

  return (
    <group
      name={`floor-plan-${floorPlan.id}`}
      position={[-floorPlan.bounds.center.x, 0, -floorPlan.bounds.center.z]}
    >
      {Object.entries(layerGroups).map(([layerName, entities]) => {
        const layerInfo = floorPlan.layers[layerName];
        const isVisible =
          layerInfo?.visible !== false &&
          (activeLayers.length === 0 || activeLayers.includes(layerName));

        if (!isVisible) return null;

        return (
          <DXFLayerRenderer
            key={`${floorPlan.id}-${layerName}`}
            layerName={layerName}
            entities={entities}
            layerInfo={layerInfo}
            floorPlanId={floorPlan.id}
          />
        );
      })}
    </group>
  );
}

interface DXFLayerRendererProps {
  layerName: string;
  entities: DXFEntity[];
  layerInfo: { color: string; visible: boolean; entities: DXFEntity[] };
  floorPlanId: string;
}

function DXFLayerRenderer({
  layerName,
  entities,
  layerInfo,
  floorPlanId,
}: DXFLayerRendererProps) {
  console.log(`🎨 Rendering layer "${layerName}":`, {
    entities: entities.length,
    color: layerInfo.color,
    visible: layerInfo.visible,
  });

  return (
    <group name={`layer-${layerName}`}>
      {entities.map((entity) => (
        <DXFEntityRenderer
          key={entity.id}
          entity={entity}
          layerName={layerName}
        />
      ))}
    </group>
  );
}

interface DXFEntityRendererProps {
  entity: DXFEntity;
  layerName: string;
}

function DXFEntityRenderer({ entity, layerName }: DXFEntityRendererProps) {
  // Create a mesh for each entity
  return (
    <mesh
      key={entity.id}
      name={`entity-${entity.type}-${entity.id}`}
      position={entity.position}
      rotation={entity.rotation}
      scale={entity.scale}
      geometry={entity.geometry}
      material={entity.material}
      userData={{
        entityType: entity.metadata.entityType,
        layer: layerName,
        originalData: entity.metadata.originalData,
      }}
    />
  );
}

// Layer Controls Component
export function DXFFloorPlanControls({
  floorPlans,
  activeLayers = [],
  onLayerToggle,
  onFloorPlanToggle,
}: {
  floorPlans: DXFFloorPlan[];
  activeLayers: string[];
  onLayerToggle: (floorPlanId: string, layer: string, visible: boolean) => void;
  onFloorPlanToggle: (floorPlanId: string, visible: boolean) => void;
}) {
  const [expandedPlans, setExpandedPlans] = useState<string[]>([]);

  if (!floorPlans || floorPlans.length === 0) return null;

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans((prev) =>
      prev.includes(planId)
        ? prev.filter((id) => id !== planId)
        : [...prev, planId]
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-4 max-w-sm">
      <h3 className="text-lg font-semibold text-gray-800 mb-3">
        🏗️ Floor Plans
      </h3>

      <div className="space-y-4">
        {floorPlans.map((plan) => {
          const isExpanded = expandedPlans.includes(plan.id);
          const allLayers = Object.keys(plan.layers);

          return (
            <div key={plan.id} className="border border-gray-200 rounded-md">
              {/* Floor Plan Header */}
              <div className="p-3 bg-gray-50 flex items-center justify-between">
                <button
                  onClick={() => togglePlanExpansion(plan.id)}
                  className="flex items-center space-x-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                >
                  <span>{isExpanded ? "📖" : "📘"}</span>
                  <span>{plan.name}</span>
                  <span className="text-xs text-gray-500">
                    ({plan.metadata.totalEntities} entities)
                  </span>
                </button>

                <div className="flex items-center space-x-1 text-xs text-gray-500">
                  <span>{Object.keys(plan.layers).length} layers</span>
                  <span>•</span>
                  <span>{plan.units}</span>
                </div>
              </div>

              {/* Layer Controls */}
              {isExpanded && (
                <div className="p-3 space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-gray-600">
                      Layers
                    </span>
                    <button
                      onClick={() => {
                        const allVisible = allLayers.every((layer) =>
                          activeLayers.includes(layer)
                        );
                        allLayers.forEach((layer) => {
                          onLayerToggle(plan.id, layer, !allVisible);
                        });
                      }}
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      {allLayers.every((layer) => activeLayers.includes(layer))
                        ? "Hide All"
                        : "Show All"}
                    </button>
                  </div>

                  {allLayers.map((layerName) => {
                    const layer = plan.layers[layerName];
                    const isVisible = activeLayers.includes(layerName);

                    return (
                      <label
                        key={layerName}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={(e) =>
                            onLayerToggle(plan.id, layerName, e.target.checked)
                          }
                          className="w-4 h-4 text-blue-600"
                        />
                        <div
                          className="w-4 h-4 border border-gray-300 rounded"
                          style={{ backgroundColor: layer.color }}
                        />
                        <span className="text-gray-700">{layerName}</span>
                        <span className="text-xs text-gray-500">
                          ({layer.entities.length})
                        </span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Info Panel Component
export function DXFFloorPlanInfo({
  floorPlans,
}: {
  floorPlans: DXFFloorPlan[];
}) {
  if (!floorPlans || floorPlans.length === 0) return null;

  const totalEntities = floorPlans.reduce(
    (sum, plan) => sum + plan.metadata.totalEntities,
    0
  );
  const totalLayers = floorPlans.reduce(
    (sum, plan) => sum + plan.metadata.layerCount,
    0
  );

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
      <h4 className="text-sm font-semibold text-blue-800 mb-2">
        📊 DXF Import Summary
      </h4>
      <div className="space-y-1 text-xs text-blue-700">
        <div>Floor Plans: {floorPlans.length}</div>
        <div>Total Entities: {totalEntities}</div>
        <div>Total Layers: {totalLayers}</div>
        <div className="mt-2 pt-2 border-t border-blue-200">
          {floorPlans.map((plan) => (
            <div key={plan.id} className="flex justify-between">
              <span>{plan.name}:</span>
              <span>{plan.metadata.totalEntities} entities</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
