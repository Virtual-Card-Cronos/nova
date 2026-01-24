/** @type {import('next').NextConfig} */
const path = require('path')
const webpack = require('webpack')

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
        // Also ignore problematic ox package exports
        'ox/erc8010': false,
        'ox/tempo': false,
        'ox/erc6492': false,
      }
    } else {
      // Server-side: also ignore problematic ox package exports
      config.resolve.alias = {
        ...config.resolve.alias,
        'ox/erc8010': false,
        'ox/tempo': false,
        'ox/erc6492': false,
      }
    }

    // Replace problematic thirdweb x402 imports with stubs
    // We use @crypto.com/facilitator-client instead
    config.plugins = config.plugins || []
    
    // Replace x402 module imports from thirdweb
    const stubPath = path.resolve(__dirname, 'src/lib/x402-stub.js')
    config.plugins.push(
      new webpack.NormalModuleReplacementPlugin(
        /thirdweb\/dist\/esm\/.*\/x402/,
        stubPath
      )
    )

    return config
  },
  // Add empty turbopack config to silence error (we're using webpack)
  turbopack: {},
}

module.exports = nextConfig