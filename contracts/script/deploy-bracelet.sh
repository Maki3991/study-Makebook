#!/usr/bin/env bash
# 部署 BRACELET-01（Tech & AI Heritage Bracelet）Campaign 到 Injective EVM Testnet。
# 私钥只从仓库根 .env 读取（OPERATOR_KEY / NORTH_KEY / LOOM_KEY），绝不写入本脚本或日志。
# 用法：contracts/script/deploy-bracelet.sh
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FORGE="$HOME/.foundry/bin/forge"
CAST="$HOME/.foundry/bin/cast"
RPC="${INJ_RPC:-https://k8s.testnet.json-rpc.injective.network/}"
GAS_FLAGS=(--legacy --gas-price 160000000 --gas-limit 2000000)

set -a; source "$ROOT/.env"; set +a
: "${OPERATOR_KEY:?} " ; : "${NORTH_KEY:?}" ; : "${LOOM_KEY:?}" ; : "${CREATOR_KEY:?P1 需要 CREATOR_KEY}" ; : "${PLATFORM_KEY:?P1 需要 PLATFORM_KEY}"
MARGIN_BPS="${MARGIN_BPS:-2500}"
FEE_BPS="${FEE_BPS:-200}"

export MANIFEST_HASH="0x1c503957667bb009a161c7d9bfe70e59db01c61c80920faae60f98a1e3c958dd"
export MANIFEST_URI="https://raw.githubusercontent.com/gmy20060609-jpg/ACL-team/main/public/manifests/heritage-bracelet.json"
export DEADLINE="${DEADLINE:-$(( $(date +%s) + 259200 ))}"   # 默认现在 +72h
export OPERATOR_ADDRESS="$($CAST wallet address --private-key "$OPERATOR_KEY")"
NORTH_ADDRESS="$($CAST wallet address --private-key "$NORTH_KEY")"
LOOM_ADDRESS="$($CAST wallet address --private-key "$LOOM_KEY")"
CREATOR_ADDRESS="$($CAST wallet address --private-key "$CREATOR_KEY")"
PLATFORM_ADDRESS="$($CAST wallet address --private-key "$PLATFORM_KEY")"

echo "== operator=$OPERATOR_ADDRESS north=$NORTH_ADDRESS loom=$LOOM_ADDRESS"
echo "== creator=$CREATOR_ADDRESS feeRecipient=$PLATFORM_ADDRESS marginBps=$MARGIN_BPS feeBps=$FEE_BPS"
echo "== deadline=$DEADLINE ($(date -r "$DEADLINE" '+%F %T %Z'))"

# 1. 部署（cast --create：forge script 的 receipt 等待在 Injective RPC 上不可靠；
#    flag 必须放位置参数前，--create 模式会把其后内容当位置值解析）
[[ -f "$ROOT/contracts/out/MakebookCampaign.sol/MakebookCampaign.json" ]] || (cd "$ROOT/contracts" && "$FORGE" build >/dev/null)
BYTECODE=$(jq -r '.bytecode.object' "$ROOT/contracts/out/MakebookCampaign.sol/MakebookCampaign.json")
ARGS=$("$CAST" abi-encode "constructor(address,address,address,bytes32,string,uint64,uint32,uint32)" "$OPERATOR_ADDRESS" "$CREATOR_ADDRESS" "$PLATFORM_ADDRESS" "$MANIFEST_HASH" "$MANIFEST_URI" "$DEADLINE" "$MARGIN_BPS" "$FEE_BPS")
TX=$("$CAST" send --async --json --private-key "$OPERATOR_KEY" --rpc-url "$RPC" --legacy --gas-price 160000000 --gas-limit 4000000 \
  --create "${BYTECODE}${ARGS:2}" | grep -oE '0x[0-9a-fA-F]{64}' | head -1)
