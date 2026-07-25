// SPDX-License-Identifier: MIT
pragma solidity 0.8.28;

import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import {SD59x18, sd59x18, add, sub, mul, div, exp, ln, unwrap} from "prb-math/SD59x18.sol";
import {IMakebookCampaign} from "./interfaces/IMakebookCampaign.sol";

/// @title MakebookPredictionMarket
/// @notice 针对单个 MakebookCampaign 清算结果的多结果 LMSR 预测市场（演示版）。
///         结果集 = 部署时枚举的全部 (quoteId, tierIndex) 清算档位 + 最后一个结果"流团"。
///         1 share = 1e18，猜中结果每 share 兑付 1 INJ（wei）。价格即隐含概率（1e18 = 100%）。
///
///         机制（Hanson LMSR）：
///           成本函数 C(q) = m + b·ln( Σ e^((q_i − m)/b) )，m = max(q)（max-subtraction 防溢出）
///           买入 shares 的成本 = C(q + Δ) − C(q)；卖出对称返还。
///           隐含概率 p_i = e^((q_i − m)/b) / Σ e^((q_j − m)/b)。
///
///         预言机零信任：resolve() 任何人可调；若 campaign 仍 Open 且已过 deadline，
///         先代为触发 campaign.settle()，再读 settlementFeasible / winningQuoteId /
///         winningTierIndex 映射到结果下标。失败 → 最后一个结果（流团）胜出。
///
///         运营方（operator = 部署者）注入种子金 ≥ b·ln(n)，最坏亏损即 b·ln(n)。
///         开奖 7 天后未领取的赢家份额作废，operator 可 sweep 余额（与演示口径一致）。
contract MakebookPredictionMarket is ReentrancyGuard {
    using {add, sub, mul, div, exp, ln, unwrap} for SD59x18;
    // ---------------------------------------------------------------------
    // 常量与不可变参数
    // ---------------------------------------------------------------------

    /// @dev 单笔交易份额上限，防呆（演示盘量级远小于此）。
    uint256 public constant MAX_SHARES_PER_TRADE = 1_000e18;
    /// @dev 开奖后领取窗口；过后 operator 可扫走余额（含未领取赔付）。
    uint64 public constant SWEEP_DELAY = 7 days;
    /// @dev 结果数上限（2 工厂 × 3 档 + 流团 = 7 已绰绰有余）。
    uint256 public constant MAX_OUTCOMES = 16;

    IMakebookCampaign public immutable campaign;
    /// @dev LMSR 流动性参数（wei）。b 越大价格越稳，运营方最坏亏损 b·ln(n) 越大。
    uint256 public immutable b;
    uint64 public immutable deadline;
    address public immutable operator;

    // ---------------------------------------------------------------------
    // 可变状态
    // ---------------------------------------------------------------------

    /// @dev 前 n-1 个结果的 (quoteId, tierIndex) 映射；第 n-1 个结果恒为"流团"。
    uint256[] public outcomeQuoteIds;
    uint256[] public outcomeTierIds;

    /// @dev 各结果净份额（LMSR 状态向量）。卖出必须有持仓背书，故恒 ≥ 0。
    int256[] public q;

    mapping(address => mapping(uint256 => uint256)) public sharesOf;

    bool public resolved;
    uint256 public winningOutcome;
    uint64 public resolvedAt;
    /// @dev 开奖瞬间定格的赢家结果总份额，用于 sweep 前核对。
    uint256 public winningSharesOutstanding;

    // ---------------------------------------------------------------------
    // 事件
    // ---------------------------------------------------------------------

    event Trade(
        address indexed trader,
        uint256 indexed outcome,
        bool isBuy,
        uint256 shares,
        uint256 amount, // 买入成本 / 卖出返还
        uint256 newPrice // 交易后该结果隐含概率（1e18 = 100%）
    );
    event Resolved(uint256 indexed winningOutcome, bool campaignSucceeded);
    event Redeemed(address indexed trader, uint256 shares, uint256 payout);
    event Swept(address indexed operator, uint256 amount);

    // ---------------------------------------------------------------------
    // 自定义错误
    // ---------------------------------------------------------------------

    error ZeroAddress();
    error InvalidB();
    error InvalidOutcomes();
    error InvalidOutcome();
    error ZeroShares();
    error TradeTooLarge();
    error TradingClosed();
    error InsufficientPayment();
    error SlippageExceeded();
    error InsufficientShares();
    error TransferFailed();
    error NotResolved();
    error DeadlineNotReached();
    error CampaignNotSettled();
    error OutcomeNotFound();
    error InsufficientSeed();
    error NothingToRedeem();
    error NotOperator();
    error SweepTooEarly();

    // ---------------------------------------------------------------------
    // 构造
    // ---------------------------------------------------------------------

    /// @param campaign_ 目标 MakebookCampaign 地址
    /// @param b_ LMSR 流动性参数（wei）
    /// @param quoteIds_ 各清算档位的 quoteId（长度 k，总结果数 n = k+1）
    /// @param tierIds_ 各清算档位的 tierIndex，与 quoteIds_ 等长
    /// @dev msg.value 为种子金，须 ≥ b·ln(n)（LMSR 最坏亏损上界）。
    constructor(address campaign_, uint256 b_, uint256[] memory quoteIds_, uint256[] memory tierIds_) payable {
        if (campaign_ == address(0)) revert ZeroAddress();
        if (b_ == 0) revert InvalidB();
        uint256 k = quoteIds_.length;
        if (k == 0 || k != tierIds_.length || k + 1 > MAX_OUTCOMES) revert InvalidOutcomes();

        campaign = IMakebookCampaign(campaign_);
        b = b_;
        deadline = IMakebookCampaign(campaign_).deadline();
        operator = msg.sender;

        uint256 n = k + 1;
        for (uint256 i = 0; i < k; i++) {
            outcomeQuoteIds.push(quoteIds_[i]);
            outcomeTierIds.push(tierIds_[i]);
            q.push(0);
        }
        q.push(0); // 流团

        uint256 seed = _minSeed(n);
        if (msg.value < seed) revert InsufficientSeed();
    }

    // ---------------------------------------------------------------------
    // 交易（仅 Open 且未封盘）
    // ---------------------------------------------------------------------

    /// @notice 买入某结果的份额。成本 = C(q+Δ) − C(q)，多付退回。
    /// @param outcome 结果下标（0..n-1，n-1 为流团）
    /// @param shares 买入份额（1e18 = 1 股 = 猜中兑 1 INJ）
    /// @param maxCost 滑点保护：成本超过则 revert
    function buy(uint256 outcome, uint256 shares, uint256 maxCost) external payable nonReentrant {
        _requireTradingOpen(outcome, shares);
        uint256 cost = calcBuyCost(outcome, shares);
        if (cost > maxCost) revert SlippageExceeded();
        if (msg.value < cost) revert InsufficientPayment();

        q[outcome] += int256(shares);
        sharesOf[msg.sender][outcome] += shares;

        uint256 refund = msg.value - cost;
        if (refund > 0) _send(msg.sender, refund);

        emit Trade(msg.sender, outcome, true, shares, cost, price(outcome));
    }

    /// @notice 卖出持仓份额，返还 = C(q) − C(q−Δ)。
    function sell(uint256 outcome, uint256 shares, uint256 minReturn) external nonReentrant {
        _requireTradingOpen(outcome, shares);
        if (sharesOf[msg.sender][outcome] < shares) revert InsufficientShares();
        uint256 ret = calcSellReturn(outcome, shares);
        if (ret < minReturn) revert SlippageExceeded();

        q[outcome] -= int256(shares);
        sharesOf[msg.sender][outcome] -= shares;

        _send(msg.sender, ret);

        emit Trade(msg.sender, outcome, false, shares, ret, price(outcome));
    }

    // ---------------------------------------------------------------------
    // 开奖与领取
    // ---------------------------------------------------------------------

    /// @notice 任何人可调；幂等。Open 且已过 deadline 时先代为触发 campaign.settle()。
    function resolve() external {
        if (resolved) return;

        uint8 st = campaign.state();
        if (st == 1) {
            // Open：须过 deadline，代为触发清算（settle 任何人可调）
            if (block.timestamp < deadline) revert DeadlineNotReached();
            try campaign.settle() {} catch {}
            st = campaign.state();
        }

        uint256 n = q.length;
        uint256 winning;
        if (st == 3) {
            winning = n - 1; // Failed → 流团
        } else if (st == 2 || st == 4) {
            // Succeeded / PaidOut：映射 (winningQuoteId, winningTierIndex)
            uint256 wq = campaign.winningQuoteId();
            uint256 wt = campaign.winningTierIndex();
            bool found;
            for (uint256 i = 0; i < n - 1; i++) {
                if (outcomeQuoteIds[i] == wq && outcomeTierIds[i] == wt) {
                    winning = i;
                    found = true;
                    break;
                }
            }
            if (!found) revert OutcomeNotFound();
        } else {
            revert CampaignNotSettled();
        }

        resolved = true;
        winningOutcome = winning;
        resolvedAt = uint64(block.timestamp);
        winningSharesOutstanding = uint256(q[winning]);

        emit Resolved(winning, st != 3);
    }

    /// @notice 赢家领取赔付：每 share 兑 1 INJ（wei），仅一次。
    function redeem() external nonReentrant {
        if (!resolved) revert NotResolved();
        uint256 shares = sharesOf[msg.sender][winningOutcome];
        if (shares == 0) revert NothingToRedeem();

        sharesOf[msg.sender][winningOutcome] = 0;
        winningSharesOutstanding -= shares;

        _send(msg.sender, shares);

        emit Redeemed(msg.sender, shares, shares);
    }

    /// @notice 开奖 7 天后 operator 扫走全部余额（含逾期未领赔付与种子金盈余）。
    function sweep() external nonReentrant {
        if (msg.sender != operator) revert NotOperator();
        if (!resolved) revert NotResolved();
        if (block.timestamp < resolvedAt + SWEEP_DELAY) revert SweepTooEarly();

        uint256 amount = address(this).balance;
        _send(operator, amount);

        emit Swept(operator, amount);
    }

    // ---------------------------------------------------------------------
    // 报价与概率（view）
    // ---------------------------------------------------------------------

    /// @notice 买入 shares 的瞬时成本（含滑点）。
    function calcBuyCost(uint256 outcome, uint256 shares) public view returns (uint256) {
        if (outcome >= q.length) revert InvalidOutcome();
        int256[] memory arr = _snapshot();
        uint256 before_ = _costOf(arr);
        arr[outcome] += int256(shares);
        uint256 after_ = _costOf(arr);
        return after_ - before_;
    }

    /// @notice 卖出 shares 的瞬时返还（含滑点）。
    function calcSellReturn(uint256 outcome, uint256 shares) public view returns (uint256) {
        if (outcome >= q.length) revert InvalidOutcome();
        if (int256(shares) > q[outcome]) revert InsufficientShares();
        int256[] memory arr = _snapshot();
        uint256 before_ = _costOf(arr);
        arr[outcome] -= int256(shares);
        uint256 after_ = _costOf(arr);
        return before_ - after_;
    }

    /// @notice 单结果隐含概率（1e18 = 100%）。
    function price(uint256 outcome) public view returns (uint256) {
        if (outcome >= q.length) revert InvalidOutcome();
        int256 m = _maxQ();
        uint256 sum;
        uint256 mine;
        for (uint256 i = 0; i < q.length; i++) {
            uint256 e = _expTerm(q[i], m);
            sum += e;
            if (i == outcome) mine = e;
        }
        return (mine * 1e18) / sum;
    }

    /// @notice 全部结果隐含概率。
    function prices() external view returns (uint256[] memory out) {
        uint256 n = q.length;
        out = new uint256[](n);
        int256 m = _maxQ();
        uint256[] memory exps = new uint256[](n);
        uint256 sum;
        for (uint256 i = 0; i < n; i++) {
            exps[i] = _expTerm(q[i], m);
            sum += exps[i];
        }
        for (uint256 i = 0; i < n; i++) {
            out[i] = (exps[i] * 1e18) / sum;
        }
    }

    function outcomesLength() external view returns (uint256) {
        return q.length;
    }

    /// @notice 部署所需最小种子金 b·ln(n)。
    function minSeed() external view returns (uint256) {
        return _minSeed(q.length);
    }

    // ---------------------------------------------------------------------
    // 内部：LMSR 数学（SD59x18 定点，max-subtraction）
    // ---------------------------------------------------------------------

    function _snapshot() internal view returns (int256[] memory arr) {
        uint256 n = q.length;
        arr = new int256[](n);
        for (uint256 i = 0; i < n; i++) {
            arr[i] = q[i];
        }
    }

    function _maxQ() internal view returns (int256 m) {
        m = q[0];
        for (uint256 i = 1; i < q.length; i++) {
            if (q[i] > m) m = q[i];
        }
    }

    /// @dev e^((q_i − m)/b)；恒 ≤ 0 的指数输入，输出 ∈ (0, 1e18]。
    function _expTerm(int256 qi, int256 m) internal view returns (uint256) {
        SD59x18 z = sd59x18(qi - m).div(sd59x18(int256(b)));
        return uint256(z.exp().unwrap());
    }

    /// @dev C(q) = m + b·ln(Σ e^((q_i − m)/b))，返回 wei（SD59x18  unwrap 恒 ≥ 0，
    ///      因为 Σ e^(·) ≥ 1 ⇒ ln ≥ 0 ⇒ C ≥ m ≥ 0（q 恒非负））。
    function _costOf(int256[] memory arr) internal view returns (uint256) {
        int256 m = arr[0];
        for (uint256 i = 1; i < arr.length; i++) {
            if (arr[i] > m) m = arr[i];
        }
        SD59x18 bsd = sd59x18(int256(b));
        SD59x18 sum = sd59x18(0);
        for (uint256 i = 0; i < arr.length; i++) {
            SD59x18 z = sd59x18(arr[i] - m).div(bsd);
            sum = sum.add(z.exp());
        }
        SD59x18 c = sd59x18(m).add(bsd.mul(sum.ln()));
        return uint256(c.unwrap());
    }

    function _minSeed(uint256 n) internal view returns (uint256) {
        return uint256(sd59x18(int256(b)).mul(sd59x18(int256(n * 1e18)).ln()).unwrap());
    }

    // ---------------------------------------------------------------------
    // 内部：杂项
    // ---------------------------------------------------------------------

    function _requireTradingOpen(uint256 outcome, uint256 shares) internal view {
        if (resolved || block.timestamp >= deadline) revert TradingClosed();
        if (outcome >= q.length) revert InvalidOutcome();
        if (shares == 0) revert ZeroShares();
        if (shares > MAX_SHARES_PER_TRADE) revert TradeTooLarge();
    }

    function _send(address to, uint256 amount) internal {
        (bool ok, ) = to.call{value: amount}("");
        if (!ok) revert TransferFailed();
    }

    /// @dev 拒收直接转账；种子金只能走构造。
    receive() external payable {
        revert InsufficientPayment();
    }
}
