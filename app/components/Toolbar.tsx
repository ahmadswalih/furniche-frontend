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
  Merge,
  Scissors,
  SquaresIntersect,
  CornerRightUp,
  Triangle,
  Download,
  Cog,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  category: "draw" | "model" | "modify" | "view" | "file" | "cad" | "boolean";
}

const tools: Tool[] = [
  // Basic tools
  {
    id: "select",
    name: "Select (Space)",
    icon: MousePointer,
    category: "view",
  },
  { id: "move", name: "Move (M)", icon: Move, category: "modify" },
  { id: "rotate", name: "Rotate (Q)", icon: RotateCcw, category: "modify" },
  { id: "scale", name: "Scale (S)", icon: Scale, category: "modify" },

  // Drawing tools
  { id: "line", name: "Line (L)", icon: Minus, category: "draw" },
  { id: "rectangle", name: "Rectangle (R)", icon: Square, category: "draw" },
  { id: "circle", name: "Circle (C)", icon: Circle, category: "draw" },

  // Basic 3D shapes
  { id: "cube", name: "Cube", icon: Box, category: "model" },
  { id: "cylinder", name: "Cylinder", icon: Cylinder, category: "model" },
  { id: "sphere", name: "Sphere", icon: Diameter, category: "model" },

  // Professional CAD shapes (OpenCascade)
  { id: "cad_box", name: "CAD Box", icon: Box, category: "cad" },
  { id: "cad_cylinder", name: "CAD Cylinder", icon: Cylinder, category: "cad" },
  { id: "cad_sphere", name: "CAD Sphere", icon: Diameter, category: "cad" },

  // Boolean operations
  { id: "cad_union", name: "Union", icon: Merge, category: "boolean" },
  {
    id: "cad_difference",
    name: "Difference",
    icon: Scissors,
    category: "boolean",
  },
  {
    id: "cad_intersection",
    name: "Intersection",
    icon: SquaresIntersect,
    category: "boolean",
  },

  // Advanced CAD operations
  { id: "cad_fillet", name: "Fillet", icon: CornerRightUp, category: "cad" },
  { id: "cad_chamfer", name: "Chamfer", icon: Triangle, category: "cad" },

  // File operations
  { id: "extrude", name: "Extrude", icon: ArrowUp, category: "modify" },
  { id: "import-dxf", name: "Import DXF", icon: Upload, category: "file" },
  { id: "export-step", name: "Export STEP", icon: Download, category: "file" },
];

interface ToolbarProps {
  activeTool: string;
  onToolChange: (toolId: string) => void;
  onDxfImport?: (file: File) => void;
  onStepExport?: () => void;
}

export default function Toolbar({
  activeTool,
  onToolChange,
  onDxfImport,
  onStepExport,
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
    } else if (toolId === "export-step") {
      if (onStepExport) {
        onStepExport();
      }
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
                      className={`p-2 rounded text-sm transition-all cursor-pointer shadow-sm ${
                        activeTool === tool.id
                          ? "bg-blue-500 text-white shadow-md scale-105"
                          : "bg-white border border-gray-300 hover:bg-gray-50 hover:shadow text-gray-700"
                      }`}
                      title={tool.name}
                    >
                      <div className="flex justify-center mb-1">
                        <IconComponent size={16} />
                      </div>
                      <div className="text-xs font-medium">
                        {tool.name.split(" (")[0]}
                      </div>
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
