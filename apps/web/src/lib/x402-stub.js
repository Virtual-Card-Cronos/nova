// Stub module to replace thirdweb's x402 imports
// We use @crypto.com/facilitator-client instead
// This prevents thirdweb from pulling in broken x402 dependencies

// Use ESM exports to match thirdweb's module format
export const useFetchWithPayment = () => ({
  fetchWithPayment: async () => ({}),
  isPending: false,
  error: null,
  data: null,
});

export const PaymentErrorModal = () => null;

export const wrapFetchWithPayment = (fetch) => fetch;

export default {};
