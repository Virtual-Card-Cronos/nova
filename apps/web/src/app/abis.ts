
export const policyABi =[
    {
      name: 'checkPolicy',
      type: 'function',
      stateMutability: 'view',
      inputs: [
        { name: 'agent', type: 'address' },
        { name: 'amount', type: 'uint256' },
      ],
      outputs: [{ type: 'bool' }],
    },
    {
      name: 'getSpendingLimit',
      type: 'function',
      stateMutability: 'view',
      inputs: [{ name: 'agent', type: 'address' }],
      outputs: [{ type: 'uint256' }],
    },
  ]  as const