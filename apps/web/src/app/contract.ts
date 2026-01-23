import { getContract } from "thirdweb";
import getClient from "./client";
import { chain } from "./chain";
import { policyABi } from "./abis";

// Only create contract if address is valid
const policyAddress = process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS || process.env.POLICY_CONTRACT_ADDRESS

export const policyContract = policyAddress && policyAddress.startsWith('0x') && policyAddress.length === 42
  ? getContract({
      client: getClient(),
      chain,
      address: policyAddress as `0x${string}`,
      abi: policyABi,
    })
  : null;