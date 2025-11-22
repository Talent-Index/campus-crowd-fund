# Avalanche Crowdfunding dApp - Complete Implementation Guide

## 🎯 Project Overview

A complete, production-ready crowdfunding platform for Kenyan campus projects built on Avalanche C-Chain. Features smart contract escrow, milestone-based fund releases, donor voting, and transparent on-chain records.

**Display Currency**: Kenya Shillings (KES)  
**Transaction Currency**: AVAX  
**Blockchain**: Avalanche C-Chain (Fuji Testnet & Mainnet)

---

## 📁 Project Structure

```
avalanche-crowdfunding/
├── contracts/                  # Smart contracts
│   ├── CrowdfundingEscrow.sol # Main escrow contract
│   └── README.md              # Contract documentation
├── backend/                   # REST API server
│   ├── src/
│   │   ├── server.js         # Express server
│   │   ├── routes/           # API routes
│   │   └── services/         # Business logic
│   ├── package.json
│   └── README.md             # API documentation
├── src/                      # React frontend
│   ├── components/           # UI components
│   ├── pages/               # Route pages
│   ├── lib/                 # Utilities
│   └── types/               # TypeScript types
├── hardhat.config.js        # Hardhat configuration
└── README.md # This file
```

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────┐
│                   Frontend (React)                   │
│  • Campaign browsing & creation                      │
│  • Donation interface                                │
│  • Milestone voting dashboard                        │
│  • Real-time KES ↔ AVAX conversion display          │
└─────────────────┬───────────────────────────────────┘
                  │ HTTP/REST
┌─────────────────▼───────────────────────────────────┐
│              Backend API (Node/Express)              │
│  • Price oracle integration                          │
│  • Input validation                                  │
│  • Contract interaction abstraction                  │
│  • Event listening & indexing                        │
└─────────────────┬───────────────────────────────────┘
                  │ ethers.js
┌─────────────────▼───────────────────────────────────┐
│          Avalanche C-Chain (EVM Compatible)          │
│                                                       │
│  ┌─────────────────────────────────────────────┐   │
│  │      CrowdfundingEscrow Smart Contract       │   │
│  │  • Campaign creation & management             │   │
│  │  • Escrow holding & milestone releases        │   │
│  │  • Donor voting mechanism                     │   │
│  │  • Automatic refunds                          │   │
│  └─────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
                  │
┌─────────────────▼───────────────────────────────────┐
│              External Oracles & APIs                 │
│  • Chainlink AVAX/USD price feed                     │
│  • exchangerate.host USD/KES conversion              │
└───────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start Guide

### Prerequisites

