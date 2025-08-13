"use client";

import { getToolDescription } from "./SketchUpKeyboardShortcuts";

interface SketchUpToolIndicatorProps {
  activeTool: string;
}

export default function SketchUpToolIndicator({
  activeTool,
}: SketchUpToolIndicatorProps) {
  const toolDescription = getToolDescription(activeTool);

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black border border-gray-300 rounded-lg shadow-lg px-4 py-2 z-40">
      <div className="flex items-center space-x-2">
        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700">
          {toolDescription}
        </span>
      </div>
    </div>
  );
}
