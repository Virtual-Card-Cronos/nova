# How the 402 Payment Flow Works with Supabase

## 🔄 Complete Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │
       │ 1. Click "Buy" → POST /api/purchase
       ▼
┌─────────────────────┐
│  /api/purchase      │
│  (Next.js API)      │
│                     │
│  - Validates request│
│  - Checks policy    │
│  - Creates challenge│
│  - Returns 402      │
└──────┬──────────────┘
       │
       │ 2. HTTP 402 Payment Required
       │    { challenge: {...} }
       ▼
┌─────────────────────┐
│  useX402Payment     │
│  (Client Hook)      │
│                     │
│  - Receives 402     │
│  - Shows payment UI │
│  - User clicks      │
│    "Authorize"      │
└──────┬──────────────┘
       │
       │ 3. Generate Payment Header
       │    (Client-side EIP-712 signature)
       ▼
┌─────────────────────┐
│  payment-header-    │
│  generator.ts       │
│                     │
│  - Creates EIP-712  │
│    typed data       │
│  - Signs with wallet│
│  - Base64 encodes   │
└──────┬──────────────┘
       │
       │ 4. POST /api/facilitator/submit
       │    { challenge, signature: paymentHeader }
       ▼
┌─────────────────────┐
│  /api/facilitator/  │
│  submit             │
│                     │
│  - Calls SDK        │
│  - verifyPayment()  │
│  - settlePayment()  │
└──────┬──────────────┘
       │
       │ 5. Facilitator SDK
       │    → POST /verify
       │    → POST /settle
       ▼
┌─────────────────────┐
│  Cronos Facilitator │
│  Service            │
│                     │
│  - Verifies sig     │
│  - Executes tx      │
│  - Returns txHash   │
└──────┬──────────────┘
       │
       │ 6. Transaction Hash
       │    { transactionHash: "0x..." }
       ▼
┌─────────────────────┐
│  /api/fulfillment   │
│  (Next.js API)      │
│                     │
│  - Receives txHash  │
│  - Calls Supabase   │
│  - Issues gift card │
└──────┬──────────────┘
       │
       │ 7. Supabase Database
       │    - Create order
       │    - Decrement inventory
       │    - Generate gift card
       ▼
┌─────────────────────┐
│  Supabase           │
│  PostgreSQL         │
│                     │
│  - orders table     │
│  - gift_cards table │
│  - inventory count  │
└──────┬──────────────┘
       │
       │ 8. Gift Card Code
       │    { code: "ABC123..." }
       ▼
