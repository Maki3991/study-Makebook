"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Factory,
  LoaderCircle,
  LockKeyhole,
  PencilLine,
  Quote,
  ReceiptText,
  RotateCcw,
  ShieldCheck,
  WalletCards,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import { parseUnits, type Address, type Hex } from "viem";
import {
  INJECTIVE_EVM_TESTNET_CHAIN_ID,
  INJ_DECIMALS,
} from "../lib/chain/chain";
import {
  formatInj,
  useCampaignData,
  useCountdown,
} from "../lib/chain/use-campaign";
import {
  describeWriteError,
  shortenAddress,
  switchToInjectiveNetwork,
  writeCampaignAction,
  type CampaignWriteAction,
  type ConnectedWallet,
} from "../lib/chain/wallet";
import { candidates, sourceComments } from "../lib/mock-data";
import type {
  ContractReadState,
  DemoNetworkState,
  DemoSettlementMode,
  DemoSignatureMode,
} from "./demo-panel";
import {
  AnimatedAmount,
  CopyValue,
  ExplorerLink,
  Metric,
  SectionLabel,
  SourceTag,
  WeiDebug,
} from "./ui";

const demoWallet: Address = "0x7F2A9c70B4F22E6A1D640bc7A64E2F44AC0D41C2";
const orderTx =
  "0xb7e4a907dd3aab90bf47e4ae41206935894d57f2652be72492da95fdc18e9c21";
const campaignTx =
  "0x98e219d3128ff183f4a0d45ca0d31fa764449259abb1bc43153475c4ad54b771";
const settlementTx =
  "0x43a90f856e8c0ddcb4af2e7d2fe812936f21159c25df5f8c1683cae0444fec18";

function decimalToWei(value: string) {
  const [whole = "0", decimal = ""] = value.split(".");
  const normalizedDecimal = `${decimal}000000000000000000`.slice(0, 18);
  return (
    BigInt(whole || "0") * 10n ** 18n +
    BigInt(normalizedDecimal || "0")
  ).toString();
}

export function StudioScreen({
  confirmed,
  onConfirmedChange,
}: {
  confirmed: boolean;
  onConfirmedChange: (confirmed: boolean) => void;
}) {
  const [selectedId, setSelectedId] = useState("FRAME-01");
  const [status, setStatus] = useState<"idle" | "compiling" | "ready">("ready");
  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  function compileDemand() {
    setStatus("compiling");
    onConfirmedChange(false);
    window.setTimeout(() => setStatus("ready"), 850);
  }

  return (
    <div className="studio-workbench">
      <section className="surface input-surface studio-source">
        <div className="studio-source-head">
          <SectionLabel index="01">原始需求</SectionLabel>
          <div className="studio-source-count">
            <strong>20</strong>
            <span>VALID INPUTS</span>
          </div>
        </div>
        <p className="studio-source-intro">
          评论与访谈只作为需求证据，不直接决定生产规格。
        </p>
        <div className="comment-preview">
          {sourceComments.slice(0, 3).map((comment, index) => (
            <div className="comment-row" key={comment}>
              <span className="comment-avatar">0{index + 1}</span>
              <p>{comment}</p>
            </div>
          ))}
        </div>
        <button className="text-expand" type="button">
          查看全部 20 条评论
          <ChevronDown size={15} aria-hidden="true" />
        </button>
        <button
          className="action-button action-button-dark"
          type="button"
          disabled={status === "compiling"}
          onClick={compileDemand}
        >
          {status === "compiling" ? (
            <LoaderCircle className="spin" size={17} aria-hidden="true" />
          ) : null}
          {status === "compiling"
            ? "正在整理评论与访谈…"
            : "重新整理评论与访谈"}
        </button>
        <p className="honesty-note">
          <AlertCircle size={14} aria-hidden="true" />
          当前展示固定演示样本；接入 AI 后仍保留相同结构与人工闸门。
        </p>
      </section>

      <section className="studio-output">
        <div className="studio-output-head">
          <div>
            <SectionLabel index="02">候选方向</SectionLabel>
            <p>AI 提取三个可制造方向，选择一项进入人工复核。</p>
          </div>
          <SourceTag tone="ai">AI Generated</SourceTag>
        </div>
        <div className="candidate-strip">
          {candidates.map((candidate, index) => (
            <button
              className="candidate-mini"
              data-selected={candidate.id === selectedId}
              key={candidate.id}
              type="button"
              onClick={() => {
                setSelectedId(candidate.id);
                onConfirmedChange(false);
              }}
            >
              <span className="candidate-index">0{index + 1}</span>
              <span className="candidate-mini-copy">
                <small>{candidate.id}</small>
                <strong>{candidate.name}</strong>
              </span>
              <span className="candidate-score">
                {candidate.confidence}
                <small>%</small>
              </span>
            </button>
          ))}
        </div>

        <section className="surface candidate-detail" key={selected.id}>
          <div className="candidate-heading">
            <div className="candidate-title-block">
              <div className="candidate-title-meta">
                <span className="mono-note">{selected.id} / MANIFEST DRAFT</span>
                <SourceTag tone="ai">AI Generated</SourceTag>
              </div>
              <h2>{selected.name}</h2>
              <p>把分散的“想要”压缩成可以报价、打样和确认的规格草案。</p>
            </div>
            <div
              className="confidence-readout"
              aria-label={`置信度 ${selected.confidence}%`}
            >
              <span>CONFIDENCE</span>
              <strong>{selected.confidence}</strong>
              <small>/ 100</small>
            </div>
          </div>

          <div className="candidate-body">
            <div className="candidate-spec-column">
              <p className="detail-label">制造规格</p>
              <div className="spec-grid">
                {selected.specs.map((spec, index) => (
                  <span key={spec}>
                    <small>0{index + 1}</small>
                    {spec}
                  </span>
                ))}
              </div>
            </div>

            <div className="candidate-review-column">
              <div className="evidence-block">
                <p className="detail-label">
                  <Quote size={14} aria-hidden="true" />
                  证据
                </p>
                <ul>
                  {selected.evidence.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="unknown-block">
                <p className="detail-label">
                  <AlertCircle size={14} aria-hidden="true" />
                  仍需确认
                </p>
                <p>{selected.unknown}</p>
              </div>
            </div>
          </div>

          <div className="candidate-confirmation">
            <div>
              <span>HUMAN REVIEW</span>
              <p>
                {selected.id === "FRAME-01"
                  ? "确认后才生成可进入资金流程的 manifest。"
                  : "当前资金演示只为 FRAME-01 准备；返回已确认方向后继续。"}
              </p>
            </div>
            <button
              className="action-button"
              data-confirmed={confirmed}
              type="button"
              onClick={() => {
                if (selected.id !== "FRAME-01") {
                  setSelectedId("FRAME-01");
                  onConfirmedChange(true);
                  return;
                }
                onConfirmedChange(!confirmed);
              }}
            >
              {confirmed ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <PencilLine size={17} aria-hidden="true" />
              )}
              {confirmed
                ? "已确认，可进入 Campaign"
                : selected.id === "FRAME-01"
                  ? "编辑并确认方向"
                  : "返回 FRAME-01 进入资金流程"}
            </button>
          </div>

          <div className="confirmation-proof" data-visible={confirmed}>
            {confirmed ? (
              <SourceTag tone="human">Human Confirmed</SourceTag>
            ) : (
              <SourceTag tone="offchain">Unconfirmed Draft</SourceTag>
            )}
            <span>
              {confirmed
                ? "manifestHash · 0x7a19…be42"
                : "等待人工确认后生成 manifestHash"}
            </span>
          </div>
        </section>
      </section>
    </div>
  );
}

