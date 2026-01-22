import { defineChain } from "thirdweb/chains";

// Cronos Testnet (Chain ID: 338)
export const chain = defineChain({
  id: 338,
  name: "Cronos Testnet",
  nativeCurrency: {
    name: "TCRO",
    symbol: "TCRO",
    decimals: 18,
  },
  rpc: process.env.NEXT_PUBLIC_CRONOS_RPC || "https://evm-t3.cronos.org",
  blockExplorers: [
    {
      name: "Cronoscan Testnet",
      url: "https://testnet.cronoscan.com",
    },
  ],
  testnet: true,
})
