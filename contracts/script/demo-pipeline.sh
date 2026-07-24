#!/usr/bin/env bash
# MAKEBOOK demo 部署流水线（PRD 18.1 / spec 004 / docs/DEMO_RUNBOOK.md）
#
# 用法：
#   contracts/script/demo-pipeline.sh <anvil|testnet> up       部署两套 Campaign → 登记/报价/开盘/下单 → 回填地址（testnet 附 verify）
#   contracts/script/demo-pipeline.sh <anvil|testnet> settle   对两套 Campaign 触发 settle（anvil 自动时间旅行到 deadline 后）
#   contracts/script/demo-pipeline.sh <anvil|testnet> claims   成功线：5 buyer 退差额/落选款 + Loom 领应收；失败线：2 buyer 全额退款
#   contracts/script/demo-pipeline.sh <anvil|testnet> status   只读检查两套 Campaign 的 state / orders / previewSettlement
#   contracts/script/demo-pipeline.sh <anvil|testnet> all      up + settle + claims（完整排练）
#
# 私钥只从仓库根目录 .env 读取（.gitignore 已覆盖），绝不写入脚本、日志或仓库。
# 每次运行生成 deployments/receipts/<network>-<runId>.jsonl 作为证据记录。

set -euo pipefail

# ---------------------------------------------------------------- 基础

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORGE="$(command -v forge || echo "$HOME/.foundry/bin/forge")"
CAST="$(command -v cast || echo "$HOME/.foundry/bin/cast")"
JQ="$(command -v jq)"

NETWORK="${1:?用法: demo-pipeline.sh <anvil|testnet> <up|settle|claims|status|all>}"
PHASE="${2:?用法: demo-pipeline.sh <anvil|testnet> <up|settle|claims|status|all>}"

case "$NETWORK" in
  anvil)
    RPC_URL="${ANVIL_RPC:-http://127.0.0.1:8545}"
    GAS_FLAGS=(--legacy)
    STATE_FILE="$ROOT/deployments/state.anvil.json"
    NETWORK_LABEL="anvilLocal"
    ;;
  testnet)
    RPC_URL="${INJ_RPC:-https://k8s.testnet.json-rpc.injective.network/}"
    GAS_FLAGS=(--legacy --gas-price 160000000 --gas-limit 2000000)
    STATE_FILE="$ROOT/deployments/injective-testnet.json"
    NETWORK_LABEL="injectiveEvmTestnet"
    ;;
  *) echo "未知网络: $NETWORK（应为 anvil 或 testnet）" >&2; exit 1 ;;
esac

# 加载 .env（若存在）
if [[ -f "$ROOT/.env" ]]; then set -a; source "$ROOT/.env"; set +a; fi

: "${MANIFEST_HASH:?需要在 .env 配置 MANIFEST_HASH（lib/schema 锚点值）}"
: "${MANIFEST_URI:?需要在 .env 配置 MANIFEST_URI（manifest JSON 的公开 URL）}"

if [[ -z "${DEADLINE:-}" ]]; then
  if [[ "$NETWORK" == "anvil" ]]; then
    DEADLINE=$(( $(date +%s) + 86400 ))
    echo "anvil 默认 DEADLINE=now+24h（${DEADLINE}）"
  else
    echo "testnet 必须在 .env 配置 DEADLINE（uint64 秒，部署后不可改！）" >&2; exit 1
  fi
fi

RUN_ID="$(date +%Y%m%d-%H%M%S)"
RECEIPTS_DIR="$ROOT/deployments/receipts"
RECEIPTS="$RECEIPTS_DIR/$NETWORK-$RUN_ID.jsonl"
mkdir -p "$RECEIPTS_DIR"

log() { echo "[$(date +%H:%M:%S)] $*" >&2; }

