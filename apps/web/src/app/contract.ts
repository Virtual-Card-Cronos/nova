import { getContract } from "thirdweb";
import getClient from "./client";
import { chain } from "./chain";
import { policyABi } from "./abis";

type PolicyContractType = ReturnType<typeof getContract<typeof policyABi>> | null;

let policyContractInstance: PolicyContractType = null;

export function getPolicyContract() {
  if (policyContractInstance) {
    return policyContractInstance;
  }

  const address = process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS || process.env.POLICY_CONTRACT_ADDRESS;
  
  if (!address) {
    // Return null for build-time - will fail gracefully at runtime
    console.warn('Policy contract address not set during build');
    return null;
  }

  try {
    policyContractInstance = getContract({
      client: getClient(),
      chain,
      address: address as `0x${string}`,
      abi: policyABi,
    });
    return policyContractInstance;
  } catch (error) {
    console.warn('Failed to create policy contract during build:', error);
    return null;
  }
}

// Export for backward compatibility - but prefer using getPolicyContract()
export const policyContract = {
  get instance() {
    return getPolicyContract();
  }
};