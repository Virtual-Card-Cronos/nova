# Complete Testing Flow Guide

## 🎯 Overview

This guide walks you through testing the NovaAgent gift card marketplace, including the AI agent and manual storefront.

## 📋 Prerequisites

### 1. **Network: Cronos Testnet**
- The app is configured to use **Cronos Testnet** by default
- RPC: `https://evm-t3.cronos.org`
- Network ID: 338 (Cronos Testnet)

### 2. **Tokens Required: USDC.e (Testnet)**
- **Token**: USDC.e (USD Coin bridged to Cronos)
- **Contract Address (Testnet)**: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
- **Decimals**: 6 (so $1 = 1,000,000 units)
- **Amount Needed**: At least $10-50 worth for testing

### 3. **How to Get Testnet USDC.e**

#### Option A: Cronos Testnet Faucet
1. Visit: https://cronos.org/developers/testnet
2. Get testnet CRO for gas fees
3. Bridge USDC from another testnet or use a testnet faucet

#### Option B: Use Testnet Bridge
1. Go to Cronos Testnet Bridge
2. Bridge testnet USDC from Ethereum Sepolia or other testnets

#### Option C: Request from Community
- Join Cronos Discord: https://discord.gg/cronos
- Request testnet tokens in the #testnet-faucet channel

### 4. **Wallet Setup**
- Install a Web3 wallet (MetaMask, Coinbase Wallet, etc.)
- Add Cronos Testnet network:
  - **Network Name**: Cronos Testnet
  - **RPC URL**: `https://evm-t3.cronos.org`
  - **Chain ID**: 338
  - **Currency Symbol**: TCRO
  - **Block Explorer**: https://testnet.cronoscan.com

### 5. **Environment Variables**
Make sure your `.env.local` has:
```bash
# Network
NEXT_PUBLIC_CRONOS_NETWORK=cronos-testnet
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org

# Merchant Address (your wallet that receives payments)
NEXT_PUBLIC_MERCHANT_ADDRESS=0xYourMerchantWalletAddress

# Database (Supabase)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI Provider
GOOGLE_API_KEY=your_gemini_key
# OR
OPENAI_API_KEY=your_openai_key
```

---

## 🔄 Complete Testing Flow

### **Flow 1: AI Agent Purchase**

#### Step 1: Start the App
```bash
cd apps/web
npm run dev
```
Open: http://localhost:3000

#### Step 2: Connect Wallet
1. Click "Connect Wallet" button
2. Select your wallet (MetaMask, etc.)
3. **Switch to Cronos Testnet** if not already connected
4. Approve connection

#### Step 3: Test AI Agent Queries
Try these queries in the Agent console:

**Query Available Options:**
```
How many brands are available at at least $50?
```

**Find Specific Brand:**
```
I want to buy a $25 Amazon gift card
```

**Browse Options:**
```
Show me cheap gift cards under $20
```

**Expected Behavior:**
- Agent calls `listAllItems()` tool
- Returns filtered/analyzed results
- Shows count and list of available brands

#### Step 4: Initiate Purchase
When agent suggests a purchase:
1. Agent creates a `PurchaseIntent`
2. Payment modal appears with:
   - Amount in USDC
   - Merchant address (should be YOUR merchant address, not your wallet)
   - Description
   - Network fee (~0.42 CRO)

#### Step 5: Authorize Payment
1. Click "Authorize & Execute" button
2. Wallet popup appears for EIP-3009 permit signature
3. Sign the permit (this authorizes the payment)
4. Wait for transaction confirmation

#### Step 6: Verify Payment
- Check server logs for:
  ```
  [Purchase API] ✅ Challenge created successfully
  [Purchase API] 📍 Final merchant recipient address: 0x...
  [Facilitator] ✅ Using merchant address: 0x...
  ```
- Check wallet for USDC.e balance decrease
- Check transaction on Cronoscan: https://testnet.cronoscan.com

#### Step 7: Receive Gift Card
- After payment confirms, gift card code is issued
- Check email or order history
- Gift card code should be displayed

---

### **Flow 2: Manual Storefront Purchase**

#### Step 1: Browse Storefront
1. Click "Storefront" tab
2. Browse available gift cards
3. Filter by category or search by brand

#### Step 2: Select Gift Card
1. Click on a gift card item
2. Verify:
   - Price in USD
   - Brand name
   - Inventory count
   - Image

#### Step 3: Click "Buy" Button
1. Click "Buy" on desired gift card
2. Payment modal appears
3. Verify merchant address is correct

#### Step 4: Complete Payment
- Same as Flow 1, Steps 5-7

---

## 🔍 What to Check at Each Step

