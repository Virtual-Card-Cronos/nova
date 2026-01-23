// Stub module to replace thirdweb's x402 imports
// We use @crypto.com/facilitator-client instead
// This prevents thirdweb from pulling in broken x402 dependencies

// ESM exports to match thirdweb's ESM module format
export function useFetchWithPayment() {
  return {}
}

export function PaymentErrorModal() {
  return null
}

export function wrapFetchWithPayment(fetch) {
  return fetch
}

export default {}
