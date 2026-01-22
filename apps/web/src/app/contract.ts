import { getContract } from "thirdweb";
import getClient from "./client";
import { chain } from "./chain";
import { policyABi } from "./abis";

export const policyContract = getContract({
  client: getClient(),
  chain,
  address: process.env.NEXT_PUBLIC_POLICY_CONTRACT_ADDRESS as `0x${string}`,
  abi: policyABi,
});