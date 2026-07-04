"use client";

import { Environment, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Component, Suspense, useEffect, useState, type ReactNode } from "react";
import { Box3, Vector3 } from "three";
import { ProceduralBeast3D } from "@/components/ProceduralBeast3D";
import { cn } from "@/lib/format";

type ModelViewer3DProps = {
  modelUrl?: string;
  posterUrl?: string;
  prompt?: string;
  className?: string;
  autoRotate?: boolean;
  compact?: boolean;
  preferPoster?: boolean;
};

export function ModelViewer3D({
  modelUrl,
  posterUrl,
  prompt,
  className,
  autoRotate = true,
  compact = false,
  preferPoster = false
}: ModelViewer3DProps) {
  if (posterUrl && (!modelUrl || preferPoster)) {
    return (
      <FastPosterPreview
        posterUrl={posterUrl}
        prompt={prompt}
        className={className}
        compact={compact}
      />
    );
  }

  const fallback = <ModelFallback posterUrl={posterUrl} prompt={prompt} compact={compact} />;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(131,110,249,0.22),rgba(5,5,14,0.92)_54%)]",
        compact ? "aspect-square" : "aspect-[4/3] min-h-[260px]",
        className
      )}
    >
      <Canvas
        shadows
        camera={{ position: compact ? [0, 0.5, 4.2] : [0, 0.65, 4.8], fov: compact ? 38 : 34 }}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.7} />
        <directionalLight position={[3, 4, 5]} intensity={2.2} castShadow />
        <pointLight position={[-3, 2.5, 2]} intensity={2.2} color="#836EF9" />
        <pointLight position={[2.4, -1.4, 2.8]} intensity={1.6} color="#B7FF4A" />

        <Suspense fallback={fallback}>
          <ModelErrorBoundary fallback={fallback}>
            {modelUrl ? (
              <LoadedModel url={modelUrl} compact={compact} />
            ) : (
              fallback
            )}
          </ModelErrorBoundary>
        </Suspense>

        <Environment preset="city" />
        <OrbitControls
          enablePan={false}
          enableZoom={!compact}
          minDistance={2.8}
          maxDistance={7}
          autoRotate={autoRotate}
          autoRotateSpeed={0.75}
        />
      </Canvas>

      <div className="pointer-events-none absolute inset-x-4 bottom-4 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
    </div>
  );
}

function FastPosterPreview({
  posterUrl,
  prompt,
  className,
  compact
}: {
  posterUrl: string;
  prompt?: string;
  className?: string;
  compact: boolean;
}) {
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);
    const image = new globalThis.Image();
    image.onload = () => setFailed(false);
    image.onerror = () => setFailed(true);
    image.src = posterUrl;

    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [posterUrl]);

  if (failed) {
    return (
      <div
        className={cn(
          "relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(131,110,249,0.22),rgba(5,5,14,0.92)_54%)]",
          compact ? "aspect-square" : "aspect-[4/3] min-h-[260px]",
          className
        )}
      >
        <Canvas
          shadows={false}
          dpr={[1, 1.35]}
          camera={{ position: compact ? [0, 0.5, 4.2] : [0, 0.65, 4.8], fov: compact ? 38 : 34 }}
          gl={{ antialias: false, alpha: true, powerPreference: "low-power" }}
        >
          <ambientLight intensity={0.85} />
          <directionalLight position={[3, 4, 5]} intensity={1.7} />
          <pointLight position={[-3, 2.5, 2]} intensity={1.4} color="#836EF9" />
          <ProceduralBeast3D prompt={prompt} compact={compact} />
        </Canvas>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/10 bg-[radial-gradient(circle_at_50%_18%,rgba(131,110,249,0.22),rgba(5,5,14,0.94)_56%)]",
        compact ? "aspect-square" : "aspect-[4/3] min-h-[260px]",
        className
      )}
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url("${posterUrl}")` }}
        aria-label="Generated 3D beast preview"
      />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-[#0c0716] to-transparent" />
    </div>
  );
}

function ModelFallback({
  posterUrl,
  prompt,
  compact
}: {
  posterUrl?: string;
  prompt?: string;
  compact: boolean;
}) {
  if (posterUrl) {
    return (
      <mesh>
        <planeGeometry args={compact ? [2.1, 2.1] : [3.2, 2.4]} />
        <meshBasicMaterial transparent opacity={0} />
        <HtmlPoster posterUrl={posterUrl} compact={compact} />
      </mesh>
    );
  }

  return <ProceduralBeast3D prompt={prompt} compact={compact} />;
}

function HtmlPoster({ posterUrl, compact }: { posterUrl: string; compact: boolean }) {
  return (
    <Html center transform distanceFactor={compact ? 3.4 : 3.8}>
      <div
        className={cn(
          "rounded-2xl border border-white/10 bg-cover bg-center shadow-[0_24px_90px_rgba(0,0,0,0.34)]",
          compact ? "h-48 w-48" : "h-72 w-96"
        )}
        style={{ backgroundImage: `url("${posterUrl}")` }}
        aria-label="Generated beast preview"
      />
    </Html>
  );
}

function LoadedModel({ url, compact }: { url: string; compact: boolean }) {
  const gltf = useGLTF(url);
  const scene = gltf.scene.clone(true);
  const box = new Box3().setFromObject(scene);
  const size = new Vector3();
  const center = new Vector3();
  box.getSize(size);
  box.getCenter(center);
  const maxAxis = Math.max(size.x, size.y, size.z) || 1;
  const scale = (compact ? 1.8 : 2.35) / maxAxis;

  scene.position.sub(center);

  return <primitive object={scene} scale={scale} position={[0, compact ? -0.15 : -0.05, 0]} />;
}

class ModelErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}
