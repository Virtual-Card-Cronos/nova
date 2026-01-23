# Payment Flow Debugging Guide

## Common Issues and Solutions

### 1. Missing Merchant Address
**Error:** `Merchant recipient address not configured`

**Solution:**
Add to `.env.local`:
```bash
NEXT_PUBLIC_MERCHANT_ADDRESS=0xYourMerchantAddressHere
```

This is the address that will **receive** the payments (your platform address).

### 2. Wrong Network
**Issue:** Wallet connected to wrong network

**Check:**
- Wallet must be on **Cronos Testnet** (Chain ID: 338)
- Network name: Cronos Testnet
- RPC: `https://evm-t3.cronos.org`

### 3. Token Issues
**Check:**
- ✅ You have **devUSDC.e** (not USDC.e) on testnet
- ✅ Contract: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
- ✅ You have enough TCRO for gas fees
- ✅ Token balance is sufficient for the purchase

### 4. EIP-712 Signing Issues
**Symptoms:** Payment header generation fails or signature is invalid

**Check browser console for:**
- `[Payment] 🔐 Generating payment header client-side...`
- `[Payment] ✅ Payment header generated: ...`
- Any errors during `signTypedData`

**Common causes:**
- Wrong chain ID in domain
- Token contract address mismatch
- Domain name/version mismatch

### 5. Facilitator API Issues
**Check server logs for:**
- `/api/facilitator/submit` errors
- Facilitator SDK errors
- Network/connectivity issues

### 6. Transaction Status
**Check:**
- Transaction hash received?
- Transaction visible on Cronoscan?
- Transaction status (pending/success/failed)

## Step-by-Step Debugging

### Step 1: Check Environment Variables
```bash
# In apps/web/.env.local
NEXT_PUBLIC_MERCHANT_ADDRESS=0xYourAddress
NEXT_PUBLIC_FACILITATOR_BASE_URL=https://facilitator.cronoslabs.org/v2/x402
NEXT_PUBLIC_CRONOS_NETWORK=cronos-testnet
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org
```

### Step 2: Check Browser Console
Look for these logs:
1. `[Payment] 🚀 Initiating payment...`
2. `[Payment] ✅ Received 402 challenge:`
3. `[Payment] 🔐 Generating payment header client-side...`
4. `[Payment] ✅ Payment header generated:`
5. `[Payment] 📤 Submitting payment to facilitator...`

### Step 3: Check Server Logs
Look for:
1. `[Purchase API] 📥 Received purchase request`
2. `[Purchase API] ✅ Policy approved, creating x402 challenge...`
3. `[Facilitator] ✅ Using merchant address:`
4. `[Facilitator] 📤 Submitting payment request...`

### Step 4: Verify Token Contract
On Cronos Testnet, verify you're using:
- **devUSDC.e**: `0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0`
- Not regular USDC.e

### Step 5: Test Payment Header Generation
The payment header should be a base64-encoded JSON string containing:
- `x402Version: 1`
- `scheme: 'x402'`
- `network: 'cronos-testnet'`
- `payload` with signature, nonce, etc.

## Quick Fixes

### If payment fails at challenge creation:
- Check `NEXT_PUBLIC_MERCHANT_ADDRESS` is set
- Verify facilitator URL is correct

### If payment fails at signing:
- Check wallet is connected
- Verify network is Cronos Testnet
- Check browser console for signing errors

### If payment fails at submission:
- Check facilitator API is accessible
- Verify payment header format
- Check server logs for facilitator errors

## Testing Checklist

- [ ] Merchant address configured
- [ ] Wallet connected to Cronos Testnet
- [ ] Have devUSDC.e tokens
- [ ] Have TCRO for gas
- [ ] Browser console shows no errors
- [ ] Server logs show successful challenge creation
- [ ] Payment header generated successfully
- [ ] Facilitator accepts the payment request
