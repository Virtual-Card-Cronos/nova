// Stub module to replace thirdweb's x402 imports
// We use @crypto.com/facilitator-client instead
// This prevents thirdweb from pulling in broken x402 dependencies

// ESM named exports to satisfy webpack's module resolution
export function useFetchWithPayment() {
  return {}
}

export function PaymentErrorModal() {
  return null
}

export function wrapFetchWithPayment(fetch) {
  return fetch
}

// Default export for compatibility
export default {
  useFetchWithPayment,
  PaymentErrorModal,
  wrapFetchWithPayment,
}
