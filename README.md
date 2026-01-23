# NovaAgent - AI Shopping Concierge with Aegis Pattern

> **Aegis Pattern**: AI Intelligence + Smart Contract Policy = Trustworthy Autonomous Commerce

NovaAgent is a revolutionary shopping platform that combines the power of AI with blockchain-based policy controls to create secure, autonomous purchasing experiences. Built for the Crypto.com DeFi Dashboard, this project demonstrates the future of AI-agent commerce with gasless, policy-governed transactions.

- **🤖 AI-Driven Commerce**: Intelligent agents that understand shopping intent and execute purchases autonomously
- **🔐 Policy-First Security**: On-chain spending limits and authorization controls prevent unauthorized transactions
- **⚡ Gasless Transactions**: Users never pay gas fees, thanks to Crypto.com's x402 facilitator
- **🎯 Trustless Fulfillment**: Blockchain-verified delivery of digital goods

### Technical Innovation

- **x402 Protocol Implementation**: Full HTTP 402 Payment Required flow with facilitator integration
- **EIP-3009 Signatures**: Secure, gasless authorization using permit transfers
- **Policy Engine**: Gas-optimized smart contracts with Ownable2Step governance
- **Monorepo Architecture**: Scalable structure for complex Web3 applications

## 🏗️ Project Architecture

```
/monorepo
├── /apps
│   └── /web              # Next.js 15 (App Router)
│       ├── /src
│       │   ├── /app      # App Router pages
│       │   ├── /components # React components (< 200 lines each)
│       │   ├── /hooks    # Custom React hooks
│       │   └── /lib      # Utilities and clients
│       └── package.json
├── /packages
│   ├── /contracts        # Foundry/Hardhat (Solidity)
│   │   ├── /src
│   │   │   └── AgentPolicy.sol
│   │   └── foundry.toml
│   └── /shared           # Common Types, Constants, ABI
│       ├── /src
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── package.json
└── /services
    └── /agent            # Crypto.com AI Agent SDK Logic
```

## 🛡️ Four Pillars of NovaAgent

### 1. **Identity** - Thirdweb Connect
- Seamless wallet onboarding to the Crypto.com DeFi Dashboard
- Multi-network support (Cronos, Cronos Testnet)
- Native USDC balance display

### 2. **Intelligence** - Crypto.com AI Agent SDK
- Natural language shopping assistance
- Context-aware purchase recommendations
- Autonomous transaction execution

### 3. **Authorization** - AgentPolicy.sol
- On-chain spending limits per agent
- Gas-optimized policy validation
- Ownable2Step governance for security

### 4. **Settlement** - Cronos x402 Facilitator
- Gasless USDC transfers
- HTTP 402 Payment Required protocol
- EIP-3009 permit-based authorization

### 5. **Fulfillment** - Database-Backed Gift Cards
- Instant gift card delivery
- Multiple retailer support (Amazon, Google Play, Steam, etc.)
- Inventory tracking with automatic decrement
- Blockchain-verified redemption

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Foundry (for smart contracts)
- Git

### Installation

1. **Clone and setup monorepo**
   ```bash
   git clone <repository-url>
   cd novaagent
   npm install
   ```

2. **Setup environment variables**
   ```bash
   cp env.example .env.local
   # Edit .env.local with your API keys
   ```

3. **Deploy smart contracts**
   ```bash
   cd packages/contracts
   forge install
   forge build
   # Deploy to testnet/mainnet and update addresses in .env
   ```

4. **Start development server**
   ```bash
   cd apps/web
   npm run dev
   ```

### Environment Configuration

```bash
# Required for production
NEXT_PUBLIC_CRONOS_RPC=https://evm.cronos.org
POLICY_CONTRACT_ADDRESS=0x... # Your deployed AgentPolicy contract
FACILITATOR_API_KEY=your_key_here
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
NEXT_PUBLIC_THIRDWEB_CLIENT_ID=your_client_id
```

## 🎯 Key Features

### Smart Contract Policy Engine

The `AgentPolicy.sol` contract provides gas-efficient spending controls:

