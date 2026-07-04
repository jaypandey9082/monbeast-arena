# MonBeast Arena

## One-line pitch
One prompt. One beast. Winner takes all.

## What it is
A Monad PvP game where users create prompt-generated beasts, mint them as NFTs, and battle on-chain. Winner takes the loser's NFT.

## Why it is not a PromptMon clone
This is a fresh project with original branding, native MON flow, deterministic beast art fallback, and a new premium UI.

## Planned MVP
- Create beast from prompt
- Mint ERC-721 NFT
- Generate fair stats
- Create challenge
- Accept battle
- Winner takes loser NFT
- Leaderboard

## Tech stack
- Next.js
- TypeScript
- Tailwind
- wagmi
- viem
- Foundry
- Solidity
- OpenZeppelin
- Monad Testnet

## Development sections
1. Foundation
2. Smart contract core - added
3. Contract tests
4. Deterministic beast art
5. Premium UI
6. Wallet + transactions
7. Mint flow
8. Arena flow
9. Battle result + leaderboard
10. Deploy + submission polish

## Local setup
Install dependencies:

```bash
npm install
```

Run the frontend:

```bash
npm run dev
```

Build the frontend:

```bash
npm run build
```

Build contracts:

```bash
forge build
```

Copy environment placeholders:

```bash
cp .env.example .env.local
```

## Section 2 status
- Smart contract core added in `contracts/src/MonBeastArena.sol`.
- Beast minting uses a native MON mint fee.
- Beasts are ERC-721 NFTs.
- Arena challenges lock the challenged beast while open.
- Battle resolution transfers the loser's NFT to the winner.
- Randomness is hackathon-grade and should be upgraded to VRF or commit-reveal before production use.

## Contract tests
Run the Foundry test suite:

```bash
forge test
```

The tests cover mint fees, stat invariants, ERC-721 ownership, challenge creation and cancellation, locked beast transfer protection, winner-takes-loser battle resolution, fee withdrawal, owner-only treasury updates, and open challenge filtering.

Battle randomness is hackathon-grade and should be upgraded to VRF or commit-reveal before production use.

## 3D Model Generation
Tripo-generated 3D beasts are the primary user-facing generation flow. A successful Tripo task stores the GLB/model URL in NFT metadata as `animation_url`, with an optional rendered preview image in `image`.

If Tripo is missing, slow, or fails, the UI falls back to deterministic procedural 3D generated from the prompt. SVG output is kept only as metadata `image` fallback so marketplaces still have a static image.

Tripo URLs may be temporary. For production, upload generated GLB assets to IPFS, Pinata, or another permanent storage provider before minting.

Contract-generated stats are official. Frontend visual traits are metadata only, and battle outcomes are determined on-chain.

## Section 5 UI shell
- Premium one-page UI shell added.
- Tabs: Home, Create, Arena, Leaderboard.
- Create tab uses deterministic beast previews.
- Arena tab uses mock owned beasts, mock open challenges, and a fight preview flow.
- Battle result modal shows winner-takes-loser outcome copy.
- Real wallet and contract transactions come next.

## Wallet + Network Setup
- Use MetaMask or another injected wallet.
- Add Monad Testnet.
- Chain ID: `10143`
- Symbol: `MON`
- RPC: `https://testnet-rpc.monad.xyz`
- Explorer: `https://testnet.monadvision.com`
- Faucet: `https://faucet.monad.xyz`
- Contract address must be configured after deployment with `NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS`.

## Environment Variables
```bash
NEXT_PUBLIC_MONAD_RPC_URL=https://testnet-rpc.monad.xyz
NEXT_PUBLIC_MONAD_EXPLORER_URL=https://testnet.monadvision.com
NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS=

PRIVATE_KEY=

TRIPO_API_KEY=
TRIPO_API_BASE=https://openapi.tripo3d.ai/v3
TRIPO_MODEL=v3.1-20260211
NEXT_PUBLIC_FEATURED_MONBEAST_MODEL_URL=

ANTHROPIC_API_KEY=
ANTHROPIC_MODEL=claude-sonnet-5
```

Add real values only in `.env.local`. Never expose secret keys with `NEXT_PUBLIC`.

## API Readiness
The MVP remains usable without external APIs because deterministic procedural 3D fallback is mint-ready. When Tripo is configured, generated model URLs become `animation_url` metadata.

Optional routes are scaffolded for later:
- `POST /api/beast/lore` for optional Claude name, lore, battle cry, victory line, and Tripo prompt.
- `POST /api/beast/three-d` for optional Tripo 3D task creation.
- `GET/POST /api/beast/three-d/status` for optional Tripo task polling.

