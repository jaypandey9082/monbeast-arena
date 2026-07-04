"use client";

import { Stars } from "@react-three/drei";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { cn } from "@/lib/format";

type StarfieldBackgroundProps = {
  className?: string;
  dense?: boolean;
};

export function StarfieldBackground({ className, dense = false }: StarfieldBackgroundProps) {
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}>
      <Canvas
        camera={{ position: [0, 0, 5], fov: 45 }}
        dpr={[1, 1.5]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach="background" args={["#07050d"]} />
        <RotatingStars dense={dense} />
      </Canvas>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_48%_at_50%_45%,rgba(8,6,16,0.36),transparent_72%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(131,110,249,0.13),transparent_42%)]" />
    </div>
  );
}

function RotatingStars({ dense }: { dense: boolean }) {
  const ref = useRef<Group>(null);

  useFrame((_, delta) => {
    if (!ref.current) {
      return;
    }

    ref.current.rotation.y += delta * 0.018;
    ref.current.rotation.x += delta * 0.006;
  });

  return (
    <group ref={ref}>
      <Stars
        radius={80}
        depth={55}
        count={dense ? 3600 : 2200}
        factor={dense ? 3.5 : 2.8}
        saturation={0}
        fade
        speed={0.5}
      />
    </group>
  );
}
