# Seller Implementation Check

## Documentation vs Our Implementation

### ✅ What We're Doing Correctly:

1. **402 Response** - ✅ Correct
   - We return HTTP 402 with payment requirements
   - Includes `WWW-Authenticate` header
   - Challenge contains all required fields

2. **Payment Verification** - ✅ Using SDK (should be correct)
   - We call `facilitator.verifyPayment(verifyRequest)`
   - SDK should forward to `/verify` endpoint

3. **Payment Settlement** - ✅ Using SDK (should be correct)
   - We call `facilitator.settlePayment(verifyRequest)`
   - SDK should forward to `/settle` endpoint

### ⚠️ Potential Issues:

#### 1. Payment Header Format
**Documentation expects:**
```json
{
  "x402Version": 1,
  "paymentHeader": "<base64-encoded-header>",
  "paymentRequirements": {
    "scheme": "exact",
    "network": "cronos-testnet",
    "payTo": "...",
    "asset": "...",
    "description": "...",
    "mimeType": "application/json",
    "maxAmountRequired": "...",
    "maxTimeoutSeconds": 300
  }
}
```

**What we're doing:**
- Using SDK's `buildVerifyRequest(signature, requirements)`
- SDK should format this correctly, but we should verify

#### 2. Payment Requirements Format
**Documentation shows:**
- `scheme: "exact"` (we might be using `"x402"`)
- `mimeType: "application/json"` (we're not including this)
- `maxTimeoutSeconds: 300` (we're not setting this explicitly)

**Our current code:**
```typescript
const requirements = facilitator.generatePaymentRequirements({
  payTo: challenge.resource.recipient,
  description: challenge.resource.description,
  maxAmountRequired: challenge.resource.amount,
  asset: usdcContract,
})
```

**Missing fields:**
- `scheme` (might default to something)
- `mimeType` (optional but recommended)
- `maxTimeoutSeconds` (optional but recommended)

#### 3. Payment Header Source
**Documentation shows:**
- Seller receives `X-PAYMENT` header from buyer
- Seller extracts and forwards to facilitator

**Our implementation:**
- We receive payment header in request body (not `X-PAYMENT` header)
- This is fine - just a different API design
- But we should verify the format matches

---

## Recommendations

### 1. Verify SDK Format
The facilitator SDK should be handling the format conversion, but we should:
- Add logging to see what the SDK sends
- Verify it matches the documentation format

### 2. Add Missing Fields (Optional but Recommended)
```typescript
const requirements = facilitator.generatePaymentRequirements({
  payTo: challenge.resource.recipient,
  description: challenge.resource.description,
  maxAmountRequired: challenge.resource.amount,
  asset: usdcContract,
  scheme: 'exact', // or 'x402' - check SDK docs
  mimeType: 'application/json', // optional
  maxTimeoutSeconds: 300, // optional
})
```

### 3. Test with Facilitator Health Check
```bash
curl -X GET https://facilitator.cronoslabs.org/healthcheck
```

### 4. Test Supported Endpoint
```bash
curl -X GET https://facilitator.cronoslabs.org/v2/x402/supported
```

---

## Current Flow Comparison

### Documentation Flow:
```
1. Buyer requests resource → 402 response
2. Buyer signs payment header → sends X-PAYMENT header
3. Seller extracts X-PAYMENT → forwards to /verify
4. If valid → forwards to /settle
5. If settled → return 200 with content
```

### Our Flow:
```
1. Buyer requests purchase → 402 response ✅
2. Buyer generates payment header → sends in request body
3. Our API calls SDK → SDK forwards to /verify ✅
4. If valid → SDK forwards to /settle ✅
5. If settled → return 200 with transaction hash ✅
```

**Key Difference:** We're using the SDK abstraction instead of direct HTTP calls. This should work, but we need to ensure:
- The SDK formats requests correctly
- The payment header format matches what facilitator expects

---

## Action Items

1. ✅ **Verify SDK is working** - Test actual payment flow
2. ⚠️ **Add logging** - Log what SDK sends to facilitator
3. ⚠️ **Check payment requirements** - Ensure all fields are included
4. ⚠️ **Test edge cases** - Invalid signature, wrong network, etc.

---

## Testing Checklist

- [ ] Test health check endpoint
- [ ] Test supported endpoint
- [ ] Test payment flow with valid signature
- [ ] Test payment flow with invalid signature
- [ ] Test payment flow with wrong network
- [ ] Test payment flow with expired authorization
- [ ] Verify transaction appears on Cronoscan
- [ ] Verify payment requirements format matches docs