: "${TX:?部署广播失败}"
sleep 5
# RPC receipt 查询经常滞后：从 operator 最新 nonce 往下反推 CREATE 地址（脚本串行，最新有代码的地址即本次部署）
ADDR=""
NONCE=$("$CAST" nonce "$OPERATOR_ADDRESS" --rpc-url "$RPC")
for (( n=NONCE-1; n>=0; n-- )); do
  A=$("$CAST" compute-address --nonce "$n" "$OPERATOR_ADDRESS" | awk '{print $NF}')
  if [[ -n "$("$CAST" code "$A" --rpc-url "$RPC" 2>/dev/null | tr -d '0x')" ]]; then ADDR="$A"; break; fi
done
: "${ADDR:?无法读取 contractAddress: $TX}"
echo "== deployed: $ADDR (tx $TX)"

send() { # from_key fn_sig args...
  local key="$1" sig="$2"; shift 2
  # --async：同步等 receipt，绕开 Injective RPC receipt 轮询不可靠的问题
  "$CAST" send --async --json "$ADDR" "$sig" "$@" --private-key "$key" --rpc-url "$RPC" "${GAS_FLAGS[@]}" >/dev/null
  echo "   ok: $sig $*"
}

# 2. 登记两家演示工厂（operator）
NORTH_PROFILE=$("$CAST" keccak "makebook:factory:north")
LOOM_PROFILE=$("$CAST" keccak "makebook:factory:loom")
send "$OPERATOR_KEY" "registerFactory(address,bytes32)" "$NORTH_ADDRESS" "$NORTH_PROFILE"
send "$OPERATOR_KEY" "registerFactory(address,bytes32)" "$LOOM_ADDRESS" "$LOOM_PROFILE"

# 3. 工厂报价：North min3@0.024；Loom min3@0.019（与 FRAME-01 同刻度）
NORTH_QUOTE=$("$CAST" keccak "makebook:quote:north:bracelet")
LOOM_QUOTE=$("$CAST" keccak "makebook:quote:loom:bracelet")
send "$NORTH_KEY" "submitQuote(bytes32,(uint32,uint256)[])" "$NORTH_QUOTE" "[(3,24000000000000000)]"
send "$LOOM_KEY"  "submitQuote(bytes32,(uint32,uint256)[])" "$LOOM_QUOTE"  "[(3,19000000000000000)]"

# 4. 开盘（operator）
send "$OPERATOR_KEY" "openCampaign()"

# 5. 只读复核
echo "== state: $($CAST call "$ADDR" 'state()(uint8)' --rpc-url "$RPC")  (1=Open)"
echo "== quotes: $($CAST call "$ADDR" 'quotesLength()(uint256)' --rpc-url "$RPC")"
echo "== manifestHash: $($CAST call "$ADDR" 'manifestHash()(bytes32)' --rpc-url "$RPC")"
DEPLOY_BLOCK=$("$CAST" block-number --rpc-url "$RPC")
echo "== deployBlock: $DEPLOY_BLOCK"

# 6. 回填 deployments/injective-testnet.json（前端唯一地址来源）
export CREATOR_ADDRESS PLATFORM_ADDRESS MARGIN_BPS FEE_BPS
python3 - "$ROOT" "$ADDR" "$DEPLOY_BLOCK" <<'PY'
import json, os, sys
root, addr, block = sys.argv[1], sys.argv[2], int(sys.argv[3])
p = os.path.join(root, "deployments", "injective-testnet.json")
d = json.load(open(p))
d["bracelet"] = {
    "address": addr,
    "manifestHash": os.environ["MANIFEST_HASH"],
    "manifestURI": os.environ["MANIFEST_URI"],
    "deadline": int(os.environ["DEADLINE"]),
    "deployBlock": block,
    "creator": os.environ["CREATOR_ADDRESS"],
    "feeRecipient": os.environ["PLATFORM_ADDRESS"],
    "marginBps": int(os.environ["MARGIN_BPS"]),
    "feeBps": int(os.environ["FEE_BPS"]),
}
json.dump(d, open(p, "w"), indent=2, ensure_ascii=False)
print("== deployments 已回填 bracelet =", addr)
PY
