import { generateBeastTraits, type BeastRarity } from "@/lib/beastTraits";

export type BeastStats = {
  atk: number;
  def: number;
  hp: number;
  spd: number;
};

export type MockBeast = BeastStats & {
  id: number;
  prompt: string;
  name: string;
  owner: string;
  level: number;
  wins: number;
  losses: number;
  locked: boolean;
  rarity: BeastRarity;
  imageURI?: string;
};

export type MockChallenge = {
  id: number;
  beast: MockBeast;
  challenger: string;
  rewardLabel: string;
};

const alice = "0xA71CE0000000000000000000000000000000000";
const bob = "0xB0B0000000000000000000000000000000000000";
const charlie = "0xC0DE000000000000000000000000000000000000";
const pune = "0x500NE0000000000000000000000000000000000";
const monad = "0xM0NAD0000000000000000000000000000000000";

export const demoUserAddress = alice;

export const ownedBeasts: MockBeast[] = [
  createBeast({
    id: 1739,
    prompt: "cyberpunk vada pav dragon",
    owner: alice,
    level: 12,
    wins: 9,
    losses: 2,
    locked: false,
    stats: { atk: 32, def: 21, hp: 23, spd: 24 }
  }),
  createBeast({
    id: 2201,
    prompt: "chai-powered tiger monk",
    owner: alice,
    level: 8,
    wins: 6,
    losses: 3,
    locked: false,
    stats: { atk: 26, def: 27, hp: 24, spd: 23 }
  }),
  createBeast({
    id: 6621,
    prompt: "mecha bull running on Monad gas",
    owner: alice,
    level: 5,
    wins: 3,
    losses: 4,
    locked: true,
    stats: { atk: 24, def: 32, hp: 28, spd: 16 }
  })
];

export const openChallenges: MockChallenge[] = [
  {
    id: 91,
    beast: createBeast({
      id: 8841,
      prompt: "void serpent made of purple lightning",
      owner: bob,
      level: 11,
      wins: 8,
      losses: 3,
      locked: true,
      stats: { atk: 29, def: 22, hp: 20, spd: 29 }
    }),
    challenger: bob,
    rewardLabel: "Winner takes NFT"
  },
  {
    id: 92,
    beast: createBeast({
      id: 7712,
      prompt: "frog boxer with diamond gloves",
      owner: charlie,
      level: 7,
      wins: 5,
      losses: 5,
      locked: true,
      stats: { atk: 31, def: 17, hp: 29, spd: 23 }
    }),
    challenger: charlie,
    rewardLabel: "Open challenge"
  },
  {
    id: 93,
    beast: createBeast({
      id: 3310,
      prompt: "Pune traffic demon with four helmets",
      owner: pune,
      level: 10,
      wins: 7,
      losses: 2,
      locked: true,
      stats: { atk: 28, def: 26, hp: 25, spd: 21 }
    }),
    challenger: pune,
    rewardLabel: "Hardcore PvP"
  },
  {
    id: 94,
    beast: createBeast({
      id: 5607,
      prompt: "shadow golem guarding a purple validator",
      owner: monad,
      level: 6,
      wins: 4,
      losses: 4,
      locked: true,
      stats: { atk: 20, def: 34, hp: 31, spd: 15 }
    }),
    challenger: monad,
    rewardLabel: "Arena stake"
  }
];

export const leaderboardBeasts: MockBeast[] = [
  ...ownedBeasts,
  ...openChallenges.map((challenge) => challenge.beast)
]
  .sort((a, b) => b.wins - a.wins || b.level - a.level || a.id - b.id)
  .slice(0, 7);

function createBeast({
  id,
  prompt,
  owner,
  level,
  wins,
  losses,
  locked,
  stats
}: {
  id: number;
  prompt: string;
  owner: string;
  level: number;
  wins: number;
  losses: number;
  locked: boolean;
  stats: BeastStats;
}): MockBeast {
  const traits = generateBeastTraits(prompt, id);

  return {
    id,
    prompt,
    name: traits.name,
    owner,
    level,
    wins,
    losses,
    locked,
    rarity: traits.rarity,
    ...stats
  };
}
