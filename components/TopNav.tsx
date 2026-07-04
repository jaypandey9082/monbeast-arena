"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { WalletButton } from "@/components/WalletButton";
import { cn } from "@/lib/format";

export type AppTab = "home" | "create" | "arena" | "leaderboard";

const nav = [
  { href: "/create", label: "Create" },
  { href: "/arena", label: "Arena" },
  { href: "/leaderboard", label: "Leaderboard" }
] as const;

export function TopNav() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#06050a]/82 backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1120px] items-center justify-between gap-3 px-5 py-3">
        <div className="flex min-w-0 items-center gap-6">
          <Link href="/" className="shrink-0 whitespace-nowrap text-lg font-black tracking-tight text-white">
            Mon<span className="text-[var(--monad-purple)]">Beast</span> Arena
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {nav.map((item) => {
              const active = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-semibold transition",
                    active ? "bg-white/10 text-white" : "text-white/48 hover:text-white"
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <WalletButton />
      </div>
    </header>
  );
}
