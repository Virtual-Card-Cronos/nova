import { getContract } from "thirdweb";
import getClient from "./client";
import { chain } from "./chain";
import { policyABi } from "./abis";

// Use a placeholder address during build time when env var is not set
// The actual contract address will be used at runtime
const PLACEHOLDER_ADDRESS = "0x0000000000000000000000000000000000000000" as `0x${string}`;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let policyContractInstance: any = null;

export function getPolicyContract() {
  if (policyContractInstance) {
    return policyContractInstance;
  }
  
  const contractAddress = process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS;
  
  policyContractInstance = getContract({
    client: getClient(),
    chain,
    address: (contractAddress || PLACEHOLDER_ADDRESS) as `0x${string}`,
    abi: policyABi,
  });
  
  return policyContractInstance;
}

// For backwards compatibility - use getPolicyContract() for runtime access
export const policyContract = getPolicyContract;