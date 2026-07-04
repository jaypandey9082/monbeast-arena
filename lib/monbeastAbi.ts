export const monbeastAbi = [
  {
    type: "function",
    name: "mintBeast",
    stateMutability: "payable",
    inputs: [
      { name: "prompt", type: "string" },
      { name: "imageURI", type: "string" }
    ],
    outputs: [{ name: "beastId", type: "uint256" }]
  },
  {
    type: "function",
    name: "getBeast",
    stateMutability: "view",
    inputs: [{ name: "beastId", type: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        components: [
          { name: "prompt", type: "string" },
          { name: "imageURI", type: "string" },
          { name: "atk", type: "uint16" },
          { name: "def", type: "uint16" },
          { name: "hp", type: "uint16" },
          { name: "spd", type: "uint16" },
          { name: "level", type: "uint16" },
          { name: "wins", type: "uint16" },
          { name: "losses", type: "uint16" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "getBeastsOfOwner",
    stateMutability: "view",
    inputs: [{ name: "owner", type: "address" }],
    outputs: [{ name: "", type: "uint256[]" }]
  },
  {
    type: "function",
    name: "totalBeasts",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "function",
    name: "ownerOf",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }]
  },
  {
    type: "function",
    name: "tokenURI",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "string" }]
  },
  {
    type: "function",
    name: "locked",
    stateMutability: "view",
    inputs: [{ name: "beastId", type: "uint256" }],
    outputs: [{ name: "", type: "bool" }]
  },
  {
    type: "function",
    name: "createChallenge",
    stateMutability: "nonpayable",
    inputs: [{ name: "beastId", type: "uint256" }],
    outputs: [{ name: "challengeId", type: "uint256" }]
  },
  {
    type: "function",
    name: "cancelChallenge",
    stateMutability: "nonpayable",
    inputs: [{ name: "challengeId", type: "uint256" }],
    outputs: []
  },
  {
    type: "function",
    name: "acceptChallenge",
    stateMutability: "nonpayable",
    inputs: [
      { name: "challengeId", type: "uint256" },
      { name: "myBeastId", type: "uint256" }
    ],
    outputs: []
  },
  {
    type: "function",
    name: "getOpenChallenges",
    stateMutability: "view",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "tuple[]",
        components: [
          { name: "id", type: "uint256" },
          { name: "beastId", type: "uint256" },
          { name: "challenger", type: "address" }
        ]
      }
    ]
  },
  {
    type: "function",
    name: "challengeCount",
    stateMutability: "view",
    inputs: [],
    outputs: [{ name: "", type: "uint256" }]
  },
  {
    type: "event",
    name: "BeastMinted",
    inputs: [
      { name: "beastId", type: "uint256", indexed: true },
      { name: "owner", type: "address", indexed: true },
      { name: "prompt", type: "string", indexed: false },
      { name: "imageURI", type: "string", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ChallengeCreated",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true },
      { name: "beastId", type: "uint256", indexed: true },
      { name: "challenger", type: "address", indexed: true }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "ChallengeCancelled",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true },
      { name: "beastId", type: "uint256", indexed: true }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BattleResolved",
    inputs: [
      { name: "challengeId", type: "uint256", indexed: true },
      { name: "winnerId", type: "uint256", indexed: true },
      { name: "loserId", type: "uint256", indexed: true },
      { name: "winner", type: "address", indexed: false },
      { name: "loser", type: "address", indexed: false },
      { name: "winnerPower", type: "uint256", indexed: false },
      { name: "loserPower", type: "uint256", indexed: false }
    ],
    anonymous: false
  },
  {
    type: "event",
    name: "BeastLeveled",
    inputs: [
      { name: "beastId", type: "uint256", indexed: true },
      { name: "newLevel", type: "uint16", indexed: false }
    ],
    anonymous: false
  }
] as const;