```solidity
// Gas-optimized policy checking
function checkPolicy(address agent, uint256 amount) external view returns (bool)

// Batch operations for efficiency
function batchSetLimits(address[] calldata agents, uint256[] calldata limits)

// Custom errors for better UX
error LimitExceeded();
```

### x402 Protocol Implementation

Full HTTP 402 Payment Required flow:

```typescript
// 1. Agent requests purchase
POST /api/purchase
{
  "agentId": "0x...",
  "amount": "50000000", // 50 USDC
  "description": "Amazon Gift Card"
}

// 2. Backend validates policy
// 3. Returns HTTP 402 with challenge
HTTP 402 Payment Required
WWW-Authenticate: x402 scheme=cronos amount=50...
```

### React Hook Architecture

The `useX402Payment` hook manages the complete payment flow:

```typescript
const { paymentState, initiatePayment, confirmPayment } = useX402Payment()

// Initiate purchase
await initiatePayment(purchaseIntent)

// Handle 402 response and sign
await confirmPayment(agentSignature)
```

## 🔧 Development

### Smart Contracts

```bash
cd packages/contracts
forge test                    # Run tests
forge build                   # Compile contracts
forge verify-contract         # Verify on Cronoscan
```

### Web Application

```bash
cd apps/web
npm run dev                   # Start development server
npm run build                 # Production build
npm run lint                  # ESLint checks
```

### Shared Package

```bash
cd packages/shared
npm run build                 # Compile TypeScript
npm run dev                   # Watch mode
```

## 🧪 Testing Strategy

### Smart Contract Tests
- Foundry test suite with gas optimization checks
- Fuzz testing for edge cases
- Integration tests with policy validation

### Frontend Tests
- Component testing with React Testing Library
- Hook testing for payment flows
- E2E tests with Playwright

### API Tests
- x402 protocol compliance testing
- Policy validation edge cases
- Error handling scenarios

## 🚀 Deployment

### Smart Contracts
1. Deploy `AgentPolicy.sol` to Cronos
2. Set agent spending limits via `setSpendingLimit()`
3. Verify contract on Cronoscan

### Web Application
1. Build optimized bundle: `npm run build`
2. Deploy to Vercel/Netlify
3. Configure environment variables
4. Set up monitoring and analytics

### AI Agent Service
1. Deploy to Crypto.com infrastructure
2. Configure API endpoints
3. Set up logging and monitoring

## 🔒 Security Considerations

### Smart Contract Security
- OpenZeppelin Ownable2Step for secure ownership transfers
- Custom errors to reduce gas costs and improve UX
- Input validation on all public functions
- Access control patterns

### Frontend Security
- EIP-3009 signatures for secure authorization
- Input sanitization and validation
- Secure API key management
- Content Security Policy headers

### Protocol Security
- x402 specification compliance
- Facilitator service security
- Rate limiting and abuse prevention

## 📊 Performance Optimizations

### Gas Optimization
- Custom errors instead of string reverts
- Efficient storage patterns
- Batch operations for multiple agents
- View functions for policy checking

### Frontend Performance
- React components under 200 lines
- Framer Motion for smooth animations
- Lazy loading and code splitting
- Optimized bundle size

### Network Efficiency
- RPC request batching
- Caching strategies
- Connection pooling
- Error retry logic

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Crypto.com** for the x402 Facilitator and AI Agent SDK
- **Thirdweb** for seamless wallet integration
- **OpenZeppelin** for secure smart contract components
- **Cronos** for fast, low-cost blockchain infrastructure

## 🎉 Hackathon Judging Criteria Alignment

- ✅ **Innovation**: Aegis Pattern - novel AI + Blockchain architecture
- ✅ **Technical Complexity**: Multi-chain, multi-protocol implementation
- ✅ **User Experience**: Seamless AI-powered shopping experience
- ✅ **Security**: On-chain policy controls and secure authorization
- ✅ **Scalability**: Gas-optimized contracts and efficient architecture
- ✅ **Real-world Impact**: Practical solution for AI-agent commerce

---

**Built with ❤️ for the Crypto.com DeFi Dashboard Hackathon**

*Experience the future of shopping: where AI meets blockchain security.*
