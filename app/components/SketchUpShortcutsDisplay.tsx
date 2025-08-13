"use client";

import { useState } from "react";
import { getKeyboardShortcuts } from "./SketchUpKeyboardShortcuts";

export default function SketchUpShortcutsDisplay() {
  const [isOpen, setIsOpen] = useState(false);
  const shortcuts = getKeyboardShortcuts();

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 bg-gray-800 text-white p-3 rounded-full shadow-lg hover:bg-gray-700 transition-colors z-50"
        title="Show keyboard shortcuts"
      >
        ⌨️
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white text-black rounded-lg shadow-xl border p-4 max-w-lg z-50 max-h-96 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          🎹 Furniche Keyboard Shortcuts
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="text-gray-500 hover:text-gray-700 text-xl"
        >
          ×
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-700 mb-2">🧭 Navigation</h4>
          <div className="space-y-1 text-sm">
            {shortcuts.navigation.map((shortcut, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {shortcut.key}
                </span>
                <span className="text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">✏️ Drawing</h4>
          <div className="space-y-1 text-sm">
            {shortcuts.drawing.map((shortcut, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {shortcut.key}
                </span>
                <span className="text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">🔧 Modification</h4>
          <div className="space-y-1 text-sm">
            {shortcuts.modification.map((shortcut, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {shortcut.key}
                </span>
                <span className="text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">🛠️ Other Tools</h4>
          <div className="space-y-1 text-sm">
            {shortcuts.other.map((shortcut, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                  {shortcut.key}
                </span>
                <span className="text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-700 mb-2">⚙️ System</h4>
          <div className="space-y-1 text-sm">
            {shortcuts.system.map((shortcut, index) => (
              <div key={index} className="flex justify-between">
                <span className="font-mono bg-gray-100 px-2 py-1 rounded text-xs">
                  {shortcut.key}
                </span>
                <span className="text-gray-600">{shortcut.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
        <p className="text-xs text-blue-700">
          💡 <strong>Tip:</strong> These shortcuts work just like in SketchUp!
          Press a key to instantly switch tools, just like the pros do.
        </p>
      </div>
    </div>
  );
}