If no API key is configured, the app still works fully using procedural 3D beasts. Claude lore generation is optional. API keys must stay server-side only in `.env.local`.

## Vercel Deployment
Vercel can deploy this as a standard Next.js app.

Recommended project settings:
- Framework Preset: `Next.js`
- Install Command: `npm ci`
- Build Command: `npm run build`
- Output Directory: leave blank
- Node.js: `20.x` or newer

Required environment variables:
- `NEXT_PUBLIC_MONAD_RPC_URL`
- `NEXT_PUBLIC_MONAD_EXPLORER_URL`
- `NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS`

Optional server-side environment variables:
- `TRIPO_API_KEY`
- `TRIPO_API_BASE`
- `TRIPO_MODEL`
- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL`

Do not add `PRIVATE_KEY` to Vercel unless you are intentionally running deployment scripts there. Contract deployment should happen locally, then the deployed address should be added to Vercel as `NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS`.

## Section 6 Status
- Wallet connect added.
- Monad Testnet detection added.
- Switch-network UX added.
- MON balance display added.
- Contract config status added.
- Reusable transaction chips and transaction status panels added.
- Real mint and battle transactions come next.

## Section 7 Status - Mint Flow
- 3D-first prompt metadata is generated locally as a `data:application/json` tokenURI.
- Tripo model URLs are stored as `animation_url` when available.
- Procedural 3D fallback stays available when Tripo is not configured.
- Create tab calls the real `mintBeast(prompt, tokenURI)` contract function.
- Minting uses the native `0.02 MON` fee.
- MetaMask/injected wallet must be connected to Monad Testnet.
- Owned beasts are fetched with `getBeastsOfOwner` and `getBeast`.
- Mint transaction hash and explorer links are shown in the transaction panel.
- No external AI API, Tripo, IPFS, or Pinata is required for fallback mode.

## Mint Flow Usage
1. Deploy the contract or set `NEXT_PUBLIC_MONBEAST_CONTRACT_ADDRESS`.
2. Connect MetaMask or another injected wallet.
3. Switch to Monad Testnet.
4. Type a beast prompt.
5. Generate 3D Beast, or choose procedural fallback.
6. Mint Beast.
7. View minted beast in My Beasts.

If the contract address is missing, the UI runs in preview-only mode. Stats shown after mint are official on-chain stats. Preview traits are visual only.

## Section 8 Status - Arena Challenge Flow
- Arena reads owned beasts with `getBeastsOfOwner`.
- Arena reads live open challenges with `getOpenChallenges`.
- Challenge cards fetch rival beast data, owner, and locked status.
- Owned beasts can call `createChallenge`.
- User-created open challenges can call `cancelChallenge`.
- Selected owned beasts can call `acceptChallenge`.
- Battle receipt parsing reads `BattleResolved` when available.
- Winner-takes-loser NFT transfer is shown in the battle result modal.
- Same-wallet demo mode is supported as long as two different token IDs fight.
- Arena transaction hashes link to the configured explorer.

## Arena Demo Steps
1. Mint two beasts.
2. Go to Arena.
3. Create a challenge with Beast #1.
4. Select Beast #2 as fighter.
5. Select Beast #1 challenge as rival.
6. Accept & Fight.
7. Confirm transaction.
8. See winner/loser result.
9. Check ownership updated.

Battles are hardcore PvP. On testnet, the loser NFT transfers to the winner.

## Section 9 Status - Battle Polish + Leaderboard
- Battle result modal now shows a premium winner/loser reveal.
- Transfer proof shows tx hash, contract, loser NFT ID, winner address, and explorer links.
- Power comparison and battle replay explain the on-chain result without fake claims.
- Leaderboard is derived from on-chain beast state: wins, level, losses, ownerOf, and totalBeasts.
- Recent battle feed tracks battles completed in the current session.
- Battle event parsing uses `BattleResolved` and falls back to inferred/confirmed state if parsing is unavailable.
- Arena and leaderboard clearly separate real contract mode from preview mode.

## Winner-Takes-Loser Demo
1. Mint Beast A.
2. Mint Beast B.
3. Create challenge with Beast A.
4. Accept with Beast B.
5. Confirm battle tx.
6. See Battle Result modal.
7. See loser NFT transferred.
8. See leaderboard update.

Randomness is hackathon-grade. Production version should use VRF or commit-reveal.

## Security
Never commit private keys or seed phrases.
