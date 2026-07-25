// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MakebookCampaign} from "../src/MakebookCampaign.sol";

/// @notice 部署脚本：从环境变量读取参数（私钥只存在本地环境，绝不写入仓库）。
/// 必需环境变量：
///   PRIVATE_KEY        部署者私钥（0x 前缀）
///   OPERATOR_ADDRESS   Campaign operator 地址
///   CREATOR_ADDRESS    P1 品牌应收唯一领取方
///   PLATFORM_ADDRESS   P1 平台费唯一领取方（feeRecipient，≠ operator）
///   MANIFEST_HASH      bytes32，确认版 manifest 的 keccak256（lib/schema/canonicalize 计算）
///   MANIFEST_URI       manifest JSON 的链下 URI（如仓库静态链接）
///   DEADLINE           uint64 Unix 时间戳
///   MARGIN_BPS         uint32 零售加价系数（如 2500 = ×1.25，上限 5000）
///   FEE_BPS            uint32 平台费率（如 200 = 2%，须 ≤ MARGIN_BPS）
/// 示例见 contracts/README.md。
contract DeployMakebookCampaign is Script {
    function run() external returns (MakebookCampaign campaign) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address operator = vm.envAddress("OPERATOR_ADDRESS");
        address creator = vm.envAddress("CREATOR_ADDRESS");
        address feeRecipient = vm.envAddress("PLATFORM_ADDRESS");
        bytes32 manifestHash = vm.envBytes32("MANIFEST_HASH");
        string memory manifestURI = vm.envString("MANIFEST_URI");
        uint64 deadline = uint64(vm.envUint("DEADLINE"));
        uint32 marginBps = uint32(vm.envUint("MARGIN_BPS"));
        uint32 feeBps = uint32(vm.envUint("FEE_BPS"));

        vm.startBroadcast(deployerKey);
        campaign = new MakebookCampaign(operator, creator, feeRecipient, manifestHash, manifestURI, deadline, marginBps, feeBps);
        vm.stopBroadcast();

        console.log("MakebookCampaign deployed at:", address(campaign));
        console.log("operator:", operator);
        console.log("creator:", creator);
        console.log("feeRecipient:", feeRecipient);
        console.log("manifestHash:");
        console.logBytes32(manifestHash);
        console.log("deadline:", deadline);
        console.log("marginBps:", marginBps);
        console.log("feeBps:", feeBps);
    }
}
