// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import { MonBeastArena } from "../contracts/src/MonBeastArena.sol";

contract DeployMonBeastArena {
    function run() external returns (MonBeastArena) {
        return new MonBeastArena(msg.sender, msg.sender);
    }
}
