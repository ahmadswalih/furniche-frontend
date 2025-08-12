"use client";

import React, { useCallback, useState, useRef, useEffect } from "react";
import * as THREE from "three";

export interface DXFViewerResult {
  id: string;
  name: string;
  viewer: any; // DxfViewer instance
  canvas: HTMLCanvasElement;
  bounds: {
    min: THREE.Vector3;
    max: THREE.Vector3;
    center: THREE.Vector3;
    size: THREE.Vector3;
  };
  metadata: {
    fileName: string;
    importTime: number;
    loadProgress: number;
  };
}

interface ProperDXFImporterProps {
  onImportComplete: (result: DXFViewerResult) => void;
}

export default function ProperDXFImporter({
  onImportComplete,
}: ProperDXFImporterProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [progressText, setProgressText] = useState<string | null>(null);
  const [currentPhase, setCurrentPhase] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canvasContainerRef = useRef<HTMLDivElement>(null);
  const dxfViewerRef = useRef<any>(null);

  const handleProgress = useCallback(
    (phase: string, size: number, totalSize: number | null) => {
      console.log(
        `📐 DXF Loading Progress: ${phase} - ${size}/${totalSize || "?"}`
      );

      if (phase !== currentPhase) {
        switch (phase) {
          case "font":
            setProgressText("Fetching fonts...");
            break;
          case "fetch":
            setProgressText("Fetching DXF file...");
            break;
          case "parse":
            setProgressText("Parsing DXF content...");
            break;
          case "prepare":
            setProgressText("Preparing rendering data...");
            break;
          default:
            setProgressText(`Processing: ${phase}...`);
        }
        setCurrentPhase(phase);
      }

      if (totalSize === null) {
        setProgress(-1); // Indeterminate
      } else {
        setProgress(size / totalSize);
      }
    },
    [currentPhase]
  );

  const loadDXFFile = useCallback(
    async (file: File) => {
      if (!canvasContainerRef.current) {
        console.error("Canvas container not ready");
        return;
      }

      setIsLoading(true);
      setError(null);
      setProgress(null);
      setProgressText(null);

      try {
        console.log("🏗️ Starting DXF import with dxf-viewer:", file.name);

        // Dynamic import to avoid SSR issues
        const { DxfViewer } = await import("dxf-viewer");

        // Create viewer instance with transparent background
        const options = {
          clearColor: new THREE.Color(0x000000), // Black background (will make transparent)
          autoResize: true,
          colorCorrection: true,
          alpha: true, // Enable alpha channel for transparency
          preserveDrawingBuffer: true, // Better for texture capture
          sceneOptions: {
            wireframeMesh: false, // Disable wireframe for cleaner lines
            enableSelection: false, // Disable selection for performance
          },
        };

        console.log("📱 Initializing DXF Viewer with options:", options);

        const dxfViewer = new DxfViewer(canvasContainerRef.current, options);
        dxfViewerRef.current = dxfViewer;

        // Try to set high DPI/pixel ratio for better quality
        try {
          if (dxfViewer.renderer) {
            dxfViewer.renderer.setPixelRatio(
              Math.min(window.devicePixelRatio, 2)
            );
            dxfViewer.renderer.setSize(2048, 2048, false);
            console.log("🎯 Set high resolution rendering for DXF viewer");
          }
        } catch (err) {
          console.warn("Could not set high resolution:", err);
        }

        // Subscribe to events
        dxfViewer.Subscribe("loaded", (event: any) => {
          console.log("✅ DXF loaded successfully:", event);
        });

        dxfViewer.Subscribe("message", (event: any) => {
          console.log("📝 DXF Viewer message:", event);
        });

        dxfViewer.Subscribe("viewChanged", (event: any) => {
          console.log("👁️ View changed:", event);
        });

        // Create blob URL for the file
        const fileUrl = URL.createObjectURL(file);
        console.log("📎 Created blob URL for DXF file:", fileUrl);

        // Load the DXF file
        await dxfViewer.Load({
          url: fileUrl,
          fonts: [], // We can add fonts later if needed
          progressCbk: handleProgress,
        });

        // Clean up blob URL
        URL.revokeObjectURL(fileUrl);

        // Get canvas element
        const canvas = canvasContainerRef.current.querySelector(
          "canvas"
        ) as HTMLCanvasElement;
        if (!canvas) {
          throw new Error("Canvas not found after DXF loading");
        }

        // Calculate bounds (approximate - dxf-viewer doesn't expose this directly)
        const bounds = {
          min: new THREE.Vector3(-10, -10, -10),
          max: new THREE.Vector3(10, 10, 10),
          center: new THREE.Vector3(0, 0, 0),
          size: new THREE.Vector3(20, 20, 20),
        };

        // Create result object
        const result: DXFViewerResult = {
          id: `dxf-viewer-${Date.now()}`,
          name: file.name.replace(/\.[^/.]+$/, ""),
          viewer: dxfViewer,
          canvas,
          bounds,
          metadata: {
            fileName: file.name,
            importTime: Date.now(),
            loadProgress: 1.0,
          },
        };

        console.log("🎉 DXF Import Complete:", result);
        onImportComplete(result);
      } catch (err) {
        console.error("❌ DXF Import Failed:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Unknown error occurred";
        setError(errorMessage);
      } finally {
        setIsLoading(false);
        setProgress(null);
        setProgressText(null);
        setCurrentPhase(null);
      }
    },
    [handleProgress, onImportComplete]
  );

  const handleFileInput = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        loadDXFFile(file);
      }
    },
    [loadDXFFile]
  );

  const loadSampleDXF = useCallback(async () => {
    try {
      const response = await fetch("/sample-floor-plan.dxf");
      if (!response.ok) {
        throw new Error("Failed to load sample DXF");
      }
      const blob = await response.blob();
      const file = new File([blob], "sample-floor-plan.dxf", {
        type: "application/dxf",
      });
      await loadDXFFile(file);
    } catch (err) {
      console.error("Error loading sample DXF:", err);
      setError("Failed to load sample DXF file");
    }
  }, [loadDXFFile]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (dxfViewerRef.current) {
        try {
          dxfViewerRef.current.Destroy();
          dxfViewerRef.current = null;
        } catch (err) {
          console.warn("Error destroying DXF viewer:", err);
        }
      }
    };
  }, []);

  return (
    <div className="space-y-4">
      {/* File Input */}
      <div className="text-center">
        <label className="block">
          <input
            type="file"
            accept=".dxf"
            onChange={handleFileInput}
            className="hidden"
            disabled={isLoading}
          />
          <div
            className={`px-6 py-4 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
              isLoading
                ? "border-blue-300 bg-blue-50 cursor-not-allowed"
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            <div className="text-center">
              <div className="text-2xl mb-2">📐</div>
              <div className="text-lg font-semibold text-gray-700">
                {isLoading ? "Loading DXF..." : "Import DXF Floor Plan"}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Professional DXF viewer with complete floor plan display
              </div>
            </div>
          </div>
        </label>
      </div>

      {/* Progress Indicator */}
      {isLoading && (
        <div className="space-y-2">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                progress === -1 || progress === null
                  ? "bg-blue-600 animate-pulse"
                  : "bg-blue-600"
              }`}
              style={{
                width:
                  progress === -1 || progress === null
                    ? "100%"
                    : `${(progress || 0) * 100}%`,
              }}
            />
          </div>
          {progressText && (
            <div className="text-sm text-center text-gray-600">
              {progressText}
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center space-x-2">
            <span className="text-red-600 text-lg">⚠️</span>
            <div>
              <div className="text-sm font-medium text-red-800">
                Import Failed
              </div>
              <div className="text-xs text-red-700 mt-1">{error}</div>
            </div>
          </div>
        </div>
      )}

      {/* Sample DXF Button */}
      <div className="pt-2 border-t">
        <button
          onClick={loadSampleDXF}
          disabled={isLoading}
          className="w-full px-3 py-2 bg-green-600 text-white rounded text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          🏠 Load Sample Floor Plan
        </button>
      </div>

      {/* Hidden high-resolution canvas container for DXF viewer */}
      <div
        ref={canvasContainerRef}
        className="hidden"
        style={{
          width: "2048px", // High resolution for better quality
          height: "2048px",
          minWidth: "2048px",
          minHeight: "2048px",
        }}
      />
    </div>
  );
}
