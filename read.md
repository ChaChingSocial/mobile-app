# ChaChing Social | Solana Mobile Hackathon Submission
Branch: `main-sol`

## Quick Links
- Android APK (recommended for judges): ``
- Canva slides: `https://www.canva.com/design/DAHDd5WWO0U/WCSuJgJ-4dG2L5Wcd86Ceg/view?utm_content=DAHDd5WWO0U&utm_campaign=designshare&utm_medium=link2&utm_source=uniquelinks&utlId=h4aea3f9c27`
- Demo video: ``
- GitHub repository: `https://github.com/ChaChingSocial/mobile-app/tree/main-sol`

## Best Way to Evaluate This Project
For the easiest and best testing experience, please use the signed APK link above and install it directly on an Android device.  
This is the preferred path because it reflects app behavior closest to production usage and does not require local setup.

## Project Overview
ChaChing Social is a mobile-first social app built on Solana.  
It combines social communication, wallet identity, NFT visibility, and onchain value exchange in one product.

## The Value Dilemma
Social platforms generate wealth, but users receive none of it.  
Most apps treat users as the product. ChaChing Social is built so users can own their interactions and the value created through engagement.

## Solution
Integrate Solana wallets into social communication so users can:
- connect wallet identity inside the app
- display NFTs directly on profile
- use paid messaging to reduce spam and reward attention
- support communities with SOL and USDC contributions

## What Is Implemented in This Repository
### 1) Wallet Connection
- Mobile wallet support for Phantom, Backpack, and Solflare
- Deep link wallet auth and transaction signing
- Reconnect and session handling for wallet flows

### 2) NFT Profile Display
- NFT collection preview on profile
- Metadata loading with support for common URI formats (IPFS, Arweave, HTTP)
- Display works for connected user and for users with saved wallet address

### 3) Pay-to-Message
- Message pricing can be configured on profile (priced in USDC)
- Sender prepays a message budget before sending priced messages
- Remaining budget decrements as messages are sent
- Replies are free for the sender on the other side

### 4) In-Chat Payment Request Flow
- Payment request card can be sent in chat
- Counterparty can pay directly from connected wallet
- Payment record is attached to the conversation message state

### 5) Community Funding
- Fund community with SOL or USDC
- Devnet and mainnet-beta selection
- Contribution is recorded and surfaced in contributor UI

### 6) Core Social Product Features
- Auth and profile management
- Feed and posts
- Communities and participation
- Follow graph
- In-app chat

## Why Solana
Solana is well suited for mobile Web3 social experiences because it supports:
- fast user interactions
- low transaction costs
- practical micro-payments for social actions
- strong wallet ecosystem for mobile users

## Slide-Aligned Product Narrative
This submission follows the attached deck storyline:
- The Value Dilemma
- Solution: wallet-native social communication
- Secure wallet authentication
- NFT profile display
- Pay-to-Message
- Support the Communities You Love
- Why Solana
- Future Vision: token-gated tribes, creator micro-payments, social governance

## Architecture and Stack
- Mobile app: React Native + Expo + TypeScript
- Navigation: Expo Router
- UI system: NativeWind + Gluestack UI
- Auth and data: Firebase Auth, Firestore, Firebase Storage
- Blockchain: Solana Web3.js
- Wallet connectors: Privy connectors + Phantom cluster connector
- API client: OpenAPI generated TypeScript SDK
- Build pipeline: EAS Build + GitHub Actions workflow for signed APK

## Local Development
### Prerequisites
- Node.js 20+
- npm
- Expo CLI / EAS CLI
- Android Studio if running local emulator

### Install and start
```bash
npm install
npx expo start
```

### Useful scripts
```bash
npm run android
npm run ios
npm run web
npm run lint
npm run test
```

## Judge Testing Paths
### Path A (Preferred): APK Install
1. Download APK from the link in Quick Links.
2. Install on Android device.
3. Launch app and test directly.

### Path B: Run from Source
1. Clone repo.
2. Add env file values.
3. Install dependencies.
4. Run with Expo.

## Demo Checklist for Judges
1. Connect wallet from profile.
2. Open NFTs section and view NFT cards.
3. Enable message pricing and save.
4. Open chat and test payment request flow.
5. Open a community and fund with SOL or USDC.

## Team
- Team name: `ChaChing Social`
- Members: ``
- Roles: ``
- Contact: ``