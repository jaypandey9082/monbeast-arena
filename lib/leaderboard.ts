import type { LeaderboardBeast } from "@/lib/arenaTypes";

export const LEADERBOARD_READ_LIMIT = 100;

export function sortLeaderboard(beasts: LeaderboardBeast[]) {
  return [...beasts].sort(
    (a, b) =>
      b.wins - a.wins ||
      b.level - a.level ||
      a.losses - b.losses ||
      Number(a.id) - Number(b.id)
  );
}

export function buildLeaderboardIds(totalBeasts?: bigint) {
  if (!totalBeasts || totalBeasts <= BigInt(0)) {
    return [];
  }

  const total = Number(
    totalBeasts > BigInt(LEADERBOARD_READ_LIMIT) ? BigInt(LEADERBOARD_READ_LIMIT) : totalBeasts
  );
  return Array.from({ length: total }, (_, index) => BigInt(index + 1));
}
