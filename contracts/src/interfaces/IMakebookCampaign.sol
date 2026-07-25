// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

/// @notice MakebookPredictionMarket 只读/触发所需的最小 Campaign 接口。
/// @dev state() 的 enum 在 ABI 层即 uint8：Draft=0 Open=1 Succeeded=2 Failed=3 PaidOut=4。
interface IMakebookCampaign {
    function state() external view returns (uint8);
    function deadline() external view returns (uint64);
    function settle() external;
    function settlementFeasible() external view returns (bool);
    function winningQuoteId() external view returns (uint256);
    function winningTierIndex() external view returns (uint256);
}