### **Step 1: Wallet Connection**
- ✅ Wallet connects successfully
- ✅ Network is Cronos Testnet (Chain ID: 338)
- ✅ Wallet address is displayed

### **Step 2: AI Agent Queries**
- ✅ Agent calls `listAllItems()` tool
- ✅ Results are filtered correctly (for price queries)
- ✅ Agent responds with accurate counts and lists
- ✅ No errors in browser console

### **Step 3: Payment Modal**
- ✅ Shows correct amount in USDC
- ✅ Shows **Merchant Address** (not "Facilitator Address")
- ✅ Merchant address matches `NEXT_PUBLIC_MERCHANT_ADDRESS`
- ✅ Description is correct
- ✅ Network fee estimate shown

### **Step 4: Payment Authorization**
- ✅ Wallet popup appears
- ✅ Signature request is for EIP-3009 permit
- ✅ Signing succeeds
- ✅ No errors in console

### **Step 5: Transaction**
- ✅ Transaction appears on Cronoscan
- ✅ Status shows "Success"
- ✅ USDC.e balance decreases by correct amount
- ✅ Transaction hash is logged

### **Step 6: Gift Card Issuance**
- ✅ Order created in database
- ✅ Inventory decremented
- ✅ Gift card code generated
- ✅ Code displayed to user

---

## 🐛 Troubleshooting

### **Issue: "Merchant address not configured"**
**Solution:**
- Set `NEXT_PUBLIC_MERCHANT_ADDRESS` in `.env.local`
- Restart dev server

### **Issue: "Insufficient balance"**
**Solution:**
- Get testnet USDC.e from faucet
- Ensure you have enough for purchase + gas fees

### **Issue: "Agent not calling tools"**
**Solution:**
- Check AI API key is set (`GOOGLE_API_KEY` or `OPENAI_API_KEY`)
- Check server logs for API errors
- Verify `listAllItems()` function is working

### **Issue: "Payment fails"**
**Solution:**
- Check wallet has USDC.e balance
- Verify network is Cronos Testnet
- Check facilitator service is accessible
- Review server logs for errors

### **Issue: "Transaction stuck"**
**Solution:**
- Check Cronoscan for transaction status
- Verify network connectivity
- Check gas fees are sufficient

---

## 📊 Expected Server Logs

### **Successful Purchase Flow:**
```
[Purchase API] 📥 Received purchase request
[Purchase API] 📋 Request details: { agentId, amount, currency, description }
[Purchase API] ✅ Policy approved, creating x402 challenge...
[Purchase API] 📍 No recipient provided, using merchant address from environment
[Facilitator] ✅ Using merchant address: 0x...
[Purchase API] ✅ Challenge created successfully
[Purchase API] 📍 Final merchant recipient address: 0x...
[Payment] ✅ Received 402 challenge
[Payment] ✅ Payment signature created
[Payment] ✅ Payment submitted successfully
[Payment] ✅ Transaction confirmed: 0x...
```

### **AI Agent Query:**
```
[Agent] 🚀 Processing message with AI: How many brands...
[Agent] 🔧 Found function call: listAllItems
[DB] 📋 Listing all items
[DB] ✅ Retrieved 20 active items from database
[Agent] 🔍 Filtered to items with price >= $50: 12 items
[Agent] ✅ Response generated with tool results
```

---

## 🎯 Testing Checklist

- [ ] Wallet connects to Cronos Testnet
- [ ] Has testnet USDC.e balance
- [ ] AI agent responds to queries
- [ ] Agent calls `listAllItems()` tool
- [ ] Agent filters results by price correctly
- [ ] Payment modal shows correct merchant address
- [ ] Payment authorization works
- [ ] Transaction succeeds on Cronoscan
- [ ] Gift card code is issued
- [ ] Inventory decrements correctly
- [ ] Order created in database

---

## 🔗 Useful Links

- **Cronos Testnet Explorer**: https://testnet.cronoscan.com
- **Cronos Testnet Faucet**: https://cronos.org/developers/testnet
- **x402 Documentation**: https://docs.cronos.org/cronos-x402-facilitator/introduction
- **Cronos Discord**: https://discord.gg/cronos

---

## 💡 Tips

1. **Start Small**: Test with $10-20 purchases first
2. **Check Logs**: Monitor both browser console and server logs
3. **Test Both Flows**: Try both AI agent and manual storefront
4. **Verify Database**: Check Supabase dashboard to see orders and inventory
5. **Test Edge Cases**: Try queries like "cheapest", "most expensive", "at least $X"

---

## 🚀 Ready to Test!

1. Ensure you have testnet USDC.e
2. Set up environment variables
3. Start dev server: `npm run dev`
4. Connect wallet to Cronos Testnet
5. Start testing! 🎉
