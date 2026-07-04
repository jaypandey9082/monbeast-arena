"use client";

export function EmptyCreatureStage() {
  return (
    <div className="relative h-full min-h-[340px] overflow-hidden rounded-none border-0 bg-transparent">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_42%,rgba(131,110,249,0.16),transparent_38%)]" />
      <div className="absolute left-1/2 top-1/2 h-52 w-52 -translate-x-1/2 -translate-y-1/2 rounded-full border border-[rgba(167,139,250,0.18)] shadow-[0_0_90px_rgba(131,110,249,0.18)]" />
      <div className="absolute left-1/2 top-1/2 h-24 w-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[rgba(131,110,249,0.08)] blur-2xl" />

      <div className="absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 animate-[stageOrbit_18s_linear_infinite] rounded-full border border-transparent border-t-[rgba(183,255,74,0.36)]" />
      <div className="absolute left-1/2 top-1/2 h-80 w-80 -translate-x-1/2 -translate-y-1/2 animate-[stageOrbit_26s_linear_infinite_reverse] rounded-full border border-transparent border-r-[rgba(131,110,249,0.42)]" />

      {Array.from({ length: 34 }).map((_, index) => (
        <span
          key={index}
          className="absolute h-1 w-1 rounded-full bg-[#dfffa3] opacity-70 shadow-[0_0_10px_rgba(183,255,74,0.7)] animate-[stageTwinkle_2.8s_ease-in-out_infinite]"
          style={{
            left: `${(index * 37) % 100}%`,
            top: `${(index * 53) % 100}%`,
            animationDelay: `${(index % 9) * 0.22}s`,
            transform: `scale(${0.55 + (index % 5) * 0.18})`
          }}
        />
      ))}

      <div className="absolute inset-x-6 top-1/2 z-10 -translate-y-1/2 text-center">
        <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--monad-purple)]">
          Empty arena
        </p>
        <h1 className="mx-auto mt-3 max-w-3xl text-3xl font-black tracking-tight text-white md:text-4xl">
          Generate a beast to reveal it here.
        </h1>
        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/48">
          The stage stays clean until your prompt becomes a 3D fighter.
        </p>
      </div>
    </div>
  );
}
