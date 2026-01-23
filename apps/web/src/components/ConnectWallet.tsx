/**
 * ConnectWallet Component (thirdweb v5)
 * Matches the header design from the UI designs
 */

'use client'

import { ConnectButton } from "thirdweb/react";
import { chain } from "@/app/chain";
import getClient from "@/app/client";

export function ConnectWallet() {
  return (
    <div className="[&_button]:bg-primary [&_button]:hover:bg-primary/90 [&_button]:text-white [&_button]:px-5 [&_button]:py-2 [&_button]:rounded-lg [&_button]:text-sm [&_button]:font-bold [&_button]:transition-all [&_button]:flex [&_button]:items-center [&_button]:gap-2">
      <ConnectButton
        client={getClient()}
        chain={chain}
        connectModal={{
          title: "Connect to NovaAgent",
          size: "compact",
          welcomeScreen: {
            title: "Welcome to NovaAgent",
            subtitle: "Connect your wallet to start shopping with AI assistance",
          },
        }}
        theme="dark"
        supportedTokens={{338:[
          {
            address: '0xc01efAaF7C5C61bEbFAeb358E1161b537b8bC0e0', // token contract address
            name: 'devUSDC.e',
            symbol: 'devUSDC.e',
        },
        ]

        }}
      />
    </div>
  )
}