/** @type {import('next').NextConfig} */
const path = require('path')
const webpack = require('webpack')

// Resolve paths relative to the monorepo root (two levels up from apps/web)
const rootNodeModules = path.resolve(__dirname, '../../node_modules')

const nextConfig = {
  transpilePackages: ["thirdweb"],
  // Use webpack for path alias resolution (Turbopack doesn't support custom aliases yet)
  webpack: (config, { isServer }) => {
    // Exclude @crypto.com/facilitator-client from client bundle
    // It uses Node.js crypto and should only be used in API routes
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@crypto.com/facilitator-client': false,
      }
    }

    // Replace problematic thirdweb x402 imports with stubs
    // We use @crypto.com/facilitator-client instead
    const x402StubPath = path.resolve(__dirname, 'src/lib/x402-stub.js')
    
    // Stub out the specific x402 modules that have broken exports
    // Paths are relative to root node_modules since npm hoists packages
    config.resolve.alias = {
      ...config.resolve.alias,
      // Stub the useFetchWithPayment hook (has broken exports in thirdweb 5.117.2)
      [path.join(rootNodeModules, 'thirdweb/dist/esm/react/web/hooks/x402/useFetchWithPayment.js')]: x402StubPath,
      [path.join(rootNodeModules, 'thirdweb/dist/esm/react/core/hooks/x402/useFetchWithPaymentCore.js')]: x402StubPath,
      [path.join(rootNodeModules, 'thirdweb/dist/esm/react/web/ui/x402/PaymentErrorModal.js')]: x402StubPath,
      [path.join(rootNodeModules, 'thirdweb/dist/esm/react/web/ui/x402/SignInRequiredModal.js')]: x402StubPath,
      [path.join(rootNodeModules, 'thirdweb/dist/esm/x402/fetchWithPayment.js')]: x402StubPath,
      [path.join(rootNodeModules, 'thirdweb/dist/esm/x402/schemas.js')]: x402StubPath,
      // Also ignore problematic ox package exports
      'ox/erc8010': false,
      'ox/tempo': false,
      'ox/erc6492': false,
      'ox/BlockOverrides': false,
      'ox/AbiConstructor': false,
      'ox/AbiFunction': false,
    }

    return config
  },
  // Add empty turbopack config to silence error (we're using webpack)
  turbopack: {},
}

module.exports = nextConfig