# 记录一条证据：{runId, network, campaign, action, actor, contract, txHash}
record() {
  local campaign="$1" action="$2" actor="$3" contract="$4" txhash="$5"
  "$JQ" -cn \
    --arg runId "$RUN_ID" --arg network "$NETWORK" --arg campaign "$campaign" \
    --arg action "$action" --arg actor "$actor" --arg contract "$contract" \
    --arg txHash "$txhash" --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
    '{runId:$runId,network:$network,campaign:$campaign,action:$action,actor:$actor,contract:$contract,txHash:$txHash,ts:$ts}' \
    >> "$RECEIPTS"
}

addr_of() { "$CAST" wallet address --private-key "$1"; }

# send <campaign> <actorLabel> <privateKey> <contract> <sig> [args...] [--value Xether]
send() {
  local campaign="$1" actor="$2" key="$3" contract="$4" sig="$5"; shift 5
  local out tx
  out="$("$CAST" send "$contract" "$sig" "$@" \
    --private-key "$key" --rpc-url "$RPC_URL" "${GAS_FLAGS[@]}" --json)"
  tx="$("$JQ" -r '.transactionHash' <<<"$out")"
  local status
  status="$("$JQ" -r '.status' <<<"$out")"
  if [[ "$status" != "0x1" && "$status" != "1" ]]; then
    echo "!! ${campaign} 交易失败（${sig}）: ${tx}" >&2; return 1
  fi
  record "$campaign" "$sig" "$actor" "$contract" "$tx"
  log "$campaign: $sig → $tx"
}

# ---------------------------------------------------------------- 部署与开盘

deploy_campaign() { # <label> → stdout: 合约地址
  local label="$1" out addr tx
  out="$(cd "$ROOT/contracts" && "$FORGE" create \
    src/MakebookCampaign.sol:MakebookCampaign \
    --broadcast \
    --rpc-url "$RPC_URL" --private-key "$OPERATOR_KEY" "${GAS_FLAGS[@]}" \
    --constructor-args "$OPERATOR_ADDR" "$MANIFEST_HASH" "$MANIFEST_URI" "$DEADLINE")"
  addr="$(grep -oE 'Deployed to: 0x[0-9a-fA-F]+' <<<"$out" | awk '{print $3}')"
  tx="$(grep -oE 'Transaction hash: 0x[0-9a-fA-F]+' <<<"$out" | awk '{print $3}')"
  [[ -n "$addr" && -n "$tx" ]] || { echo "!! 部署输出解析失败: $out" >&2; return 1; }
  record "$label" "deploy(operator=$OPERATOR_ADDR,manifestHash=$MANIFEST_HASH,deadline=$DEADLINE)" "operator" "$addr" "$tx"
  log "$label: 部署于 $addr (tx $tx)"
  echo "$addr"
}

setup_campaign() { # <label> <addr>
  local label="$1" addr="$2"
  send "$label" "operator" "$OPERATOR_KEY" "$addr" "registerFactory(address,bytes32)" "$NORTH_ADDR" "$NORTH_PROFILE_HASH"
  send "$label" "operator" "$OPERATOR_KEY" "$addr" "registerFactory(address,bytes32)" "$LOOM_ADDR" "$LOOM_PROFILE_HASH"
  send "$label" "north" "$NORTH_KEY" "$addr" "submitQuote(bytes32,(uint32,uint256)[])" "$NORTH_QUOTE_HASH" "[(3,$NORTH_PRICE_WEI)]"
  send "$label" "loom" "$LOOM_KEY" "$addr" "submitQuote(bytes32,(uint32,uint256)[])" "$LOOM_QUOTE_HASH" "[(3,$LOOM_PRICE_WEI)]"
  send "$label" "operator" "$OPERATOR_KEY" "$addr" "openCampaign()"
}

place_order() { # <label> <addr> <buyerLabel> <key> <priceEther>
  local label="$1" addr="$2" buyer="$3" key="$4" price="$5"
  local wei; wei="$("$CAST" --to-wei "$price" ether)"
  send "$label" "$buyer" "$key" "$addr" "placeOrder(bytes32,uint256)" "$MANIFEST_HASH" "$wei" --value "${price}ether"
}

