// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Deploys RHFactory once per network (Robinhood Chain mainnet, chain id 4663;
// testnet, chain id 46630). Requires OpenZeppelin Contracts installed:
//   forge install OpenZeppelin/openzeppelin-contracts
// and a remapping in foundry.toml / remappings.txt:
//   @openzeppelin/contracts/=lib/openzeppelin-contracts/contracts/

import {Script, console} from "forge-std/Script.sol";
import {RHFactory} from "../robinhood/RHFactory.sol";

contract DeployRHFactory is Script {
    function run() external returns (address factory) {
        vm.startBroadcast();
        factory = address(new RHFactory());
        vm.stopBroadcast();
        console.log("RHFactory deployed at:", factory);
    }
}

// Example:
//   forge script contracts/script/DeployRHFactory.s.sol:DeployRHFactory \
//     --rpc-url https://rpc.mainnet.chain.robinhood.com \
//     --chain-id 4663 --private-key $PRIVATE_KEY --broadcast \
//     --verify --verifier blockscout --verifier-url https://robinhoodchain.blockscout.com/api/
