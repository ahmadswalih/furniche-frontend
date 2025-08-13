"use client";

import React, { useState, useEffect } from "react";
import { BackendDXFObject } from "./BackendDXFImporter";

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  color: string;
  objects: string[]; // Array of object IDs in this layer
  type: "dxf" | "geometry" | "system";
  createdAt: Date;
  description?: string;
}

interface LayerManagerProps {
  layers: Layer[];
  onLayerUpdate: (layerId: string, updates: Partial<Layer>) => void;
  onLayerDelete: (layerId: string) => void;
  onLayerCreate: (layer: Omit<Layer, "id" | "createdAt">) => void;
  onLayerVisibilityChange: (layerId: string, visible: boolean) => void;
  onLayerLockChange: (layerId: string, locked: boolean) => void;
  selectedLayerId?: string;
  onLayerSelect: (layerId: string) => void;
}

export default function LayerManager({
  layers,
  onLayerUpdate,
  onLayerDelete,
  onLayerCreate,
  onLayerVisibilityChange,
  onLayerLockChange,
  selectedLayerId,
  onLayerSelect,
}: LayerManagerProps) {
  const [expandedLayers, setExpandedLayers] = useState<Set<string>>(new Set());
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newLayerName, setNewLayerName] = useState("");
  const [newLayerColor, setNewLayerColor] = useState("#3B82F6");
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-expand layers with objects
  useEffect(() => {
    const layersWithObjects = layers.filter(layer => layer.objects.length > 0);
    const newExpanded = new Set(expandedLayers);
    layersWithObjects.forEach(layer => newExpanded.add(layer.id));
    setExpandedLayers(newExpanded);
  }, [layers]);

  const toggleLayerExpansion = (layerId: string) => {
    const newExpanded = new Set(expandedLayers);
    if (newExpanded.has(layerId)) {
      newExpanded.delete(layerId);
    } else {
      newExpanded.add(layerId);
    }
    setExpandedLayers(newExpanded);
  };

  const handleCreateLayer = () => {
    if (newLayerName.trim()) {
      onLayerCreate({
        name: newLayerName.trim(),
        visible: true,
        locked: false,
        color: newLayerColor,
        objects: [],
        type: "geometry",
        description: "User-created layer",
      });
      setNewLayerName("");
      setShowCreateForm(false);
    }
  };

  const filteredLayers = layers.filter(layer =>
    layer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    layer.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLayerIcon = (layer: Layer) => {
    switch (layer.type) {
      case "dxf":
        return "📄";
      case "geometry":
        return "🔷";
      case "system":
        return "⚙️";
      default:
        return "📁";
    }
  };

  const getLayerStatusIcon = (layer: Layer) => {
    if (layer.locked) return "🔒";
    if (!layer.visible) return "👁️‍🗨️";
    return "👁️";
  };

  return (
    <div className="bg-white rounded-lg shadow-lg border border-gray-200 w-80">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-4 rounded-t-lg">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">📚 Layer Outliner</h3>
          <div className="flex space-x-2">
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
              title="Create new layer"
            >
              ➕
            </button>
            <button
              onClick={() => setExpandedLayers(new Set(layers.map(l => l.id)))}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
              title="Expand all layers"
            >
              🔽
            </button>
            <button
              onClick={() => setExpandedLayers(new Set())}
              className="p-1.5 bg-white/20 hover:bg-white/30 rounded transition-colors"
              title="Collapse all layers"
            >
              🔼
            </button>
          </div>
        </div>
        
        {/* Search */}
        <div className="mt-3">
          <input
            type="text"
            placeholder="🔍 Search layers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-3 py-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
        </div>
      </div>

      {/* Create Layer Form */}
      {showCreateForm && (
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Layer name"
              value={newLayerName}
              onChange={(e) => setNewLayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex items-center space-x-3">
              <input
                type="color"
                value={newLayerColor}
                onChange={(e) => setNewLayerColor(e.target.value)}
                className="w-10 h-8 border border-gray-300 rounded cursor-pointer"
              />
              <button
                onClick={handleCreateLayer}
                disabled={!newLayerName.trim()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Layer
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Layer List */}
      <div className="max-h-96 overflow-y-auto">
        {filteredLayers.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            {searchTerm ? "No layers found matching your search." : "No layers created yet."}
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredLayers.map((layer) => (
              <div key={layer.id} className="group">
                {/* Layer Header */}
                <div
                  className={`p-3 hover:bg-gray-50 cursor-pointer transition-colors ${
                    selectedLayerId === layer.id ? "bg-blue-50 border-l-4 border-blue-500" : ""
                  }`}
                  onClick={() => onLayerSelect(layer.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleLayerExpansion(layer.id);
                        }}
                        className="w-5 h-5 flex items-center justify-center text-gray-500 hover:text-gray-700"
                      >
                        {expandedLayers.has(layer.id) ? "🔽" : "▶️"}
                      </button>
                      <span className="text-lg">{getLayerIcon(layer)}</span>
                      <span className="font-medium text-gray-900">{layer.name}</span>
                      {layer.objects.length > 0 && (
                        <span className="text-xs bg-gray-200 text-gray-600 px-2 py-1 rounded-full">
                          {layer.objects.length}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerVisibilityChange(layer.id, !layer.visible);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={layer.visible ? "Hide layer" : "Show layer"}
                      >
                        {getLayerStatusIcon(layer)}
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onLayerLockChange(layer.id, !layer.locked);
                        }}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                        title={layer.locked ? "Unlock layer" : "Lock layer"}
                      >
                        {layer.locked ? "🔒" : "🔓"}
                      </button>
                      {layer.type !== "system" && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onLayerDelete(layer.id);
                          }}
                          className="p-1 hover:bg-red-100 text-red-600 rounded transition-colors"
                          title="Delete layer"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Layer Info */}
                  <div className="mt-2 text-xs text-gray-500">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: layer.color }}></span>
                    {layer.type} • {layer.objects.length} objects • Created {layer.createdAt.toLocaleDateString()}
                  </div>
                </div>

                {/* Layer Objects (when expanded) */}
                {expandedLayers.has(layer.id) && layer.objects.length > 0 && (
                  <div className="bg-gray-50 border-l-4 border-gray-200 ml-4">
                    {layer.objects.map((objectId) => (
                      <div key={objectId} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100">
                        📦 {objectId}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer Stats */}
      <div className="p-3 bg-gray-50 border-t border-gray-200 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>{filteredLayers.length} layers</span>
          <span>{layers.filter(l => l.visible).length} visible</span>
          <span>{layers.filter(l => l.locked).length} locked</span>
        </div>
      </div>
    </div>
  );
}
