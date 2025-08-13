"use client";

import { useEffect } from "react";

interface SketchUpKeyboardShortcutsProps {
  activeTool: string;
  onToolChange: (tool: string) => void;
  onAction?: (action: string) => void;
}

export default function SketchUpKeyboardShortcuts({
  activeTool,
  onToolChange,
  onAction,
}: SketchUpKeyboardShortcutsProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement ||
        event.target instanceof HTMLSelectElement
      ) {
        return;
      }

      const key = event.key.toLowerCase();
      const isCtrl = event.ctrlKey || event.metaKey;
      const isShift = event.shiftKey;
      const isAlt = event.altKey;

      // Prevent default for known shortcuts
      const preventDefaultKeys = [
        "l",
        "r",
        "c",
        "a",
        "m",
        "q",
        "s",
        "p",
        "f",
        "o",
        "z",
        "h",
        "e",
        "b",
        "t",
        "g",
        "v",
        "w",
        "x",
        " ",
      ];

      if (preventDefaultKeys.includes(key) && !isCtrl) {
        event.preventDefault();
      }

      // Handle modifier combinations first
      if (isCtrl) {
        switch (key) {
          case "z":
            event.preventDefault();
            if (isShift) {
              onAction?.("redo");
            } else {
              onAction?.("undo");
            }
            return;
          case "s":
            event.preventDefault();
            onAction?.("save");
            return;
          case "o":
            event.preventDefault();
            onAction?.("open");
            return;
          case "n":
            event.preventDefault();
            onAction?.("new");
            return;
          case "a":
            event.preventDefault();
            onAction?.("selectAll");
            return;
          case "g":
            event.preventDefault();
            onAction?.("makeGroup");
            return;
          case "d":
            event.preventDefault();
            onAction?.("duplicate");
            return;
        }
        return;
      }

      // Handle Alt combinations
      if (isAlt) {
        switch (key) {
          case "h":
            event.preventDefault();
            onAction?.("hideSelected");
            return;
          case "u":
            event.preventDefault();
            onAction?.("unhideAll");
            return;
        }
        return;
      }

      // Handle Shift combinations
      if (isShift) {
        switch (key) {
          case "e":
            event.preventDefault();
            onAction?.("unhideAll");
            return;
          case "d":
            event.preventDefault();
            onAction?.("deleteSelected");
            return;
        }
        return;
      }

      // Basic tool shortcuts (no modifiers)
      switch (key) {
        // Selection and Navigation Tools
        case " ": // Spacebar
          event.preventDefault();
          onToolChange("select");
          break;
        case "o":
          onToolChange("orbit");
          break;
        case "z":
          onToolChange("zoom");
          break;
        case "h":
          onToolChange("pan");
          break;

        // Drawing Tools
        case "l":
          onToolChange("line");
          break;
        case "r":
          onToolChange("rectangle");
          break;
        case "c":
          onToolChange("circle");
          break;
        case "a":
          onToolChange("arc");
          break;

        // Modification Tools
        case "m":
          onToolChange("move");
          break;
        case "q":
          onToolChange("rotate");
          break;
        case "s":
          onToolChange("scale");
          break;
        case "p":
          onToolChange("push-pull");
          break;
        case "f":
          onToolChange("offset");
          break;

        // Other Tools
        case "e":
          onToolChange("eraser");
          break;
        case "b":
          onToolChange("paint-bucket");
          break;
        case "t":
          onToolChange("tape-measure");
          break;
        case "g":
          onToolChange("3d-text");
          break;

        // Camera/View shortcuts
        case "v":
          onAction?.("isometric");
          break;
        case "w":
          onAction?.("wireframe");
          break;
        case "x":
          onAction?.("xray");
          break;

        // Escape key
        case "escape":
          event.preventDefault();
          onToolChange("select");
          onAction?.("cancelOperation");
          break;

        // Enter/Return key
        case "enter":
          event.preventDefault();
          onAction?.("confirmOperation");
          break;

        // Delete key
        case "delete":
        case "backspace":
          event.preventDefault();
          onAction?.("deleteSelected");
          break;

        default:
          break;
      }
    };

    // Add event listener
    document.addEventListener("keydown", handleKeyDown);

    // Cleanup
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [activeTool, onToolChange, onAction]);

  return null; // This component doesn't render anything
}

// Helper function to get tool description for UI
export function getToolDescription(tool: string): string {
  const descriptions: Record<string, string> = {
    select: "Select Tool (Spacebar)",
    orbit: "Orbit Tool (O)",
    zoom: "Zoom Tool (Z)",
    pan: "Pan Tool (H)",
    line: "Line Tool (L)",
    rectangle: "Rectangle Tool (R)",
    circle: "Circle Tool (C)",
    arc: "Arc Tool (A)",
    move: "Move Tool (M)",
    rotate: "Rotate Tool (Q)",
    scale: "Scale Tool (S)",
    "push-pull": "Push/Pull Tool (P)",
    offset: "Offset Tool (F)",
    eraser: "Eraser Tool (E)",
    "paint-bucket": "Paint Bucket Tool (B)",
    "tape-measure": "Tape Measure Tool (T)",
    "3d-text": "3D Text Tool (G)",
  };

  return descriptions[tool] || tool;
}

// Helper function to show keyboard shortcuts in UI
export function getKeyboardShortcuts() {
  return {
    navigation: [
      { key: "Spacebar", action: "Select Tool" },
      { key: "O", action: "Orbit Tool" },
      { key: "Z", action: "Zoom Tool" },
      { key: "H", action: "Pan Tool" },
    ],
    drawing: [
      { key: "L", action: "Line Tool" },
      { key: "R", action: "Rectangle Tool" },
      { key: "C", action: "Circle Tool" },
      { key: "A", action: "Arc Tool" },
    ],
    modification: [
      { key: "M", action: "Move Tool" },
      { key: "Q", action: "Rotate Tool" },
      { key: "S", action: "Scale Tool" },
      { key: "P", action: "Push/Pull Tool" },
      { key: "F", action: "Offset Tool" },
    ],
    other: [
      { key: "E", action: "Eraser Tool" },
      { key: "B", action: "Paint Bucket Tool" },
      { key: "T", action: "Tape Measure Tool" },
      { key: "G", action: "3D Text Tool" },
    ],
    system: [
      { key: "Ctrl+Z", action: "Undo" },
      { key: "Ctrl+Shift+Z", action: "Redo" },
      { key: "Ctrl+S", action: "Save" },
      { key: "Delete", action: "Delete Selected" },
      { key: "Escape", action: "Cancel/Select Tool" },
    ],
  };
}
