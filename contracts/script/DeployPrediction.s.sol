// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {Script, console} from "forge-std/Script.sol";
import {MakebookCampaign} from "../src/MakebookCampaign.sol";
import {MakebookPredictionMarket} from "../src/MakebookPredictionMarket.sol";

/// @notice 部署某个 Campaign 的 LMSR 预测市场。私钥只存在本地环境，绝不写入仓库。
/// 必需环境变量：
///   PRIVATE_KEY        部署者私钥（0x 前缀）；该地址即市场 operator 与种子金来源
///   CAMPAIGN_ADDRESS   目标 MakebookCampaign 地址
/// 可选环境变量：
///   B_WEI              LMSR 流动性参数（默认 0.05 INJ）
///   SEED_WEI           种子金（默认 B_WEI × 2，覆盖 n ≤ 7 的 b·ln(n) 上界）
/// 结果集 = 链上实时枚举的全部 (quoteId, tierIndex) 档位 + 末尾"流团"。
/// 示例：
///   forge script script/DeployPrediction.s.sol --rpc-url injectiveEvm --broadcast --verify
contract DeployPredictionMarket is Script {
    function run() external returns (MakebookPredictionMarket market) {
        uint256 deployerKey = vm.envUint("PRIVATE_KEY");
        address campaignAddr = vm.envAddress("CAMPAIGN_ADDRESS");
        uint256 b = vm.envOr("B_WEI", uint256(0.05 ether));
        uint256 seed = vm.envOr("SEED_WEI", b * 2);

        MakebookCampaign campaign = MakebookCampaign(payable(campaignAddr));

        // 链上枚举全部报价档位（eth_call，不消耗 gas）
        (uint256[] memory qIds, uint256[] memory tIds) = _enumerateTiers(campaign);
        uint256 n = qIds.length + 1;
        require(n >= 2 && n <= 16, "bad outcome count");

        console.log("campaign:", campaignAddr);
        console.log("tier outcomes:", qIds.length);
        console.log("total outcomes (incl. fail):", n);
        console.log("b (wei):", b);
        console.log("seed (wei):", seed);

        vm.startBroadcast(deployerKey);
        market = new MakebookPredictionMarket{value: seed}(campaignAddr, b, qIds, tIds);
        vm.stopBroadcast();

        console.log("MakebookPredictionMarket deployed at:", address(market));
        console.log("operator:", market.operator());
        console.log("deadline:", market.deadline());
        console.log("minSeed was:", market.minSeed());
    }

    function _enumerateTiers(MakebookCampaign campaign)
        internal
        view
        returns (uint256[] memory qIds, uint256[] memory tIds)
    {
        uint256 nQuotes = campaign.quotesLength();
        require(nQuotes > 0, "campaign has no quotes");
        uint256 k;
        for (uint256 i = 0; i < nQuotes; i++) {
            k += campaign.getQuote(i).tiers.length;
        }
        qIds = new uint256[](k);
        tIds = new uint256[](k);
        uint256 idx;
        for (uint256 i = 0; i < nQuotes; i++) {
            uint256 nTiers = campaign.getQuote(i).tiers.length;
            for (uint256 t = 0; t < nTiers; t++) {
                qIds[idx] = i;
                tIds[idx] = t;
                idx++;
            }
        }
    }
}