┌─────────────┐
│   User      │
│  (Browser)  │
│             │
│  Receives   │
│  gift card! │
└─────────────┘
```

---

## 📋 Step-by-Step Breakdown

### Step 1: Purchase Request (`/api/purchase`)
**Location:** `apps/web/src/app/api/purchase/route.ts`

**What it does:**
- Receives purchase intent from client
- Validates agent policy (currently bypassed for testing)
- Creates x402 challenge with:
  - Amount (in USDC base units - 6 decimals)
  - Recipient (merchant address from `NEXT_PUBLIC_MERCHANT_ADDRESS`)
  - Description
  - Network (cronos-testnet)
- Returns HTTP 402 with challenge

**Response:**
```json
{
  "status": 402,
  "challenge": {
    "scheme": "x402",
    "network": "cronos-testnet",
    "resource": {
      "type": "payment",
      "amount": "50000000",  // $50.00 in base units
      "currency": "USDC",
      "recipient": "0x...",  // Merchant address
      "description": "Amazon.com Gift Card - $50.00 USD",
      "facilitatorUrl": "https://facilitator.cronoslabs.org/v2/x402"
    }
  }
}
```

---

### Step 2: Client Receives 402
**Location:** `apps/web/src/hooks/useX402Payment.ts` → `initiatePayment()`

**What it does:**
- Makes POST request to `/api/purchase`
- Receives 402 response
- Parses challenge
- Updates payment state to `'signing'`
- Shows payment modal to user

---

### Step 3: Generate Payment Header (Client-Side)
**Location:** `apps/web/src/lib/payment-header-generator.ts`

**What it does:**
1. Creates payment requirements from challenge
2. Generates random 32-byte nonce
3. Creates EIP-712 typed data:
   ```typescript
   {
     domain: {
       name: "Bridged USDC (Stargate)",
       version: "1",
       chainId: "338",  // Cronos Testnet
       verifyingContract: "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
     },
     types: {
       TransferWithAuthorization: [...]
     },
     message: {
       from: userAddress,
       to: merchantAddress,
       value: amount,
       validAfter: 0,
       validBefore: timestamp + 300,
       nonce: randomNonce
     }
   }
   ```
4. Signs with wallet (EIP-712 signature)
5. Creates payment header object:
   ```json
   {
     "x402Version": 1,
     "scheme": "x402",
     "network": "cronos-testnet",
     "payload": {
       "from": "0x...",
       "to": "0x...",
       "value": "50000000",
       "validAfter": 0,
       "validBefore": 1234567890,
       "nonce": "0x...",
       "signature": "0x...",
       "asset": "0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0"
     }
   }
   ```
6. Base64 encodes the header

**This is the critical step that was missing!**

---

### Step 4: Submit Payment
**Location:** `apps/web/src/hooks/useX402Payment.ts` → `confirmPayment()`

**What it does:**
- Sends payment header to `/api/facilitator/submit`
- Includes challenge and user address

---

### Step 5: Verify & Settle Payment
**Location:** `apps/web/src/app/api/facilitator/submit/route.ts`
**Uses:** `apps/web/src/lib/facilitator.ts` → `submitPaymentRequest()`

**What it does:**
1. Creates payment requirements from challenge
2. Builds verify request using SDK:
   ```typescript
   const verifyRequest = facilitator.buildVerifyRequest(
     paymentHeader,  // Base64-encoded header
     requirements
   )
   ```
3. Calls facilitator service:
   - `POST /verify` → Validates signature
   - `POST /settle` → Executes transaction
4. Returns transaction hash

**Facilitator SDK handles:**
- Formatting request to match facilitator API
- HTTP calls to facilitator service
- Parsing responses

---

### Step 6: Fulfillment (Supabase)
**Location:** `apps/web/src/app/api/fulfillment/route.ts`
**Uses:** `apps/web/src/lib/agent/tools.ts` → `issueGiftCard()`

**What it does:**
1. Receives transaction hash
2. Calls `issueGiftCard()` which:
   - Gets item from Supabase
   - Checks inventory
   - Creates order (decrements inventory via trigger)
   - Generates gift card code
   - Inserts into `gift_cards` table
3. Returns gift card code

**Supabase Operations:**
```sql
-- 1. Create order (triggers inventory decrement)
INSERT INTO orders (user_address, recipient_email, external_id)
VALUES (...);

-- 2. Create order_items
INSERT INTO order_items (order_id, item_id, quantity, price)
VALUES (...);

-- 3. Generate gift card
INSERT INTO gift_cards (order_id, item_id, code, balance, currency, state)
VALUES (..., 'ABC123...', 5000, 'USD', 'Active');
```

---

## 🔧 What Was Broken & What's Fixed

### ❌ Before (Broken):
1. `/api/payment/generate-header` returned 501 (Not Implemented)
2. Payment header generation failed
3. Payment submission failed because no valid header

### ✅ After (Fixed):
1. ✅ Client-side payment header generation
2. ✅ EIP-712 signature with wallet
3. ✅ Base64-encoded header format
4. ✅ Proper flow to facilitator

---

## 🎯 Current Status

### ✅ Working:
- 402 response generation
- Challenge creation
- Payment modal UI
- Supabase gift card issuance
- Inventory management

### ✅ Just Fixed:
- Client-side payment header generation
- EIP-712 signature flow

### ⚠️ Still Needs:
- `NEXT_PUBLIC_MERCHANT_ADDRESS` environment variable
- Test with actual wallet and USDC.e tokens

---

## 📝 Environment Variables Required

```bash
# In apps/web/.env.local

# Merchant address (REQUIRED - currently missing!)
NEXT_PUBLIC_MERCHANT_ADDRESS=0xYourMerchantWalletAddress

# Network
NEXT_PUBLIC_CRONOS_NETWORK=cronos-testnet
NEXT_PUBLIC_CRONOS_RPC=https://evm-t3.cronos.org

# Database
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_key

# AI
GOOGLE_API_KEY=your_gemini_key
```

---

## 🧪 Testing the Flow

1. **Set merchant address** in `.env.local`
2. **Start dev server**: `npm run dev`
3. **Connect wallet** to Cronos Testnet
4. **Click "Buy"** on a gift card
5. **Authorize payment** in wallet
6. **Check logs** for each step
7. **Verify transaction** on Cronoscan
8. **Check gift card** in Supabase

---

## 📊 Database Tables Used

1. **`gift_card_items`** - Product catalog
2. **`orders`** - Purchase records
3. **`order_items`** - Order line items
4. **`gift_cards`** - Issued gift cards

All managed via Supabase with automatic inventory decrement via triggers.
