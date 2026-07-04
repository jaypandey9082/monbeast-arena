import { BeastModelCard } from "@/components/BeastModelCard";
import type { LeaderboardBeast } from "@/lib/arenaTypes";

type BeastMiniCardProps = {
  beast: LeaderboardBeast;
};

export function BeastMiniCard({ beast }: BeastMiniCardProps) {
  return <BeastModelCard beast={beast} variant="leaderboard" />;
}
