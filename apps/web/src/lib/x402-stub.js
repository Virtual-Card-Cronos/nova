// Stub module to replace thirdweb's x402 imports
// We use @crypto.com/facilitator-client instead
// This prevents thirdweb from pulling in broken x402 dependencies

// ESM stub exports for useFetchWithPayment and related x402 modules
export function useFetchWithPayment() {
  return {
    fetchWithPayment: async () => ({}),
    isPending: false,
    error: null,
    data: null,
  };
}

export function useFetchWithPaymentCore() {
  return {
    fetchWithPayment: async () => ({}),
    isPending: false,
    error: null,
    data: null,
  };
}

export function PaymentErrorModal() {
  return null;
}

export function SignInRequiredModal() {
  return null;
}

export function wrapFetchWithPayment(fetch) {
  return fetch;
}

// Stub for x402/schemas.js
export const RequestedPaymentRequirementsSchema = {
  parse: (x) => x,
};
export function extractEvmChainId() { return null; }
export function networkToCaip2ChainId() { return null; }

// Default export for modules that import the whole module
export default {
  useFetchWithPayment,
  useFetchWithPaymentCore,
  PaymentErrorModal,
  SignInRequiredModal,
  wrapFetchWithPayment,
  RequestedPaymentRequirementsSchema,
  extractEvmChainId,
  networkToCaip2ChainId,
};
