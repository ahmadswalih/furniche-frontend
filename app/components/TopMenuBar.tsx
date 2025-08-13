"use client";

import { useState } from "react";
import { Menu, FileIcon, Upload } from "lucide-react";

interface TopMenuBarProps {
  onDXFImport: () => void;
  onLayerManagerToggle: () => void;
}

export default function TopMenuBar({ onDXFImport, onLayerManagerToggle }: TopMenuBarProps) {
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [showHamburgerMenu, setShowHamburgerMenu] = useState(false);

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center justify-between shadow-sm">
      {/* Left side - File menu */}
      <div className="relative">
        <button
          onClick={() => setShowFileMenu(!showFileMenu)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <FileIcon size={16} />
          <span className="text-sm font-medium">File</span>
        </button>

        {showFileMenu && (
          <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
            <div className="py-1">
              <button
                onClick={() => {
                  onDXFImport();
                  setShowFileMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                <Upload size={14} />
                <span>Import DXF Floor Plan</span>
              </button>
              <hr className="my-1" />
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                New Project
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Save Project
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Export Model
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Center - Logo/Title */}
      <div className="flex-1 text-center">
        <h1 className="text-lg font-semibold text-gray-800">Furniche 3D</h1>
      </div>

      {/* Right side - Hamburger menu */}
      <div className="relative">
        <button
          onClick={() => setShowHamburgerMenu(!showHamburgerMenu)}
          className="flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
        >
          <Menu size={16} />
        </button>

        {showHamburgerMenu && (
          <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-48">
            <div className="py-1">
              <button
                onClick={() => {
                  onLayerManagerToggle();
                  setShowHamburgerMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center space-x-2"
              >
                📚 Layer Manager
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                View Settings
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Preferences
              </button>
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                Help & Support
              </button>
              <hr className="my-1" />
              <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                About
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close menus */}
      {(showFileMenu || showHamburgerMenu) && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => {
            setShowFileMenu(false);
            setShowHamburgerMenu(false);
          }}
        />
      )}
    </div>
  );
}