function ContractReadFallback({
  state,
  onRetry,
}: {
  state: Exclude<ContractReadState, "ready">;
  onRetry: () => void;
}) {
  if (state === "loading") {
    return (
      <section className="surface contract-read-state" data-state="loading">
        <div className="contract-state-head">
          <SourceTag tone="onchain">ONCHAIN</SourceTag>
          <span>正在读取 Campaign 合约状态…</span>
        </div>
        <div className="skeleton-grid" aria-label="正在加载合约数据">
          <span />
          <span />
          <span />
          <span />
        </div>
      </section>
    );
  }

  return (
    <section className="surface contract-read-state" data-state="error">
      <div className="contract-error-icon">
        <AlertCircle size={22} aria-hidden="true" />
      </div>
      <div>
        <SourceTag tone="onchain">ONCHAIN</SourceTag>
        <strong>暂时无法读取合约状态</strong>
        <p>页面外壳仍然可用。检查 RPC 连接后重试，不会提交任何交易。</p>
      </div>
      <button className="action-button" type="button" onClick={onRetry}>
        <RotateCcw size={16} aria-hidden="true" />
        重试合约读取
      </button>
    </section>
  );
}

export function CampaignScreen({
  readState = "ready",
  onRetry = () => undefined,
  mode = "success",
}: {
  readState?: ContractReadState;
  onRetry?: () => void;
  mode?: DemoSettlementMode;
}) {
  // demo-panel 清算场景开关决定读 success/failure 哪套合约（spec 003 第 3 节）；
  // readState ≠ ready 时暂停读取，走三态演示壳。
  const { status, view } = useCampaignData(mode, readState === "ready");
  const countdown = useCountdown(view.deadline);
  const onchain = view.source === "onchain";
  const { preview } = view;
  const points = view.demandPoints;
  // 需求曲线坐标系：y 轴 0~5 单、每单 48px（spec 003 第 2 节）；x 轴按价格点均布。
  const spacing = points.length > 1 ? 448 / (points.length - 1) : 0;
  const pointX = (index: number) => 94 + index * spacing;
  const levelY = (level: number) => 280 - level * 48;
  const priceIndexOf = (priceWei: bigint) => {
    const exact = points.findIndex(
      (point) => parseUnits(point.price, INJ_DECIMALS) === priceWei,
    );
    if (exact >= 0) return exact;
    const greater = points.findIndex(
      (point) => parseUnits(point.price, INJ_DECIMALS) > priceWei,
    );
    return greater >= 0 ? greater : 0;
  };

  const winnerQuoteIndex = Number(preview.quoteId);
  const winnerQuote = preview.feasible ? view.quotes[winnerQuoteIndex] : undefined;
  const winnerTier = winnerQuote?.tiers[Number(preview.tierIndex)];
  const winnerName = view.quoteNames[winnerQuoteIndex] ?? "Factory";
  const winnerOverlay =
    preview.feasible && winnerTier
      ? {
          name: winnerName.replace(/^Factory\s+/i, "").toUpperCase(),
          moq: winnerTier.minQty,
          price: formatInj(preview.clearingPrice),
          xIndex: priceIndexOf(winnerTier.unitPriceWei),
          level: Number(preview.winnerCount),
        }
      : null;
  const missedOverlays = view.factoryTiers
    .filter((tier) => !tier.feasible)
    .map((tier) => ({
      id: tier.id,
      name: tier.name.replace(/^Factory\s+/i, "").toUpperCase(),
      moq: tier.quantity,
      price: tier.price,
      xIndex: priceIndexOf(parseUnits(tier.price, INJ_DECIMALS)),
    }));

  const stepPath = points
    .map((point, index) =>
      index === 0
        ? `M${pointX(0)} ${levelY(point.orders)}`
        : `H${pointX(index)} V${levelY(point.orders)}`,
    )
    .join(" ");

  const ariaTiers = view.factoryTiers
    .map((tier) => {
      const isWinner =
        preview.feasible &&
        tier.feasible &&
        parseUnits(tier.price, INJ_DECIMALS) === preview.clearingPrice;
      return `${tier.name} 的 ${tier.quantity} 件档位在 ${tier.price} test INJ ${
        tier.feasible ? (isWinner ? "可行并中标" : "可行") : "不可行"
      }`;
    })
    .join("，");

  return (
    <div className="screen-stack">
      <section className="product-hero">
        <Image
          src="/frame-01-hero.webp"
          alt="FRAME-01 黑色 8L 模块化摄影斜挎包"
          fill
          priority
          unoptimized
          sizes="(max-width: 767px) 100vw, (max-width: 1279px) 64vw, 28vw"
        />
        <div className="product-hero-top">
          <SourceTag tone="human">Human Confirmed</SourceTag>
          <SourceTag tone="testnet">Testnet</SourceTag>
        </div>
        <div className="product-hero-copy">
          <span>FRAME-01 · OPEN</span>
          <h2>8L 模块摄影斜挎包</h2>
          <p>黑色 / 可拆内胆 / 宽肩带 / 一机两镜</p>
        </div>
      </section>

      <section className="surface campaign-clock">
        <div>
          <span className="mono-note">ORDER WINDOW</span>
          <strong>{countdown.label}</strong>
        </div>
        <span className="clock-state">
          {countdown.expired ? "已截止，可发起清算" : "正在接单"}
        </span>
      </section>

      {readState !== "ready" ? (
        <ContractReadFallback state={readState} onRetry={onRetry} />
      ) : status === "loading" ? (
        <ContractReadFallback state="loading" onRetry={onRetry} />
      ) : (
        <>
      <section>
        <SectionLabel index="01">两种需求，分开看</SectionLabel>
        <div className="metric-grid">
          <div className="surface signal-card">
            <SourceTag tone="ai">AI Generated</SourceTag>
            <Metric label="评论 / 访谈样本" value="72" suffix="条" />
            <p>说明方向值得研究，不参与清算。</p>
          </div>
          <div className="surface signal-card">
            {onchain ? (
              <SourceTag tone="onchain">Onchain</SourceTag>
            ) : (
              <SourceTag tone="offchain">Off-chain Demo</SourceTag>
            )}
            <Metric label="已预锁资金订单" value={String(view.ordersLength)} suffix="笔" />
            <p>钱包已预锁 maxPrice，进入清算。</p>
          </div>
        </div>
      </section>

      <section className="surface demand-curve-card">
        <SectionLabel
          index="02"
          aside={
            <span className="mono-note">
              {onchain ? "ORDER BOOK / LIVE" : "ORDER BOOK / FIXTURE"}
            </span>
          }
        >
          资金需求曲线
        </SectionLabel>
        <p className="chart-reading-note">
          <span>怎么读</span>
          从左向右价格升高，仍愿意出价的订单会减少。绿色档位达到 MOQ，
          灰色档位未达到。
        </p>
        <div
          className="demand-chart"
          role="img"
          aria-label={`AI 兴趣样本与链上预锁订单分别显示。链上曲线表示价格越高，满足最高愿付价的订单越少。${ariaTiers}。`}
        >
          <div className="interest-band">
            <div>
              <SourceTag tone="ai">AI Generated</SourceTag>
              <strong>72 条兴趣样本</strong>
              <span>访谈与评论聚合 · 不参与清算</span>
            </div>
            <div className="interest-scale" aria-hidden="true">
              {[46, 72, 88, 64, 38, 22].map((height, index) => (
                <span
                  key={index}
                  style={{ "--signal": `${height}%` } as CSSProperties}
                />
              ))}
            </div>
          </div>

          <div className="funded-chart-head">
            <div>
              {onchain ? (
                <SourceTag tone="onchain">Onchain</SourceTag>
              ) : (
                <SourceTag tone="offchain">Off-chain Demo</SourceTag>
              )}
              <strong>真实测试网订单</strong>
            </div>
            <span>maxPrice ≥ 该价格</span>
          </div>

          <svg
            className="funded-chart"
            viewBox="0 0 620 330"
            preserveAspectRatio="xMidYMid meet"
            aria-hidden="true"
          >
            <g className="chart-grid">
              {[40, 88, 136, 184, 232, 280].map((y) => (
                <line key={y} x1="64" x2="586" y1={y} y2={y} />
              ))}
            </g>

            <g className="chart-axis-labels">
              {["5", "4", "3", "2", "1", "0"].map((value, index) => (
                <text key={value} x="44" y={44 + index * 48} textAnchor="end">
                  {value}
                </text>
              ))}
              {points.map((point, index) => (
                <text
                  key={point.price}
                  x={pointX(index)}
                  y="306"
                  textAnchor="middle"
                >
                  {point.price}
                </text>
              ))}
            </g>

            <g className="chart-order-bars">
              {points.map((point, index) => {
                const height = point.orders * 48;
                return (
                  <g
                    data-winner={
                      winnerOverlay ? point.price === winnerOverlay.price : false
                    }
                    key={point.price}
                  >
                    <rect
                      x={pointX(index) - 27}
                      y={280 - height}
                      width="54"
                      height={height}
                    />
                    <text
                      x={pointX(index)}
                      y={270 - height}
                      textAnchor="middle"
                    >
                      {point.orders}
                    </text>
                  </g>
                );
              })}
            </g>

            {stepPath ? (
              <path className="funded-step-line" d={stepPath} />
            ) : null}

            {winnerOverlay ? (
              <g className="factory-threshold factory-threshold-winner">
                <line
                  className="clearing-line-svg"
                  x1={pointX(winnerOverlay.xIndex) - 40}
                  x2="586"
                  y1={levelY(winnerOverlay.level)}
                  y2={levelY(winnerOverlay.level)}
                />
                <rect
                  className="threshold-point"
                  x={pointX(winnerOverlay.xIndex) - 4}
                  y={levelY(winnerOverlay.level) - 4}
                  width="8"
                  height="8"
                />
                <text
                  className="chart-threshold-label chart-threshold-label-full"
                  x="566"
                  y={levelY(winnerOverlay.level) - 14}
                  textAnchor="end"
                >
                  WINNER · {winnerOverlay.name} · MOQ {winnerOverlay.moq} @{" "}
                  {winnerOverlay.price}
                </text>
                <text
                  className="chart-threshold-label chart-threshold-label-short"
                  x="566"
                  y={levelY(winnerOverlay.level) - 14}
                  textAnchor="end"
                >
                  {winnerOverlay.name} · MOQ {winnerOverlay.moq}
                </text>
              </g>
            ) : null}

            {missedOverlays.map((overlay, overlayIndex) => (
              <g
                className="factory-threshold factory-threshold-missed"
                key={overlay.id}
              >
                <line
                  x1={pointX(overlay.xIndex) - 40}
                  x2="586"
                  y1={levelY(overlay.moq)}
                  y2={levelY(overlay.moq)}
                />
                <path
                  d={`M${pointX(overlay.xIndex) - 4} ${levelY(overlay.moq) - 6} l12 12 M${pointX(overlay.xIndex) + 8} ${levelY(overlay.moq) - 6} l-12 12`}
                />
                <text
                  className="chart-threshold-label chart-threshold-label-full"
                  x="566"
                  y={levelY(overlay.moq) + 25 + overlayIndex * 18}
                  textAnchor="end"
                >
                  MISSED · {overlay.name} · MOQ {overlay.moq} @ {overlay.price}
                </text>
                <text
                  className="chart-threshold-label chart-threshold-label-short"
                  x="566"
                  y={levelY(overlay.moq) + 25 + overlayIndex * 18}
                  textAnchor="end"
                >
                  {overlay.name} · MOQ {overlay.moq}
                </text>
              </g>
            ))}

            <text className="chart-y-title" x="66" y="19">
              预锁订单数
            </text>
            <text className="chart-x-title" x="586" y="328" textAnchor="end">
              最高愿付价 / test INJ
            </text>
          </svg>

          <div className="chart-legend">
            <span data-kind="curve">链上需求曲线</span>
            <span data-kind="winner">可行 / 中标</span>
            <span data-kind="missed">不可行</span>
          </div>
        </div>
      </section>

      <section>
        <SectionLabel index="03">工厂 MOQ 报价</SectionLabel>
        <div className="factory-list">
          {view.factoryTiers.map((tier) => (
            <article
              className="surface factory-tier"
              data-feasible={tier.feasible}
              key={tier.id}
            >
              <div className="factory-name">
                <span className="factory-icon">
                  <Factory size={16} aria-hidden="true" />
                </span>
                <div>
                  <strong>{tier.name}</strong>
                  <SourceTag tone="factory">Demo Factory</SourceTag>
                </div>
              </div>
              <div className="factory-price">
                <span>MOQ {tier.quantity}</span>
                <strong>{tier.price}</strong>
                <small>test INJ / 件</small>
              </div>
              <div className="factory-state">
                {tier.feasible ? (
                  <Check size={15} aria-hidden="true" />
                ) : (
                  <AlertCircle size={15} aria-hidden="true" />
                )}
                {tier.feasible
                  ? `${tier.eligible} 笔订单满足，当前可行`
                  : `仅 ${tier.eligible} 笔订单满足，未达 MOQ`}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="feasibility-banner">
        <div className="feasibility-icon">
          <ShieldCheck size={21} aria-hidden="true" />
        </div>
        <div>
          <span>当前可行性预览</span>
          <strong>
            {preview.feasible && winnerTier
              ? `如果现在截止，${winnerName} 的 ${winnerTier.minQty} 件档位可成批。`
              : "如果现在截止，没有任何档位达到 MOQ。"}
          </strong>
          <p>最终结果只在截止后由合约清算；此处不是承诺。</p>
        </div>
      </section>
        </>
      )}
    </div>
  );
}

const priceOptions = ["0.019", "0.021", "0.024", "0.026"];

export function OrderScreen({
  networkState = "correct",
  signatureMode = "success",
  wallet = null,
}: {
  networkState?: DemoNetworkState;
  signatureMode?: DemoSignatureMode;
  wallet?: ConnectedWallet | null;
}) {
  const [maxPrice, setMaxPrice] = useState("0.024");
  const [acknowledged, setAcknowledged] = useState(false);
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const [switching, setSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);
  // 连接钱包后以真实 chainId 为准；未连接时沿用 demo-panel 的网络演示开关（spec 003 第 3 节）。
  const wrongNetwork = wallet
    ? wallet.chainId !== INJECTIVE_EVM_TESTNET_CHAIN_ID
    : networkState === "wrong";
  const clearingPrice = 0.019;
  const numericPrice = Number(maxPrice) || 0;
  const estimatedRefund = Math.max(numericPrice - clearingPrice, 0);
  const canSubmit =
    acknowledged &&
    publicAcknowledged &&
    numericPrice > 0 &&
    !wrongNetwork &&
    status === "idle";
  const orderDisabled =
    status === "pending" || (status === "idle" && !canSubmit);

  async function switchNetwork() {
    if (switching) return;
    setSwitching(true);
    setSwitchError(null);
    try {
      await switchToInjectiveNetwork();
    } catch {
      setSwitchError("切换网络失败，请在钱包中手动切换到 Chain ID 1439。");
    } finally {
      setSwitching(false);
    }
  }

  function submitOrder() {
    if (!canSubmit) return;
    setStatus("pending");
    window.setTimeout(
      () => setStatus(signatureMode === "reject" ? "error" : "success"),
      1200,
    );
  }

  return (
    <div className="screen-stack">
      <section
        className="surface wallet-status-card"
        data-network-error={wrongNetwork}
      >
        <div className="wallet-status-icon">
          <WalletCards size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="mono-note">CONNECTED WALLET</span>
          <CopyValue
            value={wallet?.address ?? demoWallet}
            display={shortenAddress(wallet?.address ?? demoWallet)}
            label="复制完整钱包地址"
          />
          <p>
            {wrongNetwork
              ? `Unknown network · Chain ID ${wallet ? wallet.chainId : 1}`
              : "Injective EVM Testnet · Chain ID 1439"}
          </p>
        </div>
        <SourceTag tone="testnet">
          {wrongNetwork ? "Wrong Network" : "Testnet"}
        </SourceTag>
      </section>

      {wrongNetwork ? (
        <section className="inline-error" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <p>
            当前不是 Injective EVM Testnet（Chain ID
            1439）。切换网络后再继续。
          </p>
          {wallet ? (
            <button
              className="action-button"
              type="button"
              aria-busy={switching}
              disabled={switching}
              onClick={switchNetwork}
            >
              {switching ? (
                <LoaderCircle className="spin" size={16} aria-hidden="true" />
              ) : (
                <RotateCcw size={16} aria-hidden="true" />
              )}
              {switching
                ? "正在请求钱包切换…"
                : "一键切换到 Injective EVM Testnet"}
            </button>
          ) : null}
          {switchError ? <p>{switchError}</p> : null}
        </section>
      ) : null}

      <section className="surface order-form">
        <SectionLabel index="01">你的最高愿付价</SectionLabel>
        <div className="price-input-wrap">
          <input
            aria-label="最高愿付价"
            inputMode="decimal"
            type="number"
            min="0.001"
            step="0.001"
            value={maxPrice}
            onChange={(event) => {
              setMaxPrice(event.target.value);
              setStatus("idle");
            }}
          />
          <div className="price-unit">
            <strong>test INJ</strong>
            <span>1 件 FRAME-01</span>
          </div>
        </div>
        <div className="price-presets" aria-label="快捷价格">
          {priceOptions.map((price) => (
            <button
              data-active={maxPrice === price}
              key={price}
              type="button"
              onClick={() => {
                setMaxPrice(price);
                setStatus("idle");
              }}
            >
              {price}
            </button>
          ))}
        </div>
        <p className="field-help">
          这不是直接支付的售价，而是你愿意接受的价格上限。
        </p>
      </section>

      <section className="surface order-summary">
        <SectionLabel index="02">资金如何变化</SectionLabel>
        <div className="money-flow">
          <div>
            <span>现在预锁</span>
            <strong>
              <AnimatedAmount value={numericPrice} /> test INJ
            </strong>
          </div>
          <ArrowUpRight size={18} aria-hidden="true" />
          <div>
            <span>若按当前预览清算</span>
            <strong>
              <AnimatedAmount value={clearingPrice} /> test INJ
            </strong>
          </div>
        </div>
        <div className="refund-preview">
          <CircleDollarSign size={18} aria-hidden="true" />
          <div>
            <span>预计可领取差额</span>
            <strong>
              <AnimatedAmount value={estimatedRefund} /> test INJ
            </strong>
          </div>
        </div>
        <WeiDebug
          amount={`${numericPrice.toFixed(3)} → ${clearingPrice.toFixed(3)}`}
          wei={`${decimalToWei(maxPrice)} → 19000000000000000`}
        />
        <p className="honesty-note">
          <AlertCircle size={14} aria-hidden="true" />
          这里只根据当前演示订单预览。真正成交价只能在截止后由合约确定。
        </p>
      </section>

      <section className="surface agreement-list">
        <SectionLabel index="03">签名前确认</SectionLabel>
        <label className="agreement-row">
          <input
            type="checkbox"
            checked={acknowledged}
            onChange={(event) => setAcknowledged(event.target.checked)}
          />
          <span className="custom-check" aria-hidden="true">
            <Check size={13} />
          </span>
          <span>
            你将预锁 {maxPrice} test INJ。若统一价不高于它，你会获得 1 件
            FRAME-01，并可领取差额；否则可领取全额。提交后不可撤销。
          </span>
        </label>
        <label className="agreement-row">
          <input
            type="checkbox"
            checked={publicAcknowledged}
            onChange={(event) => setPublicAcknowledged(event.target.checked)}
          />
          <span className="custom-check" aria-hidden="true">
            <Check size={13} />
          </span>
          <span>
            你的钱包地址、最高愿付价和交易会公开出现在 Injective EVM
            Testnet。请勿使用含真实资产的主钱包。
          </span>
        </label>

        <button
          className="action-button action-button-dark order-submit"
          data-status={status}
          type="button"
          aria-busy={status === "pending"}
          disabled={orderDisabled}
          onClick={
            status === "success" || status === "error"
              ? () => setStatus("idle")
              : submitOrder
          }
        >
          {status === "pending" ? (
            <LoaderCircle className="spin" size={17} aria-hidden="true" />
          ) : status === "success" ? (
            <CheckCircle2 size={17} aria-hidden="true" />
          ) : status === "error" ? (
            <AlertCircle size={17} aria-hidden="true" />
          ) : (
            <LockKeyhole size={17} aria-hidden="true" />
          )}
          {status === "pending"
            ? "交易已提交，正在等待 Injective 确认。请不要重复点击。"
            : status === "success"
              ? "订单已上链 · 查看交易"
              : status === "error"
                ? "签名已取消 · 重新尝试"
              : `签名并预锁 ${numericPrice.toFixed(3)} test INJ`}
        </button>

        {status === "error" ? (
          <div className="tx-error" role="status">
            <AlertCircle size={16} aria-hidden="true" />
            <p>
              你取消了钱包签名；没有创建订单，也没有资金进入合约。
            </p>
          </div>
        ) : null}

        {status === "success" ? (
          <div className="tx-proof">
            <div>
              <SourceTag tone="onchain">Onchain</SourceTag>
              <CopyValue
                value={orderTx}
                display="0xb7e4…9c21"
                label="复制完整交易哈希"
              />
            </div>
            <ExplorerLink
              hash={orderTx}
              display="Explorer"
              label="订单交易"
            />
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function SettlementScreen({
  mode = "success",
  wallet = null,
  onConnect = () => undefined,
}: {
  mode?: DemoSettlementMode;
  wallet?: ConnectedWallet | null;
  onConnect?: () => void;
}) {
  const { view, reload } = useCampaignData(mode);
  const countdown = useCountdown(view.deadline);
  const onchain = view.source === "onchain";
  const [claimStatus, setClaimStatus] = useState<"idle" | "pending" | "claimed">(
    "idle",
  );
  const [txFeedback, setTxFeedback] = useState<{
    action: CampaignWriteAction;
    kind: "pending" | "error" | "confirmed";
    message?: string;
    hash?: Hex;
  } | null>(null);

  // 结果口径：已清算（state ≥ Succeeded）读链上写入值；未清算读 previewSettlement
  // 实时预览并明示"清算未发生"。金额全程 wei bigint，显示才 formatUnits。
  const settled = view.settled;
  const success = settled ? (view.settlement?.success ?? false) : view.preview.feasible;
  const feasibleCount = view.factoryTiers.filter((tier) => tier.feasible).length;
  const clearingWei = settled
    ? (view.settlement?.clearingPrice ?? 0n)
    : view.preview.feasible
      ? view.preview.clearingPrice
      : 0n;
  const winnerCount = settled
    ? (view.settlement?.winnerCount ?? 0n)
    : view.preview.feasible
      ? view.preview.winnerCount
      : 0n;
  const receivableWei = settled
    ? (view.settlement?.factoryReceivable ?? 0n)
    : view.preview.feasible
      ? view.preview.clearingPrice * view.preview.winnerCount
      : 0n;
  const winningQuoteIndex = Number(
    settled ? (view.settlement?.winningQuoteId ?? 0n) : view.preview.quoteId,
  );
  const winningTierIndex = Number(
    settled ? (view.settlement?.winningTierIndex ?? 0n) : view.preview.tierIndex,
  );
  const winningTier = success
    ? view.quotes[winningQuoteIndex]?.tiers[winningTierIndex]
    : undefined;
  const winnerName = view.quoteNames[winningQuoteIndex] ?? "Factory";
  const minMoq = view.factoryTiers.reduce(
    (min, tier) => Math.min(min, tier.quantity),
    Number.POSITIVE_INFINITY,
  );
  const minMoqText = Number.isFinite(minMoq) ? String(minMoq) : "0";

  // 连接钱包的凭证：买家订单或中标工厂身份（接口文档 2.1 领取权限）。
  const myOrder = wallet
    ? view.orders.find(
        (order) => order.buyer.toLowerCase() === wallet.address.toLowerCase(),
      )
    : undefined;
  const isSelectedFactory = Boolean(
    settled &&
      success &&
      wallet &&
      view.settlement &&
      view.settlement.selectedFactory.toLowerCase() === wallet.address.toLowerCase(),
  );
  const isWinner = Boolean(success && myOrder && myOrder.maxPriceWei >= clearingWei);
  const refundWei = !myOrder
    ? 0n
    : !settled
      ? 0n
      : success
        ? isWinner
          ? myOrder.maxPriceWei - clearingWei
          : myOrder.maxPriceWei
        : myOrder.maxPriceWei;
  const fixtureRefund = mode === "success" ? "0.005" : "0.024";
  const pendingAction = txFeedback?.kind === "pending" ? txFeedback.action : null;

  // fixture 降级路径保留演示用模拟领取（页面标 OFF-CHAIN DEMO）。
  function claimRefund() {
    if (claimStatus !== "idle") return;
    setClaimStatus("pending");
    window.setTimeout(() => setClaimStatus("claimed"), 1000);
  }

  async function runWrite(action: CampaignWriteAction) {
    if (!wallet) {
      onConnect();
      return;
    }
    if (wallet.chainId !== INJECTIVE_EVM_TESTNET_CHAIN_ID) {
      try {
        await switchToInjectiveNetwork();
      } catch {
        setTxFeedback({
          action,
          kind: "error",
          message: "请先切换到 Injective EVM Testnet（Chain ID 1439）。",
        });
        return;
      }
    }
    setTxFeedback({ action, kind: "pending" });
    try {
      const hash = await writeCampaignAction(action, view.address, wallet.address);
      setTxFeedback({ action, kind: "confirmed", hash });
      reload();
    } catch (err) {
      setTxFeedback({ action, kind: "error", message: describeWriteError(err) });
    }
  }

  return (
    <div className="screen-stack settlement-ledger" data-surface="ink">
      <section className="settlement-hero" data-success={success}>
        <div className="settlement-icon">
          {success ? (
            <CheckCircle2 size={28} aria-hidden="true" />
          ) : (
            <RotateCcw size={28} aria-hidden="true" />
          )}
        </div>
        {onchain ? (
          <SourceTag tone="onchain">Onchain Result</SourceTag>
        ) : (
          <SourceTag tone="offchain">Off-chain Demo</SourceTag>
        )}
        <span className="settlement-code">
          {settled
            ? success
              ? "SETTLED / SUCCESS"
              : "SETTLED / FAILED"
            : "OPEN / PREVIEW"}
        </span>
        <h2>
          {settled
            ? success
              ? "生产批次成立"
              : "清算未达到生产门槛"
            : "清算尚未发生"}
        </h2>
        <p>
          {settled
            ? success
              ? `生产批次成立：${winnerName} 的 ${winningTier?.minQty ?? 0} 件档位可行，统一价为 ${formatInj(clearingWei)} test INJ。`
              : "没有任何 MOQ 档位获得足够的已担保订单。所有参与者均可领取全额退款。"
            : view.preview.feasible
              ? `未到 deadline，清算未发生。当前预览：${winnerName} 的 ${winningTier?.minQty ?? 0} 件档位可成批，预览统一价 ${formatInj(view.preview.clearingPrice)} test INJ。`
              : "未到 deadline，清算未发生。当前预览：没有任何档位达到 MOQ。"}
        </p>
      </section>

      {success ? (
        <section className="surface settlement-metrics">
          <SectionLabel index="01">
            {settled ? "最终清算" : "当前预览"}
          </SectionLabel>
          <div className="settlement-grid">
            <Metric label="统一成交价" value={formatInj(clearingWei)} suffix="INJ" />
            <Metric label="成交订单" value={String(winnerCount)} suffix="笔" />
            <Metric
              label="中标 MOQ"
              value={String(winningTier?.minQty ?? 0)}
              suffix="件"
            />
            <Metric label="工厂应收" value={formatInj(receivableWei)} suffix="INJ" />
          </div>
        </section>
      ) : (
        <section className="surface failure-summary">
          <SectionLabel index="01">
            {settled ? "失败原因" : "当前预览"}
          </SectionLabel>
          <div className="failure-row">
            <span>最低 MOQ</span>
            <strong>{minMoqText} 件</strong>
          </div>
          <div className="failure-row">
            <span>有效资金订单</span>
            <strong>{view.ordersLength} 笔</strong>
          </div>
          <div className="failure-row">
            <span>工厂应收</span>
            <strong>{formatInj(receivableWei)} test INJ</strong>
          </div>
        </section>
      )}

      {!settled ? (
        <section className="surface">
          <span className="mono-note">PUBLIC SETTLEMENT</span>
          <div className="money-flow">
            <div>
              <span>距离截止</span>
              <strong>{countdown.label}</strong>
            </div>
            <div>
              <span>清算状态</span>
              <strong>{countdown.expired ? "已截止，可清算" : "未发生"}</strong>
            </div>
          </div>
          <p className="field-help">
            未到 deadline，清算未发生。截止后任何人都可以发起这笔公开 settle
            交易，结果由合约唯一确定。
          </p>
          <button
            className="action-button action-button-dark"
            type="button"
            aria-busy={pendingAction === "settle"}
            disabled={pendingAction === "settle"}
            onClick={() => runWrite("settle")}
          >
            {pendingAction === "settle" ? (
              <LoaderCircle className="spin" size={17} aria-hidden="true" />
            ) : (
              <LockKeyhole size={17} aria-hidden="true" />
            )}
            {pendingAction === "settle"
              ? "交易已提交，等待 Injective 确认…"
              : wallet
                ? "发起清算 settle"
                : "连接钱包发起清算"}
          </button>
          {txFeedback?.action === "settle" && txFeedback.kind === "error" ? (
            <div className="tx-error" role="status">
              <AlertCircle size={16} aria-hidden="true" />
              <p>{txFeedback.message}</p>
            </div>
          ) : null}
          {txFeedback?.action === "settle" &&
          txFeedback.kind === "confirmed" &&
          txFeedback.hash ? (
            <div className="tx-proof">
              <div>
                <SourceTag tone="onchain">Onchain</SourceTag>
                <CopyValue
                  value={txFeedback.hash}
                  display={shortenAddress(txFeedback.hash)}
                  label="复制清算交易哈希"
                />
              </div>
              <ExplorerLink
                hash={txFeedback.hash}
                display="Explorer"
                label="清算交易"
              />
            </div>
          ) : null}
        </section>
      ) : null}

      <section className="surface explanation-card">
        <SectionLabel index="02">为什么是这个结果</SectionLabel>
        <ol>
          <li>
            <span>01</span>
            <p>
              合约冻结了 <strong>{view.ordersLength} 笔</strong>消费者订单与{" "}
              {view.factoriesCount} 家工厂报价。
            </p>
          </li>
          <li>
            <span>02</span>
            <p>
              {success
                ? `在 ${formatInj(clearingWei)} 的价格点，有 ${Number(winnerCount)} 笔 maxPrice 足够的订单。`
                : `任何价格点都没有至少 ${minMoqText} 笔满足条件的订单。`}
            </p>
          </li>
          <li>
            <span>03</span>
            <p>
              {settled
                ? success
                  ? feasibleCount === 1
                    ? `${winnerName} 满足 MOQ，且为唯一可行档位，因此成为唯一中标档位。`
                    : `${winnerName} 满足 MOQ，且总成本最低，因此成为唯一中标档位。`
                  : "没有工厂满足开工门槛，因此 Campaign 进入 Failed。"
                : success
                  ? `${winnerName} 当前满足 MOQ，若现在截止将成为中标档位。`
                  : "当前没有工厂满足开工门槛；截止时仍无则 Campaign 进入 Failed。"}
            </p>
          </li>
        </ol>
      </section>

      <section className="receipt-card">
        <div className="receipt-head">
          <div className="receipt-icon">
            <ReceiptText size={20} aria-hidden="true" />
          </div>
          <div>
            <span className="mono-note">MY RECEIPT</span>
            <CopyValue
              value={wallet?.address ?? demoWallet}
              display={shortenAddress(wallet?.address ?? demoWallet)}
              label="复制完整钱包地址"
            />
          </div>
          {onchain ? (
            <SourceTag tone="onchain">Onchain</SourceTag>
          ) : (
            <SourceTag tone="offchain">Off-chain Demo</SourceTag>
          )}
        </div>

        {!onchain ? (
          <>
            <div className="receipt-lines">
              <div>
                <span>预锁上限</span>
                <strong>0.024 test INJ</strong>
              </div>
              <div>
                <span>最终应付</span>
                <strong>{success ? "0.019" : "0"} test INJ</strong>
              </div>
              <div className="receipt-refund">
                <span>可领取退款</span>
                <strong>{fixtureRefund} test INJ</strong>
              </div>
            </div>
            <WeiDebug
              amount={fixtureRefund}
              wei={success ? "5000000000000000" : "24000000000000000"}
            />
            <button
              className="action-button receipt-claim"
              data-claimed={claimStatus === "claimed"}
              type="button"
              aria-busy={claimStatus === "pending"}
              disabled={claimStatus !== "idle"}
              onClick={claimRefund}
            >
              {claimStatus === "pending" ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : claimStatus === "claimed" ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <CircleDollarSign size={17} aria-hidden="true" />
              )}
              {claimStatus === "pending"
                ? "等待钱包确认…"
                : claimStatus === "claimed"
                  ? "退款已领取"
                  : `领取 ${fixtureRefund} test INJ`}
            </button>
            <p className="honesty-note">
              <AlertCircle size={14} aria-hidden="true" />
              这是一笔主动领取交易。其他人的领取失败不会影响你。
            </p>
          </>
        ) : !wallet ? (
          <>
            <div className="receipt-lines">
              <div>
                <span>钱包</span>
                <strong>未连接 · 只读</strong>
              </div>
            </div>
            <button
              className="action-button receipt-claim"
              type="button"
              onClick={onConnect}
            >
              <WalletCards size={17} aria-hidden="true" />
              连接钱包查看凭证
            </button>
            <p className="honesty-note">
              <AlertCircle size={14} aria-hidden="true" />
              未连接钱包时结果页只读可用；连接后显示你的订单与可领取金额。
            </p>
          </>
        ) : myOrder ? (
          <>
            <div className="receipt-lines">
              <div>
                <span>预锁上限</span>
                <strong>{formatInj(myOrder.maxPriceWei)} test INJ</strong>
              </div>
              <div>
                <span>最终应付</span>
                <strong>
                  {settled
                    ? `${isWinner ? formatInj(clearingWei) : "0"} test INJ`
                    : "待清算"}
                </strong>
              </div>
              <div className="receipt-refund">
                <span>可领取退款</span>
                <strong>
                  {settled ? `${formatInj(refundWei)} test INJ` : "待清算"}
                </strong>
              </div>
            </div>
            <WeiDebug
              amount={settled ? formatInj(refundWei) : "待清算"}
              wei={settled ? refundWei.toString() : "—"}
            />
            <button
              className="action-button receipt-claim"
              data-claimed={myOrder.refundClaimed}
              type="button"
              aria-busy={pendingAction === "claimRefund"}
              disabled={
                !settled ||
                myOrder.refundClaimed ||
                pendingAction === "claimRefund"
              }
              onClick={() => runWrite("claimRefund")}
            >
              {pendingAction === "claimRefund" ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : myOrder.refundClaimed ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <CircleDollarSign size={17} aria-hidden="true" />
              )}
              {pendingAction === "claimRefund"
                ? "等待钱包确认…"
                : myOrder.refundClaimed
                  ? "退款已领取"
                  : !settled
                    ? "清算完成后才能领取"
                    : refundWei === 0n
                      ? "无需退款 · 点击标记领取"
                      : `领取 ${formatInj(refundWei)} test INJ`}
            </button>
            {txFeedback?.action === "claimRefund" &&
            txFeedback.kind === "error" ? (
              <div className="tx-error" role="status">
                <AlertCircle size={16} aria-hidden="true" />
                <p>{txFeedback.message}</p>
              </div>
            ) : null}
            {txFeedback?.action === "claimRefund" &&
            txFeedback.kind === "confirmed" &&
            txFeedback.hash ? (
              <div className="tx-proof">
                <div>
                  <SourceTag tone="onchain">Onchain</SourceTag>
                  <CopyValue
                    value={txFeedback.hash}
                    display={shortenAddress(txFeedback.hash)}
                    label="复制领取交易哈希"
                  />
                </div>
                <ExplorerLink
                  hash={txFeedback.hash}
                  display="Explorer"
                  label="领取交易"
                />
              </div>
            ) : null}
            <p className="honesty-note">
              <AlertCircle size={14} aria-hidden="true" />
              这是一笔主动领取交易。其他人的领取失败不会影响你。
            </p>
          </>
        ) : isSelectedFactory && view.settlement ? (
          <>
            <div className="receipt-lines">
              <div>
                <span>角色</span>
                <strong>中标工厂</strong>
              </div>
              <div className="receipt-refund">
                <span>可领取应收</span>
                <strong>{formatInj(receivableWei)} test INJ</strong>
              </div>
            </div>
            <WeiDebug
              amount={formatInj(receivableWei)}
              wei={receivableWei.toString()}
            />
            <button
              className="action-button receipt-claim"
              data-claimed={view.settlement.factoryPayoutClaimed}
              type="button"
              aria-busy={pendingAction === "claimPayout"}
              disabled={
                view.settlement.factoryPayoutClaimed ||
                pendingAction === "claimPayout"
              }
              onClick={() => runWrite("claimPayout")}
            >
              {pendingAction === "claimPayout" ? (
                <LoaderCircle className="spin" size={17} aria-hidden="true" />
              ) : view.settlement.factoryPayoutClaimed ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <CircleDollarSign size={17} aria-hidden="true" />
              )}
              {pendingAction === "claimPayout"
                ? "等待钱包确认…"
                : view.settlement.factoryPayoutClaimed
                  ? "货款已领取"
                  : `领取工厂应收 ${formatInj(receivableWei)} test INJ`}
            </button>
            {txFeedback?.action === "claimPayout" &&
            txFeedback.kind === "error" ? (
              <div className="tx-error" role="status">
                <AlertCircle size={16} aria-hidden="true" />
                <p>{txFeedback.message}</p>
              </div>
            ) : null}
            {txFeedback?.action === "claimPayout" &&
            txFeedback.kind === "confirmed" &&
            txFeedback.hash ? (
              <div className="tx-proof">
                <div>
                  <SourceTag tone="onchain">Onchain</SourceTag>
                  <CopyValue
                    value={txFeedback.hash}
                    display={shortenAddress(txFeedback.hash)}
                    label="复制领取交易哈希"
                  />
                </div>
                <ExplorerLink
                  hash={txFeedback.hash}
                  display="Explorer"
                  label="领取交易"
                />
              </div>
            ) : null}
          </>
        ) : (
          <>
            <div className="receipt-lines">
              <div>
                <span>订单</span>
                <strong>当前钱包在此 Campaign 没有订单</strong>
              </div>
            </div>
            <p className="honesty-note">
              <AlertCircle size={14} aria-hidden="true" />
              只有下单地址与中标工厂有领取操作；结果页保持只读。
            </p>
          </>
        )}
      </section>

      <section className="surface evidence-list">
        <SectionLabel index="03">链上证据</SectionLabel>
        <div className="evidence-row">
          <span>Campaign tx</span>
          {onchain ? (
            view.openedTxHash ? (
              <>
                <CopyValue
                  value={view.openedTxHash}
                  display={shortenAddress(view.openedTxHash)}
                  label="复制 Campaign 交易哈希"
                />
                <ExplorerLink
                  hash={view.openedTxHash}
                  display="Explorer"
                  label="Campaign 交易"
                />
              </>
            ) : (
              <span>—</span>
            )
          ) : (
            <>
              <CopyValue
                value={campaignTx}
                display="0x98E2…B771"
                label="复制 Campaign 交易哈希"
              />
              <ExplorerLink
                hash={campaignTx}
                display="Explorer"
                label="Campaign 交易"
              />
            </>
          )}
        </div>
        <div className="evidence-row">
          <span>Settlement tx</span>
          {onchain ? (
            settled && view.settledTxHash ? (
              <>
                <CopyValue
                  value={view.settledTxHash}
                  display={shortenAddress(view.settledTxHash)}
                  label="复制清算交易哈希"
                />
                <ExplorerLink
                  hash={view.settledTxHash}
                  display="Explorer"
                  label="清算交易"
                />
              </>
            ) : (
              <span>清算未发生</span>
            )
          ) : (
            <>
              <CopyValue
                value={settlementTx}
                display="0x43a9…ec18"
                label="复制清算交易哈希"
              />
              <ExplorerLink
                hash={settlementTx}
                display="Explorer"
                label="清算交易"
              />
            </>
          )}
        </div>
        <div className="evidence-row">
          <span>Manifest hash</span>
          <CopyValue
            value={view.manifestHash}
            display={shortenAddress(view.manifestHash)}
            label="复制完整 Manifest hash"
          />
          <SourceTag tone="human">HUMAN CONFIRMED</SourceTag>
        </div>
      </section>

      {success ? (
        <section className="production-demo">
          <SourceTag tone="offchain">Off-chain Demo</SourceTag>
          <div>
            <strong>生产准备中</strong>
            <p>
              以下生产进度为链下演示状态，不代表合约验证了真实制造或物流。
            </p>
          </div>
        </section>
      ) : null}
    </div>
  );
}

export function PlaceholderScreen({ label }: { label: string }) {
  return (
    <section className="placeholder-panel" aria-label={`${label}页面`}>
      <p className="placeholder-index">NEXT BUILD</p>
      <h2>{label}模块正在装配</h2>
      <p>本批次先完成需求编译与 Campaign。订单和清算会在下一笔提交接上。</p>
    </section>
  );
}
