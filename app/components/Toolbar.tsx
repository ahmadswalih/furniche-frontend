"use client";

import { useState } from "react";
import {
  MousePointer,
  Move,
  RotateCcw,
  Scale,
  Minus,
  Square,
  Circle,
  Box,
  Cylinder,
  ArrowUp,
  Diameter,
  FileText,
  Upload,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: "draw" | "model" | "modify" | "view" | "file";
}

const tools: Tool[] = [
  { id: "select", name: "Select", icon: MousePointer, category: "view" },
  { id: "move", name: "Move", icon: Move, category: "modify" },
  { id: "rotate", name: "Rotate", icon: RotateCcw, category: "modify" },
  { id: "scale", name: "Scale", icon: Scale, category: "modify" },
  { id: "line", name: "Line", icon: Minus, category: "draw" },
  { id: "rectangle", name: "Rectangle", icon: Square, category: "draw" },
  { id: "circle", name: "Circle", icon: Circle, category: "draw" },
  { id: "cube", name: "Cube", icon: Box, category: "model" },
  { id: "cylinder", name: "Cylinder", icon: Cylinder, category: "model" },
  { id: "sphere", name: "Sphere", icon: Diameter, category: "model" },
  { id: "extrude", name: "Extrude", icon: ArrowUp, category: "modify" },
  { id: "import-dxf", name: "Import DXF", icon: Upload, category: "file" },
];

interface ToolbarProps {
  activeTool: string;
  onToolChange: (toolId: string) => void;
  onDxfImport?: (file: File) => void;
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onDxfImport,
}: ToolbarProps) {
  const [collapsed, setCollapsed] = useState(false);

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = [];
    }
    acc[tool.category].push(tool);
    return acc;
  }, {} as Record<string, Tool[]>);

  const handleToolClick = (toolId: string) => {
    if (toolId === "import-dxf") {
      const input = document.createElement("input");
      input.type = "file";
      input.accept = ".dxf";
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file && onDxfImport) {
          onDxfImport(file);
        }
      };
      input.click();
    } else {
      onToolChange(toolId);
    }
  };

  return (
    <div
      className={`absolute left-4 top-4 bg-white shadow-lg rounded-lg border transition-all duration-300 z-50 ${
        collapsed ? "w-12" : "w-64"
      }`}
    >
      <div className="p-2 border-b flex items-center justify-between">
        <h3
          className={`font-semibold text-gray-700 ${
            collapsed ? "hidden" : "block"
          }`}
        >
          Tools
        </h3>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setCollapsed(!collapsed);
          }}
          className="p-1 hover:bg-gray-100 rounded text-gray-500"
        >
          {collapsed ? "▶️" : "◀️"}
        </button>
      </div>

      {!collapsed && (
        <div className="p-2 space-y-3 max-h-[80vh] overflow-y-auto">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category}>
              <h4 className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                {category}
              </h4>
              <div className="grid grid-cols-3 gap-1">
                {categoryTools.map((tool) => {
                  let IconComponent = tool.icon;
                  return (
                    <button
                      key={tool.id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleToolClick(tool.id);
                      }}
                      className={`p-2 rounded-md text-sm border transition-colors cursor-pointer ${
                        activeTool === tool.id
                          ? "bg-blue-100 border-blue-300 text-blue-700"
                          : "bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600"
                      }`}
                      title={tool.name}
                    >
                      <div className="flex justify-center mb-1">
                        <IconComponent size={16} />
                      </div>
                      <div className="text-xs">{tool.name}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
