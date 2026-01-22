// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import {Ownable2Step} from "@openzeppelin/contracts/access/Ownable2Step.sol";

/// @title AgentPolicy - Smart Contract Policy Engine for AI Agents
/// @notice Implements spending limits and authorization controls for AI agents in the Aegis Pattern
/// @dev Gas-optimized contract using custom errors and efficient storage patterns
contract AgentPolicy is Ownable2Step {
    /// @notice Custom errors for gas-efficient revert messages
    error LimitExceeded();
    error InvalidAgent();
    error InvalidLimit();

    /// @notice Stores spending limits for each agent address
    /// @dev Uses uint256 for limits to support large amounts and future-proofing
    mapping(address => uint256) public spendingLimits;

    /// @notice Emitted when an agent's spending limit is updated
    /// @param agent The agent address whose limit was changed
    /// @param oldLimit The previous spending limit
    /// @param newLimit The new spending limit
    event SpendingLimitUpdated(address indexed agent, uint256 oldLimit, uint256 newLimit);

    /// @notice Constructor initializes the contract with the deployer as owner
    constructor() Ownable2Step() {}

    /// @notice Checks if an agent can spend the specified amount
    /// @dev View function called by backend before issuing x402 challenges
    /// @param agent The agent address to check
    /// @param amount The amount the agent wants to spend
    /// @return True if the spending is allowed, false if limit exceeded
    function checkPolicy(address agent, uint256 amount) external view returns (bool) {
        if (agent == address(0)) revert InvalidAgent();
        return spendingLimits[agent] >= amount;
    }

    /// @notice Sets the spending limit for a specific agent
    /// @dev Only callable by the contract owner
    /// @param agent The agent address to set the limit for
    /// @param limit The new spending limit (use 0 to disable agent)
    function setSpendingLimit(address agent, uint256 limit) external onlyOwner {
        if (agent == address(0)) revert InvalidAgent();

        uint256 oldLimit = spendingLimits[agent];
        spendingLimits[agent] = limit;

        emit SpendingLimitUpdated(agent, oldLimit, limit);
    }

    /// @notice Gets the current spending limit for an agent
    /// @param agent The agent address to query
    /// @return The current spending limit
    function getSpendingLimit(address agent) external view returns (uint256) {
        return spendingLimits[agent];
    }

    /// @notice Batch sets spending limits for multiple agents
    /// @dev Gas-efficient for setting up multiple agents at once
    /// @param agents Array of agent addresses
    /// @param limits Array of corresponding spending limits
    function batchSetLimits(address[] calldata agents, uint256[] calldata limits) external onlyOwner {
        uint256 length = agents.length;
        if (length != limits.length) revert InvalidLimit();

        for (uint256 i = 0; i < length; ) {
            address agent = agents[i];
            if (agent == address(0)) revert InvalidAgent();

            uint256 oldLimit = spendingLimits[agent];
            uint256 newLimit = limits[i];

            spendingLimits[agent] = newLimit;
            emit SpendingLimitUpdated(agent, oldLimit, newLimit);

            unchecked { ++i; }
        }
    }

    /// @notice Removes an agent's spending limit (sets to 0)
    /// @param agent The agent address to disable
    function removeAgent(address agent) external onlyOwner {
        if (agent == address(0)) revert InvalidAgent();

        uint256 oldLimit = spendingLimits[agent];
        spendingLimits[agent] = 0;

        emit SpendingLimitUpdated(agent, oldLimit, 0);
    }
}