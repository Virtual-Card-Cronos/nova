// Stub module to replace thirdweb's x402 imports
// We use @crypto.com/facilitator-client instead
// This prevents thirdweb from pulling in broken x402 dependencies

module.exports = {
  default: {},
  useFetchWithPayment: () => ({}),
  PaymentErrorModal: () => null,
  wrapFetchWithPayment: (fetch) => fetch,
  // Export everything to satisfy any import pattern
  ...Object.fromEntries(
    ['useFetchWithPayment', 'PaymentErrorModal', 'wrapFetchWithPayment'].map(key => [key, () => {}])
  )
}
