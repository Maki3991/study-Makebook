#!/usr/bin/env bash
# MAKEBOOK 证据页生成器（spec 004 第 4 节 / PRD 18.1）
# 从 deployments 状态文件 + receipts/*.jsonl 生成 Markdown 证据清单。
#
# 用法：
#   contracts/script/render-evidence.sh <anvil|testnet> [输出文件]
# 默认输出 docs/evidence-auto.md（独立文件，随重跑覆盖）；docs/EVIDENCE.md 为人工策展的
# 当前有效锚点，本脚本不再写入。anvil 冒烟测试请显式给输出路径，避免污染提交材料。

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
JQ="$(command -v jq)"
NETWORK="${1:?用法: render-evidence.sh <anvil|testnet> [输出文件]}"
OUT="${2:-$ROOT/docs/evidence-auto.md}"

case "$NETWORK" in
  anvil) STATE_FILE="$ROOT/deployments/state.anvil.json" ;;
  testnet) STATE_FILE="$ROOT/deployments/injective-testnet.json" ;;
  *) echo "未知网络: $NETWORK" >&2; exit 1 ;;
esac

[[ -f "$STATE_FILE" ]] || { echo "找不到 ${STATE_FILE}（先跑 demo-pipeline.sh $NETWORK up）" >&2; exit 1; }
shopt -s nullglob
RECEIPTS=("$ROOT"/deployments/receipts/"$NETWORK"-*.jsonl)
(( ${#RECEIPTS[@]} > 0 )) || { echo "没有 $NETWORK 的 receipts 文件" >&2; exit 1; }

EXPLORER="$("$JQ" -r '.explorer' "$STATE_FILE" | sed 's:/$::')"

{
  echo "# MAKEBOOK 链上证据清单（${NETWORK}）"
  echo
  echo "生成时间：$(date -u +%Y-%m-%dT%H:%M:%SZ) ・ 数据源：deployments 状态文件 + receipts JSONL（demo-pipeline.sh 每次运行自动记录）"
  echo
  echo "## Campaign 合约"
  echo
  echo "| Campaign | 地址 | manifestHash | deadline |"
  echo "|---|---|---|---|"
  for c in success failure; do
    addr="$("$JQ" -r ".$c.address" "$STATE_FILE")"
    mhash="$("$JQ" -r ".$c.manifestHash" "$STATE_FILE")"
    dl="$("$JQ" -r ".$c.deadline" "$STATE_FILE")"
    echo "| $c | [$addr]($EXPLORER/address/$addr) | \`$mhash\` | $dl |"
  done
  echo
  echo "manifestURI：$("$JQ" -r '.success.manifestURI' "$STATE_FILE")"
  echo
  echo "## 交易记录"
  echo
  echo "| Run | Campaign | 操作 | 发起方 | 交易 |"
  echo "|---|---|---|---|---|"
  cat "${RECEIPTS[@]}" | "$JQ" -r \
    --arg explorer "$EXPLORER" \
    '[.runId, .campaign, .action, .actor, ("[" + .txHash[0:10] + "…](" + $explorer + "/tx/" + .txHash + ")")] | "| " + join(" | ") + " |"'
} > "$OUT"

echo "证据清单已生成: $OUT" >&2
