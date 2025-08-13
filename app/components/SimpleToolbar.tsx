"use client";

import {
  MousePointer,
  Move,
  Minus,
  Square,
  Circle,
  ArrowUp,
} from "lucide-react";

interface Tool {
  id: string;
  name: string;
  icon: React.ComponentType<any>;
  shortcut: string;
}

const tools: Tool[] = [
  { id: "select", name: "Select", icon: MousePointer, shortcut: "Space" },
  { id: "move", name: "Move", icon: Move, shortcut: "M" },
  { id: "push-pull", name: "Push/Pull", icon: ArrowUp, shortcut: "P" },
  { id: "line", name: "Line", icon: Minus, shortcut: "L" },
  { id: "rectangle", name: "Rectangle", icon: Square, shortcut: "R" },
  { id: "circle", name: "Circle", icon: Circle, shortcut: "C" },
];

interface SimpleToolbarProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
}

export default function SimpleToolbar({
  activeTool,
  onToolChange,
}: SimpleToolbarProps) {
  return (
    <div className="bg-white border-r border-gray-200 p-3 shadow-sm">
      <div className="space-y-2">
        {tools.map((tool) => {
          const IconComponent = tool.icon;
          const isActive = activeTool === tool.id;

          return (
            <div key={tool.id} className="relative group">
              <button
                onClick={() => onToolChange(tool.id)}
                className={`w-12 h-12 rounded-lg flex items-center justify-center transition-all ${
                  isActive
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:shadow-sm"
                }`}
                title={`${tool.name} (${tool.shortcut})`}
              >
                <IconComponent size={20} />
              </button>

              {/* Tooltip */}
              <div className="absolute left-full ml-2 top-1/2 transform -translate-y-1/2 bg-gray-800 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
                {tool.name} ({tool.shortcut})
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
