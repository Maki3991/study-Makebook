// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MakebookCampaign} from "../src/MakebookCampaign.sol";

/// @notice 部署脚本：从环境变量读取参数（私钥只存在本地环境，绝不写入仓库）。
/// 必需环境变量：
///   PRIVATE_KEY        部署者私钥（0x 前缀）
///   OPERATOR_ADDRESS   Campaign operator 地址
///   MANIFEST_HASH      bytes32，确认版 manifest 的 keccak256（lib/schema/canonicalize 计算）
///   MANIFEST_URI       manifest JSON 的链下 URI（如仓库静态链接）
///   DEADLINE           uint64 Unix 时间戳
/// 示例见 contracts/README.md。
contract DeployMakebookCampaign is Script {
    function run() external returns (MakebookCampaign campaign) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        bytes32 manifestHash = vm.envBytes32("MANIFEST_HASH");
        string memory manifestURI = vm.envString("MANIFEST_URI");
        uint64 deadline = uint64(vm.envUint("DEADLINE"));

        vm.startBroadcast(deployerKey);
        campaign = new MakebookCampaign(operator, manifestHash, manifestURI, deadline);
        vm.stopBroadcast();

        console.log("MakebookCampaign deployed at:", address(campaign));
        console.log("operator:", operator);
        console.log("manifestHash:");
        console.logBytes32(manifestHash);
        console.log("deadline:", deadline);
    }
}