up() {
  log "=== ${NETWORK} up：部署两套 Campaign（deadline=${DEADLINE}）==="
  SUCCESS_ADDR="$(deploy_campaign success)"
  FAILURE_ADDR="$(deploy_campaign failure)"

  setup_campaign success "$SUCCESS_ADDR"
  setup_campaign failure "$FAILURE_ADDR"

  # 成功线：A–E 五单（fixtures/success.json）
  place_order success "$SUCCESS_ADDR" buyerA "$BUYER_A_KEY" 0.026
  place_order success "$SUCCESS_ADDR" buyerB "$BUYER_B_KEY" 0.024
  place_order success "$SUCCESS_ADDR" buyerC "$BUYER_C_KEY" 0.021
  place_order success "$SUCCESS_ADDR" buyerD "$BUYER_D_KEY" 0.019
  place_order success "$SUCCESS_ADDR" buyerE "$BUYER_E_KEY" 0.017
  # 失败线：A、B 两单（fixtures/failure.json，MOQ=3 达不到）
  place_order failure "$FAILURE_ADDR" buyerA "$BUYER_A_KEY" 0.026
  place_order failure "$FAILURE_ADDR" buyerB "$BUYER_B_KEY" 0.024

  # 回填状态文件（testnet 即 deployments/injective-testnet.json）
  "$JQ" -cn \
    --argjson chainId "$("$CAST" chain-id --rpc-url "$RPC_URL")" \
    --arg network "$NETWORK_LABEL" --arg rpc "$RPC_URL" \
    --arg explorer "${EXPLORER:-https://testnet.blockscout.injective.network/}" \
    --arg saddr "$SUCCESS_ADDR" --arg faddr "$FAILURE_ADDR" \
    --arg mhash "$MANIFEST_HASH" --arg muri "$MANIFEST_URI" \
    --argjson deadline "$DEADLINE" \
    '{chainId:$chainId,network:$network,rpc:$rpc,explorer:$explorer,
      success:{address:$saddr,manifestHash:$mhash,manifestURI:$muri,deadline:$deadline},
      failure:{address:$faddr,manifestHash:$mhash,manifestURI:$muri,deadline:$deadline}}' \
    > "$STATE_FILE.tmp" && mv "$STATE_FILE.tmp" "$STATE_FILE"
  log "地址已回填 $STATE_FILE"
  log "receipts: $RECEIPTS"

  if [[ "$NETWORK" == "testnet" ]]; then
    verify_contract "$SUCCESS_ADDR" || log "verify success 失败（可稍后重试：$0 testnet verify）"
    verify_contract "$FAILURE_ADDR" || log "verify failure 失败（可稍后重试：$0 testnet verify）"
  fi
}

verify_contract() { # <addr>
  local addr="$1" args
  args="$("$CAST" abi-encode "constructor(address,bytes32,string,uint64)" \
    "$OPERATOR_ADDR" "$MANIFEST_HASH" "$MANIFEST_URI" "$DEADLINE")"
  (cd "$ROOT/contracts" && "$FORGE" verify-contract "$addr" \
    src/MakebookCampaign.sol:MakebookCampaign \
    --chain-id 1439 --verifier blockscout \
    --verifier-url 'https://testnet.blockscout-api.injective.network/api/' \
    --constructor-args "$args") && log "verify 通过: $addr"
}

# ---------------------------------------------------------------- settle / claims / status

require_state() {
  [[ -f "$STATE_FILE" ]] || { echo "找不到 $STATE_FILE，先跑 up" >&2; exit 1; }
  SUCCESS_ADDR="$("$JQ" -r '.success.address' "$STATE_FILE")"
  FAILURE_ADDR="$("$JQ" -r '.failure.address' "$STATE_FILE")"
}

settle_one() { # <label> <addr>
  local label="$1" addr="$2"
  if [[ "$NETWORK" == "anvil" ]]; then
    local dl now
    dl="$("$CAST" call "$addr" "deadline()(uint64)" --rpc-url "$RPC_URL" | awk '{print $1}')"
    now="$("$CAST" block latest --field timestamp --rpc-url "$RPC_URL" | awk '{print $1}')"
    if (( now < dl )); then
      "$CAST" rpc evm_increaseTime $(( dl - now + 60 )) --rpc-url "$RPC_URL" >/dev/null
      "$CAST" rpc evm_mine --rpc-url "$RPC_URL" >/dev/null
      log "$label: anvil 时间旅行到 deadline 之后"
    fi
  fi
  send "$label" "operator(anyone)" "$OPERATOR_KEY" "$addr" "settle()"
}

