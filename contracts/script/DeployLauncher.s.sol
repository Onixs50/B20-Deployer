// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

// Optional path for people using Base's Foundry fork (base-forge) instead of Remix.
// Requires the `base-std` package installed/remapped per Base's official docs
// (https://docs.base.org/get-started/launch-b20-token). Remix is the simpler
// path since it resolves the GitHub-URL imports in B20Launcher.sol directly.

import {Script, console} from "forge-std/Script.sol";

// If you've installed base-std and set up remappings, swap this for:
// import {B20Launcher} from "../B20Launcher.sol";

contract DeployLauncher is Script {
    function run() external returns (address launcher) {
        vm.startBroadcast();
        // launcher = address(new B20Launcher());
        vm.stopBroadcast();
        console.log("B20Launcher deployed at:", launcher);
    }
}
