# NovaAgent - Deployment Guide

## Project Structure

This is a **monorepo** project with the following structure:

```
novaagent/
├── apps/
│   └── web/              # Next.js 16.1.4 application (ENTRY POINT)
│       ├── src/
│       │   ├── app/       # Next.js App Router
│       │   │   ├── page.tsx        # Main entry point (root route)
│       │   │   ├── layout.tsx      # Root layout
│       │   │   └── api/           # API routes
│       │   ├── components/        # React components
│       │   ├── hooks/             # Custom React hooks
│       │   └── lib/               # Utility libraries
│       ├── package.json
│       └── next.config.js
├── packages/
│   ├── contracts/        # Solidity smart contracts (Foundry)
│   └── shared/           # Shared TypeScript types/constants
├── services/
│   └── agent/            # AI Agent service (Crypto.com AI SDK)
│       └── src/
└── package.json          # Root workspace config
```

## Entry Point

**For Vercel Deployment:**
- **Root Directory**: `apps/web`
- **Framework**: Next.js 16.1.4
- **Build Command**: `npm run build` (run from `apps/web` directory)
- **Output Directory**: `.next`

## Local Development Setup

### Prerequisites
- Node.js >= 18.0.0
- npm (with workspaces support)

### Running Locally

1. **Install dependencies** (from root):
   ```bash
   npm install
   ```

2. **Run development server**:
   ```bash
   # From root:
   npm run dev
   
   # Or from apps/web:
   cd apps/web
   npm run dev --webpack
   ```

3. **Access the app**:
   - Local: http://localhost:3000
   - The app uses **Cronos Testnet** (Chain ID: 338)

## Vercel Deployment

### Option 1: Deploy from Root (Recommended for Monorepo)

1. **Set Root Directory in Vercel Dashboard**:
   - Go to Project Settings → General
   - Set **Root Directory** to: `apps/web`

2. **Build Settings**:
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build` (Vercel will auto-detect)
   - **Output Directory**: `.next` (auto-detected)
   - **Install Command**: `npm install` (auto-detected)

3. **Environment Variables** (set in Vercel Dashboard):
   ```
   NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org
   NEXT_PUBLIC_CRONOS_NETWORK=cronos-testnet
   NEXT_PUBLIC_USDC_CONTRACT=0x66e428c3f67a68878562e79A0234c1F83c208770
   POLICY_CONTRACT_ADDRESS=<your-deployed-contract-address>
   NEXT_PUBLIC_FACILITATOR_BASE_URL=https://facilitator.cronoslabs.org
   NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
   SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
   CRYPTO_AI_API_KEY=<your-crypto-ai-api-key>
   CRYPTO_AI_BASE_URL=https://api.crypto.com/ai/v1
   CRYPTO_AI_MODEL=gpt-4o-mini
   OPENAI_API_KEY=<your-openai-api-key> (fallback)
   NEXT_PUBLIC_THIRDWEB_CLIENT_ID=<your-thirdweb-client-id>
   ```

### Option 2: Deploy Using vercel.json

The project includes a `vercel.json` in the root that configures:
- Root directory: `apps/web`
- Build command: `cd apps/web && npm install && npm run build`
- Environment variables (reference Vercel secrets)

### Important Notes for Vercel

1. **Monorepo Support**: Vercel automatically detects monorepos and handles workspace dependencies.

2. **Path Aliases**: The `@novaagent/agent` alias is configured in:
   - `apps/web/tsconfig.json` (TypeScript paths)
   - `apps/web/next.config.js` (webpack alias resolution)

3. **Build Process**:
   - Vercel installs dependencies from root `package.json`
   - Builds the Next.js app from `apps/web`
   - Resolves workspace dependencies automatically

4. **Environment Variables**:
   - All `NEXT_PUBLIC_*` variables are exposed to the browser
   - Server-only variables (like API keys) are only available in API routes

## Project Architecture

### Frontend (`apps/web`)
- **Framework**: Next.js 16.1.4 with App Router
- **UI**: React 19, Tailwind CSS, Framer Motion
- **Web3**: thirdweb SDK v5.117.2
- **Payment**: Cronos x402 Facilitator SDK
- **Entry**: `apps/web/src/app/page.tsx`

### Backend Services
- **API Routes**: `apps/web/src/app/api/`
  - `/api/purchase` - x402 payment challenge
  - `/api/agent/process` - AI agent processing
  - `/api/facilitator/submit` - Payment submission
  - `/api/fulfillment` - Gift card issuance
  - `/api/tx/status` - Transaction status

### Smart Contracts (`packages/contracts`)
- **Framework**: Foundry
- **Contract**: `AgentPolicy.sol` (spending limits)

### AI Agent Service (`apps/web/src/lib/agent`)
- **SDK**: Crypto.com AI Agent SDK (with OpenAI fallback)
- **Tools**: Database-backed gift card integration, x402 trigger

## Troubleshooting

### Build Errors
- Ensure all environment variables are set in Vercel
- Check that `POLICY_CONTRACT_ADDRESS` is deployed on Cronos Testnet
- Verify API keys are valid

### Path Resolution Issues
- The webpack config in `next.config.js` handles `@novaagent/agent` alias
- If issues persist, check that `services/agent/src/index.ts` exports correctly

### Turbopack vs Webpack
- Currently using **webpack** (explicit via `--webpack` flag)
- Turbopack doesn't fully support custom path aliases yet
- To use Turbopack: remove webpack config and update path resolution

## Quick Deploy Checklist

- [ ] Set Vercel root directory to `apps/web`
- [ ] Configure all environment variables
- [ ] Deploy `AgentPolicy.sol` to Cronos Testnet
- [ ] Update `POLICY_CONTRACT_ADDRESS` in Vercel
- [ ] Test wallet connection (Cronos Testnet)
- [ ] Verify x402 payment flow
- [ ] Test AI agent responses