- **Node.js** 18+ and npm
- **MetaMask** wallet configured for Avalanche
- **Fuji testnet AVAX** (get from [Avalanche Faucet](https://faucet.avax.network/))

### 1. Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd avalanche-crowdfunding

# Install dependencies
npm install

# Install backend dependencies
cd backend
npm install
cd ..
```

### 2. Configure Environment

Create `backend/.env`:

```bash
# Avalanche RPC
AVALANCHE_RPC_URL=https://api.avax-test.network/ext/bc/C/rpc
NETWORK=fuji

# Contract (deploy first, then add address)
CONTRACT_ADDRESS=

# Wallet for contract interaction
PRIVATE_KEY=your_private_key_here

# Price API (optional - has fallback)
EXCHANGE_RATE_API_KEY=

# Fallback conversion
FALLBACK_KES_PER_AVAX=146500

# Server
PORT=3001
NODE_ENV=development
```

### 3. Deploy Smart Contract

```bash
# Compile contracts
npx hardhat compile

# Run tests
npx hardhat test

# Deploy to Fuji testnet
npx hardhat run scripts/deploy.js --network fuji

# Copy the deployed contract address to backend/.env
```

### 4. Start Backend API

```bash
cd backend
npm run dev
# API runs on http://localhost:3001
```

### 5. Start Frontend

```bash
# In project root
npm run dev
# Frontend runs on http://localhost:8080
```

---

## 📝 Smart Contract Specification

### Contract: `CrowdfundingEscrow.sol`

**Core Functions:**

```solidity
// Campaign Management
function createCampaign(
    string memory _title,
    string memory _description,
    uint256 _goalKES,
    uint256 _goalAVAX,
    uint256 _conversionRate,
    uint256 _deadline,
    string[] memory _milestoneDescriptions,
    uint256[] memory _milestoneAmountsKES,
    uint256[] memory _milestoneAmountsAVAX
) external returns (uint256 campaignId)

// Donations
function donate(uint256 _campaignId) external payable

// Milestone Management
function proposeMilestoneRelease(
    uint256 _campaignId,
    uint256 _milestoneIndex,
    string memory _evidenceURI
) external

function voteOnMilestone(
    uint256 _campaignId,
    uint256 _milestoneIndex,
    bool _approve
) external

function finalizeMilestone(
    uint256 _campaignId,
    uint256 _milestoneIndex
) external

// Refunds
function requestRefund(uint256 _campaignId) external
```

**Key Parameters:**

- **Voting Threshold**: 50% approval required
- **Quorum**: 30% of donors must vote
- **Refund Trigger**: Goal not reached by deadline

**Events Emitted:**

- `CampaignCreated`
- `DonationReceived`
- `MilestoneProposed`
- `VoteCast`
- `MilestoneFinalized`
- `RefundIssued`

---

## 🔌 REST API Endpoints

### Base URL: `http://localhost:3001/api`

#### 1. Get AVAX↔KES Price

```bash
GET /price/avax-kes

# Response
{
  "KES_per_AVAX": 146500,
  "AVAX_per_KES": 0.00000683,
  "timestamp": 1703001234,
  "sources": {
    "AVAX_USD": "chainlink",
    "USD_KES": "exchangerate.host"
  }
}
```

#### 2. Create Campaign

```bash
POST /campaigns
Content-Type: application/json

{
  "creator": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
  "title": "Robotics Club Equipment",
  "description": "Purchase parts for competition",
  "goalKES": 500000,
  "deadline": 1735689600,
  "milestones": [
    {"description": "Buy parts", "amountKES": 300000},
    {"description": "Travel costs", "amountKES": 200000}
  ]
}

# Response
{
  "success": true,
  "data": {
    "campaignId": 0,
    "transactionHash": "0xabc123...",
    "goalAVAX": "3.412969283276"
  }
}
```

#### 3. List Campaigns

```bash
GET /campaigns?page=1&limit=10
```

#### 4. Get Campaign Details

```bash
GET /campaigns/:id
```

#### 5. Donate

```bash
POST /campaigns/:id/donate

{
  "donor": "0x123...",
  "amountKES": 50000
}
```

#### 6. Propose Milestone

```bash
POST /campaigns/:id/milestones/:milestoneIndex/propose

{
  "creator": "0x742d35...",
  "evidenceURI": "ipfs://QmExample123"
}
```

#### 7. Vote on Milestone

```bash
POST /campaigns/:id/milestones/:milestoneIndex/vote

{
  "voter": "0x123...",
  "approve": true
}
```

#### 8. Finalize Milestone

```bash
POST /campaigns/:id/milestones/:milestoneIndex/finalize

{
  "caller": "0x742d35..."
}
```

**See `backend/README.md` for complete API documentation with curl examples.**

---

## 💱 AVAX ↔ KES Conversion Flow

### Design Philosophy

- **Display in KES**: All amounts shown to users in Kenya Shillings
- **Transact in AVAX**: Blockchain operations use native AVAX
- **Rate Locking**: Conversion rate locked at campaign creation

### Conversion Pipeline

```
1. User Input (KES)
   └──> 500,000 KES goal

2. Price Oracle Query
   ├──> Chainlink: AVAX/USD = $35.50
   └──> ExchangeRate API: USD/KES = 4126.76

3. Calculation
   └──> KES_per_AVAX = 35.50 × 4126.76 = 146,500

4. Goal Conversion
   └──> goalAVAX = 500,000 ÷ 146,500 = 3.413 AVAX

5. Store in Contract
   ├──> goalKES: 500000 (for display)
   ├──> goalAVAX: 3413000000000000000 wei
   └──> conversionRate: 146500 (locked)
```

### Implementation

**Backend Service (`backend/src/services/priceService.js`):**

```javascript
import { ethers } from "ethers";
import axios from "axios";

const CHAINLINK_AVAX_USD = "0x0*****"; // Fuji

export async function getAVAXtoKESRate() {
  // 1. Get AVAX/USD from Chainlink
  const avaxUsd = await getChainlinkPrice();

  // 2. Get USD/KES from external API
  const usdKes = await getUSDtoKES();

  // 3. Calculate KES per AVAX
  const kesPerAvax = avaxUsd * usdKes;

  return {
    KES_per_AVAX: kesPerAvax,
    AVAX_per_KES: 1 / kesPerAvax,
    timestamp: Date.now() / 1000,
  };
}
```

**Fallback Strategy:**

- If Chainlink unavailable: use hardcoded AVAX/USD
- If exchange API fails: use `FALLBACK_KES_PER_AVAX` from .env
- Rate stored in contract at creation for transparency

---

## 🧪 Testing

### Unit Tests

```bash
# Run all contract tests
npx hardhat test

# Specific test
npx hardhat test test/CrowdfundingEscrow.test.js

# With gas reporting
REPORT_GAS=true npx hardhat test
```

### Integration Test Scenario

The following script demonstrates end-to-end flow:

```bash
npx hardhat run scripts/integration-test.js --network fuji
```

**Test Flow:**

1. Deploy contract
2. Create campaign (500,000 KES, 2 milestones)
3. Three donors donate (totaling >= goal)
4. Creator proposes Milestone 0 with evidence
5. Donors vote (>50% approval)
6. Finalize milestone → funds released
7. Verify balances and events

### Manual Testing via Frontend

1. Visit `http://localhost:8080`
2. Click "Start a Campaign"
3. Fill form with test data
4. Submit (demo mode - simulated wallet)
5. View campaign details
6. Make test donation
7. Check milestone voting interface

---

## 🔐 Security Features

### Smart Contract

- ✅ **ReentrancyGuard**: Prevents reentrancy attacks on withdrawals
- ✅ **Access Control**: onlyCreator, isDonor modifiers
- ✅ **Input Validation**: All parameters checked
- ✅ **SafeMath**: Solidity 0.8+ overflow protection
- ✅ **Rate Locking**: Conversion rate stored at creation (prevents oracle manipulation)

### Backend API

- ✅ **Input Validation**: Zod schemas for all endpoints
- ✅ **CORS Configuration**: Restrict origins in production
- ✅ **Rate Limiting**: Implement in production (express-rate-limit)
- ✅ **Environment Variables**: No secrets in code

### Frontend

- ✅ **XSS Protection**: React escapes by default
- ✅ **HTTPS Only**: Production deployment
- ✅ **MetaMask Integration**: User controls private keys
- ✅ **Transaction Confirmation**: User approval required

### Recommended Production Enhancements

1. **Multi-sig Admin**: Use Gnosis Safe for contract owner functions
2. **Pausable Pattern**: Emergency stop mechanism
3. **Upgradeability**: UUPS proxy pattern
4. **Time Locks**: 48hr delay on sensitive operations
5. **Audit**: Professional smart contract audit before mainnet

---

## 🌐 Avalanche Network Configuration

### Fuji Testnet

```javascript
// MetaMask/Wallet Configuration
Network Name: Avalanche Fuji C-Chain
RPC URL: https://api.avax-test.network/ext/bc/C/rpc
Chain ID: 43113
Symbol: AVAX
Block Explorer: https://testnet.snowtrace.io/
```

**Get Test AVAX:**

- Faucet: https://faucet.avax.network/
- Request: 2 AVAX per 24 hours

### Mainnet (Production)

```javascript
Network Name: Avalanche C-Chain
RPC URL: https://api.avax.network/ext/bc/C/rpc
Chain ID: 43114
Symbol: AVAX
Block Explorer: https://snowtrace.io/
```

---

## 📊 Demo Walkthrough

### Scenario: Robotics Club Fundraiser

**1. Campaign Creation**

```bash
curl -X POST http://localhost:3001/api/campaigns \
  -H "Content-Type: application/json" \
  -d '{
    "creator": "0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb",
    "title": "Robotics Club Equipment Fund",
    "description": "Purchase robotics parts for national competition",
    "goalKES": 500000,
    "deadline": 1735689600,
    "milestones": [
      {"description": "Buy parts", "amountKES": 300000},
      {"description": "Travel", "amountKES": 200000}
    ]
  }'

# Response: campaignId = 0, goalAVAX = 3.413
```

**2. Donations (3 donors)**

```bash
# Donor 1: 100,000 KES
curl -X POST http://localhost:3001/api/campaigns/0/donate \
  -H "Content-Type: application/json" \
  -d '{"donor": "0xDonor1...", "amountKES": 100000}'

# Donor 2: 200,000 KES
curl -X POST http://localhost:3001/api/campaigns/0/donate \
  -H "Content-Type: application/json" \
  -d '{"donor": "0xDonor2...", "amountKES": 200000}'

# Donor 3: 250,000 KES (goal reached!)
curl -X POST http://localhost:3001/api/campaigns/0/donate \
  -H "Content-Type: application/json" \
  -d '{"donor": "0xDonor3...", "amountKES": 250000}'
```

**3. Milestone Proposal**

```bash
# Creator submits evidence for Milestone 0
curl -X POST http://localhost:3001/api/campaigns/0/milestones/0/propose \
  -H "Content-Type: application/json" \
  -d '{
    "creator": "0x7******",
    "evidenceURI": "ipfs://QmParts123/receipt.pdf"
  }'
```

**4. Donor Voting**

```bash
# All 3 donors vote (100% quorum)
curl -X POST http://localhost:3001/api/campaigns/0/milestones/0/vote \
  -d '{"voter": "0xDonor1...", "approve": true}'

curl -X POST http://localhost:3001/api/campaigns/0/milestones/0/vote \
  -d '{"voter": "0xDonor2...", "approve": true}'

curl -X POST http://localhost:3001/api/campaigns/0/milestones/0/vote \
  -d '{"voter": "0xDonor3...", "approve": false}'

# Result: 2/3 approve (66% > 50% threshold) ✓
```

**5. Finalize & Release**

```bash
curl -X POST http://localhost:3001/api/campaigns/0/milestones/0/finalize \
  -d '{"caller": "0x74*******"}'

# 2.048 AVAX (300,000 KES) transferred to creator
# Event: MilestoneFinalized emitted
# Creator balance increased by 2.048 AVAX
```

**6. Verify on Blockchain**

```bash
# Check transaction
https://testnet.snowtrace.io/tx/0x...

# View contract state
https://testnet.snowtrace.io/address/0x.../readContract
```

---

## 🎨 Frontend Features

### Pages

1. **Home (`/`)**

   - Campaign grid with search
   - Real-time KES display
   - Funding progress bars
   - Days remaining countdown

2. **Campaign Detail (`/campaign/:id`)**

   - Full campaign information
   - Donation interface with KES↔AVAX conversion
   - Milestone cards with voting UI
   - Donor list and transaction history

3. **Create Campaign (`/create`)**
   - Multi-step form
   - Milestone builder
   - Goal validation (milestones = goal)
   - Date picker for deadline

### Components

- **CampaignCard**: Preview with progress bar
- **MilestoneCard**: Evidence links, voting buttons, status badges
- **Price Conversion**: Real-time AVAX↔KES display
- **Transaction History**: Donor list with tx hashes

### Design System

- **Colors**: Emerald (money/growth), Blue (trust), Amber (action)
- **Typography**: Inter font family
- **Animations**: Smooth transitions for trust
- **Responsive**: Mobile-first design

---

## 📦 Deployment Checklist

### Smart Contract Deployment

```bash
# 1. Final testing
npx hardhat test
npx hardhat coverage

# 2. Deploy to Fuji
npx hardhat run scripts/deploy.js --network fuji
# Save contract address

# 3. Verify on Snowtrace
npx hardhat verify --network fuji DEPLOYED_ADDRESS

# 4. (Optional) Mainnet deployment
npx hardhat run scripts/deploy.js --network avalanche
```

### Backend Deployment

**Option A: Railway / Render**

```bash
# 1. Add start script to package.json
"scripts": {
  "start": "node src/server.js"
}

# 2. Set environment variables in dashboard
# 3. Deploy via Git push
```

**Option B: Docker**

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
EXPOSE 3001
CMD ["npm", "start"]
```

### Frontend Deployment

**Option A: Vercel / Netlify**

```bash
# Install CLI
npm install -g vercel

# Deploy
vercel --prod

# Set environment variables:
VITE_API_URL=https://your-backend.com/api
VITE_CONTRACT_ADDRESS=0x...
VITE_NETWORK=fuji
```

**Option B: Static hosting**

```bash
# Build
npm run build

# Deploy dist/ folder to:
# - AWS S3 + CloudFront
# - IPFS (decentralized)
# - GitHub Pages
```

---

## 🐛 Troubleshooting

### Common Issues

**1. Transaction Fails: "Insufficient funds"**

```bash
# Solution: Get test AVAX
Visit: https://faucet.avax.network/
Enter your wallet address
Request 2 AVAX
```

**2. Price Oracle Not Updating**

```bash
# Check Chainlink feed
npx hardhat console --network fuji
> const feed = await ethers.getContractAt("AggregatorV3Interface", "0x0A7*********")
> await feed.latestRoundData()

# If fails: Use FALLBACK_KES_PER_AVAX in .env
```

**3. Contract Interaction Errors**

```bash
# Verify correct network
console.log(await ethers.provider.getNetwork())
# Should show { chainId: 43113, name: 'unknown' }

# Check contract address
const contract = await ethers.getContractAt("CrowdfundingEscrow", CONTRACT_ADDRESS)
const count = await contract.campaignCounter()
console.log("Campaigns:", count.toString())
```

**4. MetaMask Not Connecting**

```javascript
// Add Fuji network to MetaMask
await window.ethereum.request({
  method: "wallet_addEthereumChain",
  params: [
    {
      chainId: "0xA869", // 43113
      chainName: "Avalanche Fuji C-Chain",
      nativeCurrency: { name: "AVAX", symbol: "AVAX", decimals: 18 },
      rpcUrls: ["https://api.avax-test.network/ext/bc/C/rpc"],
      blockExplorerUrls: ["https://testnet.snowtrace.io/"],
    },
  ],
});
```

---

## 📖 Additional Resources

### Documentation

- **Avalanche Docs**: https://docs.avax.network/
- **Hardhat Guide**: https://hardhat.org/getting-started/
- **Ethers.js Docs**: https://docs.ethers.org/v6/
- **Chainlink Feeds**: https://docs.chain.link/data-feeds/price-feeds/addresses

### Tools

- **Remix IDE**: https://remix.ethereum.org/ (test contracts)
- **Snowtrace**: https://testnet.snowtrace.io/ (block explorer)
- **MetaMask**: https://metamask.io/ (wallet)
- **IPFS**: https://www.pinata.cloud/ (evidence storage)

### Community

- **Avalanche Discord**: https://discord.gg/avalancheavax
- **Avalanche Forum**: https://forum.avax.network/
- **GitHub Issues**: Report bugs and request features

---

## 📄 License

MIT License - See LICENSE file for details

---

## 👥 Contributors

Built for transparent campus crowdfunding in Kenya. Contributions welcome!

**Contact**: [nclips254@gmail.com](mailto:nclips254@gmail.com)

**GitHub**: [rick868](https://github.com/rick868)

---

**Last Updated**: 2025-11-22
**Version**: 1.0.0
**Status**: Production Ready (Testnet), Audit Recommended for Mainnet
