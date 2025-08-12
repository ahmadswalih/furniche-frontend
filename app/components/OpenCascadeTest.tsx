"use client";

import { useState, useEffect } from "react";
import openCascadeService from "../services/OpenCascadeService";

export default function OpenCascadeTest() {
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading"
  );
  const [message, setMessage] = useState("Initializing OpenCascade.js...");

  useEffect(() => {
    const testOpenCascade = async () => {
      try {
        setStatus("loading");
        setMessage("🔄 Loading OpenCascade.js WebAssembly module...");

        await openCascadeService.initialize();

        setStatus("ready");
        setMessage(
          "✅ OpenCascade.js is ready! Professional CAD features are available."
        );

        // Test creating a simple box
        try {
          const testBox = openCascadeService.createBox(1, 1, 1);
          console.log("🎯 Test CAD box created successfully:", testBox.id);
          setMessage(
            "✅ OpenCascade.js is fully functional! CAD operations working perfectly."
          );
        } catch (error) {
          console.warn(
            "⚠️ OpenCascade loaded but CAD operations have issues:",
            error
          );
          setMessage("⚠️ OpenCascade loaded but CAD operations need attention");
        }
      } catch (error) {
        setStatus("error");
        setMessage(
          `❌ OpenCascade initialization failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
        console.error("OpenCascade test failed:", error);
      }
    };

    testOpenCascade();
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "loading":
        return "bg-blue-50 border-blue-200 text-blue-700";
      case "ready":
        return "bg-green-50 border-green-200 text-green-700";
      case "error":
        return "bg-red-50 border-red-200 text-red-700";
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case "loading":
        return "🔄";
      case "ready":
        return "✅";
      case "error":
        return "❌";
    }
  };

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg border-2 max-w-md z-50 ${getStatusColor()}`}
    >
      <div className="flex items-start space-x-2">
        <span className="text-lg">{getStatusIcon()}</span>
        <div>
          <h4 className="font-semibold text-sm">OpenCascade.js Status</h4>
          <p className="text-xs mt-1">{message}</p>
          {status === "ready" && (
            <div className="mt-2 text-xs">
              <p>🏗️ Professional CAD tools are now available in the toolbar!</p>
              <p>🔧 Try: CAD Box, Boolean Operations, Fillet, Export STEP</p>
            </div>
          )}
          {status === "error" && (
            <div className="mt-2 text-xs">
              <p>
                💡 Try refreshing the page or check browser console for details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
