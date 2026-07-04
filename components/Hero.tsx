import Link from "next/link";
import { StarfieldBackground } from "@/components/StarfieldBackground";

const ticker = [
  "prompt-born beasts",
  "fair on-chain stats",
  "winner takes NFT",
  "Monad Testnet",
  "3D arena"
];

export function Hero() {
  return (
    <main className="relative flex h-dvh min-h-[620px] flex-col overflow-hidden bg-[#07050d] text-white">
      <StarfieldBackground dense />

      <nav className="relative z-10 flex items-center justify-between px-6 py-4 sm:px-8">
        <Link href="/" className="whitespace-nowrap text-xl font-black tracking-tight">
          Mon<span className="text-[var(--monad-purple)]">Beast</span> Arena
        </Link>
        <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/20 px-3 py-1.5 text-xs font-semibold text-white/58 backdrop-blur">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#22C55E]" />
          Monad Testnet · Live
        </span>
      </nav>

      <section className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 text-center">
        <p className="animate-rise text-xs font-semibold uppercase tracking-[0.34em] text-[#a78bfa]">
          AI · on-chain · 1v1 PvP
        </p>
        <h1 className="animate-rise mt-5 max-w-4xl text-5xl font-black uppercase leading-[0.92] tracking-normal text-white sm:text-6xl lg:text-7xl">
          One prompt.
          <br />
          One beast.
          <br />
          <span className="text-[var(--monad-purple)]">Winner takes all.</span>
        </h1>
        <p className="animate-rise mt-6 max-w-2xl text-base leading-7 text-white/58">
          Create a 3D beast from words, mint it on Monad, and battle for ownership.
          The winner keeps the loser&apos;s NFT.
        </p>
        <div className="animate-rise mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/create"
            className="group inline-flex min-h-12 items-center justify-center rounded-xl bg-[var(--monad-purple)] px-8 text-base font-bold text-white transition hover:bg-[var(--purple-hover)]"
          >
            Create your beast
            <span className="ml-2 inline-block transition group-hover:translate-x-0.5">→</span>
          </Link>
          <Link
            href="/leaderboard"
            className="inline-flex min-h-12 items-center justify-center rounded-xl border border-white/15 bg-black/10 px-8 text-base font-semibold text-white/78 transition hover:bg-white/[0.05] hover:text-white"
          >
            View leaderboard
          </Link>
        </div>
      </section>

      <div className="relative z-10 overflow-hidden border-t border-white/10 bg-black/35 py-3 backdrop-blur">
        <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
          {[...ticker, ...ticker].map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="flex items-center gap-8 text-sm font-semibold uppercase tracking-[0.22em] text-white/42"
            >
              {item}
              <span className="text-[var(--monad-purple)]">✦</span>
            </span>
          ))}
        </div>
      </div>
    </main>
  );
}
