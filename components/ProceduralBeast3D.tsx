"use client";

import { Float, Sparkles } from "@react-three/drei";
import type { ThreeElements } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

type ProceduralBeast3DProps = ThreeElements["group"] & {
  prompt?: string;
  compact?: boolean;
};

const palettes = [
  ["#836EF9", "#B7FF4A", "#29165C"],
  ["#F43F5E", "#FACC15", "#3B0714"],
  ["#22C55E", "#A78BFA", "#052E16"],
  ["#38BDF8", "#F97316", "#082F49"],
  ["#F59E0B", "#F472B6", "#451A03"]
] as const;

export function ProceduralBeast3D({ prompt = "MonBeast Arena", compact = false, ...props }: ProceduralBeast3DProps) {
  const traits = useMemo(() => buildProceduralTraits(prompt), [prompt]);
  const scale = compact ? 0.78 : 1;

  return (
    <group {...props} scale={scale}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.45}>
        <mesh position={[0, 0.05, 0]} castShadow receiveShadow>
          <sphereGeometry args={[1.05, 64, 64]} />
          <meshStandardMaterial
            color={traits.body}
            roughness={0.48}
            metalness={0.18}
            emissive={traits.glow}
            emissiveIntensity={0.08}
          />
        </mesh>

        <mesh position={[-0.82, 0.18, -0.05]} rotation={[0.15, 0.1, 0.75]} castShadow>
          <coneGeometry args={[0.42, 1.15, traits.hornSegments]} />
          <meshStandardMaterial color={traits.accent} roughness={0.36} metalness={0.22} />
        </mesh>
        <mesh position={[0.82, 0.18, -0.05]} rotation={[0.15, -0.1, -0.75]} castShadow>
          <coneGeometry args={[0.42, 1.15, traits.hornSegments]} />
          <meshStandardMaterial color={traits.accent} roughness={0.36} metalness={0.22} />
        </mesh>

        <mesh position={[-0.42, 0.18, 0.92]} scale={[1.25, 0.58, 0.18]}>
          <sphereGeometry args={[0.18, 32, 16]} />
          <meshStandardMaterial color={traits.eye} emissive={traits.eye} emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.42, 0.18, 0.92]} scale={[1.25, 0.58, 0.18]}>
          <sphereGeometry args={[0.18, 32, 16]} />
          <meshStandardMaterial color={traits.eye} emissive={traits.eye} emissiveIntensity={0.6} />
        </mesh>

        <mesh position={[-0.42, 0.18, 1.02]} scale={[0.12, 0.52, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#02030A" />
        </mesh>
        <mesh position={[0.42, 0.18, 1.02]} scale={[0.12, 0.52, 0.08]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#02030A" />
        </mesh>

        <mesh position={[0, -0.43, 0.94]} rotation={[0, 0, Math.PI]} scale={[0.56, 0.2, 0.08]}>
          <torusGeometry args={[0.48, 0.045, 12, 36, Math.PI]} />
          <meshStandardMaterial color={traits.eye} emissive={traits.eye} emissiveIntensity={0.35} />
        </mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.34, 0.015, 12, 96]} />
          <meshStandardMaterial
            color={traits.accent}
            transparent
            opacity={0.45}
            emissive={traits.accent}
            emissiveIntensity={0.25}
          />
        </mesh>
        <mesh rotation={[Math.PI / 2.25, 0.42, 0.2]}>
          <torusGeometry args={[1.5, 0.01, 12, 96]} />
          <meshStandardMaterial
            color={traits.glow}
            transparent
            opacity={0.32}
            emissive={traits.glow}
            emissiveIntensity={0.24}
          />
        </mesh>
      </Float>

      <Sparkles
        count={compact ? 22 : 44}
        scale={compact ? 3.4 : 4.2}
        size={compact ? 1.3 : 1.8}
        speed={0.32}
        color={traits.eye}
      />
    </group>
  );
}

function buildProceduralTraits(prompt: string) {
  const hash = hashPrompt(prompt);
  const palette = palettes[hash % palettes.length];

  return {
    body: palette[0],
    eye: palette[1],
    glow: palette[2],
    accent: palettes[Math.floor(hash / 7) % palettes.length][1],
    hornSegments: 3 + (hash % 5)
  };
}

function hashPrompt(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return Math.abs(hash);
}

THREE.ColorManagement.enabled = true;
