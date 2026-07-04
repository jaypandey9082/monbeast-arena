import { ArenaPanel } from "@/components/ArenaPanel";
import { CreateBeastPanel } from "@/components/CreateBeastPanel";
import { Hero } from "@/components/Hero";
import { Leaderboard } from "@/components/Leaderboard";
import { TopNav } from "@/components/TopNav";

export function AppShell() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text-primary)]">
      <div className="relative">
        <TopNav />
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <Hero />
          <CreateBeastPanel />
          <ArenaPanel />
          <Leaderboard />
        </div>
      </div>
    </main>
  );
}