settle_all() {
  require_state
  settle_one success "$SUCCESS_ADDR"
  settle_one failure "$FAILURE_ADDR"
}

claims() {
  require_state
  local b
  for b in A B C D E; do
    local key_var="BUYER_${b}_KEY"
    send success "buyer$b" "${!key_var}" "$SUCCESS_ADDR" "claimRefund()"
  done
  send success "loom" "$LOOM_KEY" "$SUCCESS_ADDR" "claimPayout()"
  for b in A B; do
    local key_var="BUYER_${b}_KEY"
    send failure "buyer$b" "${!key_var}" "$FAILURE_ADDR" "claimRefund()"
  done
}

status_one() { # <label> <addr>
  local label="$1" addr="$2"
  echo "── $label ($addr)"
  echo "   state(0=Draft,1=Open,2=Succeeded,3=Failed,4=PaidOut): $("$CAST" call "$addr" "state()(uint8)" --rpc-url "$RPC_URL")"
  echo "   orders: $("$CAST" call "$addr" "ordersLength()(uint256)" --rpc-url "$RPC_URL")"
  echo "   previewSettlement(feasible,quoteId,tierIndex,price,count): $("$CAST" call "$addr" "previewSettlement()(bool,uint256,uint256,uint256,uint256)" --rpc-url "$RPC_URL" | tr '\n' ' ')"
  echo "   factoryReceivable: $("$CAST" call "$addr" "factoryReceivable()(uint256)" --rpc-url "$RPC_URL")"
}

status() { require_state; status_one success "$SUCCESS_ADDR"; status_one failure "$FAILURE_ADDR"; }

# ---------------------------------------------------------------- 主流程

# 角色地址与演示 hash（确定性，可复算）；仅需要签名的阶段才加载私钥
require_keys() {
  : "${OPERATOR_KEY:?}.env 需要 OPERATOR_KEY / NORTH_KEY / LOOM_KEY / BUYER_A..E_KEY"
  : "${NORTH_KEY:?}"; : "${LOOM_KEY:?}"
  OPERATOR_ADDR="$(addr_of "$OPERATOR_KEY")"
  NORTH_ADDR="$(addr_of "$NORTH_KEY")"
  LOOM_ADDR="$(addr_of "$LOOM_KEY")"
  NORTH_PROFILE_HASH="${NORTH_PROFILE_HASH:-$("$CAST" keccak "makebook.factory.north.v1")}"
  LOOM_PROFILE_HASH="${LOOM_PROFILE_HASH:-$("$CAST" keccak "makebook.factory.loom.v1")}"
  NORTH_QUOTE_HASH="${NORTH_QUOTE_HASH:-$("$CAST" keccak "makebook.quote.north.v1")}"
  LOOM_QUOTE_HASH="${LOOM_QUOTE_HASH:-$("$CAST" keccak "makebook.quote.loom.v1")}"
  NORTH_PRICE_WEI="$("$CAST" --to-wei 0.024 ether)"
  LOOM_PRICE_WEI="$("$CAST" --to-wei 0.019 ether)"
  log "operator=$OPERATOR_ADDR north=$NORTH_ADDR loom=$LOOM_ADDR"
}

case "$PHASE" in
  up) require_keys; up ;;
  settle) require_keys; settle_all ;;
  claims) require_keys; claims ;;
  status) status ;;
  verify) require_keys; require_state; verify_contract "$SUCCESS_ADDR"; verify_contract "$FAILURE_ADDR" ;;
  all) require_keys; up; settle_all; claims; status ;;
  *) echo "未知阶段: $PHASE" >&2; exit 1 ;;
esac

log "完成。证据文件: $RECEIPTS"
