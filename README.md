# MonBeast Arena

One prompt. One beast. Winner takes all.

MonBeast Arena is a 1v1 PvP NFT battle game built for Monad. Players create
prompt-born beasts, mint them as ERC-721 NFTs, open or accept arena challenges,
and resolve battles on-chain. The winner permanently receives the loser's NFT.

## Submission Status

| Requirement | Status |
| --- | --- |
| Fork starter repo | Done. Built in the `jaypandey9082/monbeast-arena` fork. |
| Proper README | Done. This README explains setup, features, contracts, and status. |
| Deploy on Monad | Not done yet. Deployment is intentionally pending. |
| Deploy during Blitz | Pending deployment during the event timeline. |
| Live web app | Not deployed yet. The app runs locally and is Vercel-ready. |
| Document contracts | Done below. Address table is ready for deployed addresses. |

## What It Does

1. Connect a wallet on Monad Testnet.
2. Enter a creature prompt.
3. Generate a 3D-first beast preview.
4. Mint the beast as an ERC-721 NFT.
5. Get fair on-chain stats for ATK, DEF, HP, and SPD.
6. Create or accept a 1v1 arena challenge.
7. Resolve the battle on-chain.
8. Winner takes the loser's NFT.
9. Leaderboard ranks beasts by wins and level.

## Why It Is Original

MonBeast Arena is inspired by prompt-to-creature battle games, but it uses its own
brand, UI, contract structure, native MON flow, deterministic fallback art, and
winner-takes-loser arena mechanic. It does not copy PromptMon code, branding, UI
text, or repository structure.

## Current Features

- Next.js App Router frontend
- Simple premium dark UI
- Monad Testnet wallet flow with wagmi and viem
- 3D-first creature generation flow
- Optional Claude prompt enhancement
- Optional Tripo 3D model generation
- Procedural 3D fallback when APIs fail or keys are missing
- ERC-721 beast contract
- Native MON mint fee
- On-chain fair stat generation
- Arena challenge creation and cancellation
- Battle resolution on-chain
- Winner permanently receives loser NFT
- Leaderboard derived from contract data
- Foundry tests for the core contract

## Tech Stack

- Next.js
- TypeScript
- Tailwind CSS
- wagmi
- viem
- TanStack Query
- Three.js / React Three Fiber
- Foundry
- Solidity
- OpenZeppelin Contracts
- Monad Testnet

## Smart Contracts

| Contract | Network | Address | Status |
| --- | --- | --- | --- |
| `MonBeastArena` | Monad Testnet | Not deployed yet | Ready for deployment |
| `MonBeastArena` | Monad Mainnet | Not deployed | Not planned for MVP |

Contract source:

```text
contracts/src/MonBeastArena.sol
```

Deployment script:

```text
script/DeployMonBeastArena.s.sol
```

Tests:

```text
test/MonBeastArena.t.sol
```

Important: deployment is intentionally not included yet. After deployment, add
the Monad Testnet contract address to this README and set
`NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS`.

## Contract Mechanics

- ERC-721 name: `MonBeast Arena`
- ERC-721 symbol: `MBEAST`
- Mint fee: `0.02 MON`
- Prompt max length: `240`
- Stats: ATK, DEF, HP, SPD
- Total stats: exactly `100`
- Minimum each stat: `5`
- Challenge locking prevents transferring a beast while it is in an open
  challenge
- Battle winner gains a win and level
- Battle loser gains a loss
- Loser NFT is transferred to the winner

Randomness is hackathon-grade and should be upgraded to VRF or commit-reveal
before production use.

## Local Setup

Install dependencies:

```bash
npm install
```

Copy environment placeholders:

```bash
cp .env.example .env.local
```

Run the frontend:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

If port `3000` is busy, Next.js may choose another local port.

## Environment Variables

Public frontend variables:

```bash
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadvision.com
NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS=
NEXT_PUBLIC_FEATURED_MONBEAST_MODEL_URL=
```

Local-only secrets:

```bash
PRIVATE_KEY=
TRIPO_API_KEY=
TRIPO_API_BASE=https://openapi.tripo3d.ai/v3
TRIPO_MODEL=v3.1-20260211
ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
```

Never commit `.env`, `.env.local`, private keys, seed phrases, or API keys.
The app still works without Claude or Tripo by using procedural 3D fallback.

## Monad Testnet

- Chain ID: `10143`
- Native token: `MON`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadvision.com`
- Faucet: `https://faucet.monad.xyz`

## Run Checks

Frontend lint:

```bash
npm run lint
```

Frontend production build:

```bash
npm run build
```

Foundry build:

```bash
forge build
```

Foundry tests:

```bash
forge test
```

## Deployment Notes

This repository is Vercel-ready, but this README does not claim a live deployment
yet.

Recommended Vercel settings when deployment is allowed:

- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Node.js: `24.x` or the version specified in `package.json`

Recommended contract deployment flow:

1. Use a fresh burner wallet.
2. Add `PRIVATE_KEY` only to local `.env.local`.
3. Deploy `MonBeastArena` to Monad Testnet with Foundry.
4. Add the deployed address to this README.
5. Set `NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS` in the frontend environment.
6. Deploy the web app.

## API Behavior

Claude and Tripo are optional:

- Claude can expand the user prompt into a richer 3D creature prompt.
- Tripo can generate a 3D model from the prompt.
- If either provider fails, the app uses procedural 3D fallback.
- Missing API keys never block local preview mode.

Tripo model URLs may be temporary. A production release should pin generated GLB
assets to IPFS or permanent storage before minting.

## Security

- Do not commit private keys or seed phrases.
- Do not expose `PRIVATE_KEY`, `TRIPO_API_KEY`, or `ANTHROPIC_API_KEY` with
  `NEXT_PUBLIC`.
- Use a fresh burner wallet for hackathon deployment.
- Treat battle randomness as demo-grade until upgraded.
- Review contract code before mainnet use.

## License

Hackathon prototype. Add a formal license before production or reuse.
