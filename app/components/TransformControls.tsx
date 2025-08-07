"use client";

import { useRef, useEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { TransformControls as DreiTransformControls } from "@react-three/drei";

interface TransformControlsProps {
  object: THREE.Object3D | null;
  mode: "translate" | "rotate" | "scale";
  enabled: boolean;
  onChange?: () => void;
}

export default function TransformControls({
  object,
  mode,
  enabled,
  onChange,
}: TransformControlsProps) {
  const { gl, camera } = useThree();
  const controlsRef = useRef<any>();

  useEffect(() => {
    if (controlsRef.current && object) {
      const controls = controlsRef.current;
      const handleChange = () => {
        if (onChange) onChange();
      };

      controls.addEventListener("change", handleChange);
      return () => {
        controls.removeEventListener("change", handleChange);
      };
    }
  }, [object, onChange]);

  if (!object || !enabled) return null;

  return (
    <DreiTransformControls
      ref={controlsRef}
      object={object}
      mode={mode}
      enabled={enabled}
      size={0.5}
      showX
      showY
      showZ
    />
  );
}
