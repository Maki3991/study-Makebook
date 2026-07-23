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
  Sparkles,
  WalletCards,
} from "lucide-react";
import { useState, type CSSProperties } from "react";
import {
  candidates,
  demandPoints,
  factoryTiers,
  sourceComments,
} from "../lib/mock-data";
import type {
  ContractReadState,
  DemoNetworkState,
  DemoSettlementMode,
  DemoSignatureMode,
} from "./demo-panel";
import {
  CopyValue,
  ExplorerLink,
  Metric,
  SectionLabel,
  SourceTag,
  WeiDebug,
} from "./ui";

const demoWallet = "0x7F2A9c70B4F22E6A1D640bc7A64E2F44AC0D41C2";
const orderTx =
  "0xb7e4a907dd3aab90bf47e4ae41206935894d57f2652be72492da95fdc18e9c21";
const campaignTx =
  "0x98e219d3128ff183f4a0d45ca0d31fa764449259abb1bc43153475c4ad54b771";
const settlementTx =
  "0x43a90f856e8c0ddcb4af2e7d2fe812936f21159c25df5f8c1683cae0444fec18";
const manifestHash =
  "0x7a19d62642359562ca0612e56b9f04171a802f5d2200b4e9867cbc6445c4be42";

function decimalToWei(value: string) {
  const [whole = "0", decimal = ""] = value.split(".");
  const normalizedDecimal = `${decimal}000000000000000000`.slice(0, 18);
  return (
    BigInt(whole || "0") * 10n ** 18n +
    BigInt(normalizedDecimal || "0")
  ).toString();
}

export function StudioScreen() {
  const [selectedId, setSelectedId] = useState("FRAME-01");
  const [status, setStatus] = useState<"idle" | "compiling" | "ready">("ready");
  const [confirmed, setConfirmed] = useState(false);
  const selected =
    candidates.find((candidate) => candidate.id === selectedId) ?? candidates[0];

  function compileDemand() {
    setStatus("compiling");
    setConfirmed(false);
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
          ) : (
            <Sparkles size={17} aria-hidden="true" />
          )}
          {status === "compiling" ? "正在编译需求…" : "重新生成候选 SKU"}
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
                setConfirmed(false);
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

        <section className="surface candidate-detail">
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
              <p>确认后才生成可进入资金流程的 manifest。</p>
            </div>
            <button
              className="action-button"
              data-confirmed={confirmed}
              type="button"
              onClick={() => setConfirmed((value) => !value)}
            >
              {confirmed ? (
                <CheckCircle2 size={17} aria-hidden="true" />
              ) : (
                <PencilLine size={17} aria-hidden="true" />
              )}
              {confirmed ? "已确认，可进入 Campaign" : "编辑并确认方向"}
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
}: {
  readState?: ContractReadState;
  onRetry?: () => void;
}) {
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
          <strong>12 : 36 : 08</strong>
        </div>
        <span className="clock-state">正在接单</span>
      </section>

      {readState === "ready" ? (
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
            <SourceTag tone="onchain">Onchain</SourceTag>
            <Metric label="已预锁资金订单" value="6" suffix="笔" />
            <p>钱包已预锁 maxPrice，进入清算。</p>
          </div>
        </div>
      </section>

      <section className="surface demand-curve-card">
        <SectionLabel
          index="02"
          aside={<span className="mono-note">ORDER BOOK / LIVE</span>}
        >
          资金需求曲线
        </SectionLabel>
        <div
          className="demand-chart"
          role="img"
          aria-label="AI 兴趣样本与链上预锁订单分别显示。链上曲线表示价格越高，满足最高愿付价的订单越少。Factory Loom 的 5 件档位在 0.019 test INJ 可行并中标，Factory North 的 3 件档位在 0.024 test INJ 不可行。"
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
              <SourceTag tone="onchain">Onchain</SourceTag>
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
              {[40, 80, 120, 160, 200, 240, 280].map((y) => (
                <line key={y} x1="64" x2="586" y1={y} y2={y} />
              ))}
            </g>

            <g className="chart-axis-labels">
              {["6", "5", "4", "3", "2", "1", "0"].map((value, index) => (
                <text key={value} x="44" y={44 + index * 40} textAnchor="end">
                  {value}
                </text>
              ))}
              {demandPoints.map((point, index) => (
                <text
                  key={point.price}
                  x={94 + index * 112}
                  y="306"
                  textAnchor="middle"
                >
                  {point.price}
                </text>
              ))}
            </g>

            <g className="chart-order-bars">
              {demandPoints.map((point, index) => {
                const height = point.orders * 40;
                return (
                  <g key={point.price}>
                    <rect
                      x={67 + index * 112}
                      y={280 - height}
                      width="54"
                      height={height}
                      rx="7"
                    />
                    <text
                      x={94 + index * 112}
                      y={270 - height}
                      textAnchor="middle"
                    >
                      {point.orders}
                    </text>
                  </g>
                );
              })}
            </g>

            <path
              className="funded-step-line"
              d="M94 40 H206 V80 H318 V160 H430 V200 H542 V240"
            />

            <g className="factory-threshold factory-threshold-winner">
              <line x1="166" x2="586" y1="80" y2="80" />
              <circle cx="206" cy="80" r="7" />
              <rect x="356" y="50" width="220" height="23" rx="4" />
              <text x="566" y="66" textAnchor="end">
                WINNER · LOOM · MOQ 5 @ 0.019
              </text>
            </g>

            <g className="factory-threshold factory-threshold-missed">
              <line x1="390" x2="586" y1="160" y2="160" />
              <path d="M426 154 l12 12 M438 154 l-12 12" />
              <rect x="356" y="169" width="220" height="23" rx="4" />
              <text x="566" y="185" textAnchor="end">
                MISSED · NORTH · MOQ 3 @ 0.024
              </text>
            </g>

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
          {factoryTiers.map((tier) => (
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
          <strong>如果现在截止，Factory Loom 的 5 件档位可成批。</strong>
          <p>最终结果只在截止后由合约清算；此处不是承诺。</p>
        </div>
      </section>
        </>
      ) : (
        <ContractReadFallback state={readState} onRetry={onRetry} />
      )}
    </div>
  );
}

const priceOptions = ["0.019", "0.021", "0.024", "0.026"];

export function OrderScreen({
  networkState = "correct",
  signatureMode = "success",
}: {
  networkState?: DemoNetworkState;
  signatureMode?: DemoSignatureMode;
}) {
  const [maxPrice, setMaxPrice] = useState("0.024");
  const [acknowledged, setAcknowledged] = useState(false);
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);
  const [status, setStatus] = useState<
    "idle" | "pending" | "success" | "error"
  >("idle");
  const clearingPrice = 0.019;
  const numericPrice = Number(maxPrice) || 0;
  const estimatedRefund = Math.max(numericPrice - clearingPrice, 0);
  const canSubmit =
    acknowledged &&
    publicAcknowledged &&
    numericPrice > 0 &&
    networkState === "correct" &&
    status === "idle";

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
        data-network-error={networkState === "wrong"}
      >
        <div className="wallet-status-icon">
          <WalletCards size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="mono-note">CONNECTED WALLET</span>
          <CopyValue
            value={demoWallet}
            display="0x7F2A…41C2"
            label="复制完整钱包地址"
          />
          <p>
            {networkState === "correct"
              ? "Injective EVM Testnet · Chain ID 1439"
              : "Unknown network · Chain ID 1"}
          </p>
        </div>
        <SourceTag tone="testnet">
          {networkState === "correct" ? "Testnet" : "Wrong Network"}
        </SourceTag>
      </section>

      {networkState === "wrong" ? (
        <section className="inline-error" role="status">
          <AlertCircle size={18} aria-hidden="true" />
          <p>
            当前不是 Injective EVM Testnet（Chain ID
            1439）。切换网络后再继续。
          </p>
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

      <section className="surface">
        <SectionLabel index="02">资金如何变化</SectionLabel>
        <div className="money-flow">
          <div>
            <span>现在预锁</span>
            <strong>{numericPrice.toFixed(3)} test INJ</strong>
          </div>
          <ArrowUpRight size={18} aria-hidden="true" />
          <div>
            <span>若按当前预览清算</span>
            <strong>{clearingPrice.toFixed(3)} test INJ</strong>
          </div>
        </div>
        <div className="refund-preview">
          <CircleDollarSign size={18} aria-hidden="true" />
          <div>
            <span>预计可领取差额</span>
            <strong>{estimatedRefund.toFixed(3)} test INJ</strong>
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
            你将预锁 0.024 test INJ。若统一价不高于它，你会获得 1 件
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
          disabled={
            (!canSubmit && status !== "success" && status !== "error") ||
            status === "pending"
          }
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
}: {
  mode?: DemoSettlementMode;
}) {
  const [claimStatus, setClaimStatus] = useState<"idle" | "pending" | "claimed">(
    "idle",
  );
  const success = mode === "success";
  const refund = success ? "0.005" : "0.024";

  function claimRefund() {
    if (claimStatus !== "idle") return;
    setClaimStatus("pending");
    window.setTimeout(() => setClaimStatus("claimed"), 1000);
  }

  return (
    <div className="screen-stack">
      <section className="settlement-hero" data-success={success}>
        <div className="settlement-icon">
          {success ? (
            <CheckCircle2 size={28} aria-hidden="true" />
          ) : (
            <RotateCcw size={28} aria-hidden="true" />
          )}
        </div>
        <SourceTag tone="onchain">Onchain Result</SourceTag>
        <span className="settlement-code">
          {success ? "SETTLED / SUCCESS" : "SETTLED / FAILED"}
        </span>
        <h2>
          {success ? "生产批次成立。" : "清算未达到生产门槛。"}
        </h2>
        <p>
          {success
            ? "生产批次成立：Factory Loom 的 5 件档位可行，统一价为 0.019 test INJ。"
            : "没有任何 MOQ 档位获得足够的已担保订单。所有参与者均可领取全额退款。"}
        </p>
      </section>

      {success ? (
        <section className="surface settlement-metrics">
          <SectionLabel index="01">最终清算</SectionLabel>
          <div className="settlement-grid">
            <Metric label="统一成交价" value="0.019" suffix="INJ" />
            <Metric label="成交订单" value="5" suffix="笔" />
            <Metric label="中标 MOQ" value="5" suffix="件" />
            <Metric label="工厂应收" value="0.095" suffix="INJ" />
          </div>
        </section>
      ) : (
        <section className="surface failure-summary">
          <SectionLabel index="01">失败原因</SectionLabel>
          <div className="failure-row">
            <span>最低 MOQ</span>
            <strong>5 件</strong>
          </div>
          <div className="failure-row">
            <span>有效资金订单</span>
            <strong>2 笔</strong>
          </div>
          <div className="failure-row">
            <span>工厂应收</span>
            <strong>0 test INJ</strong>
          </div>
        </section>
      )}

      <section className="surface explanation-card">
        <SectionLabel index="02">为什么是这个结果</SectionLabel>
        <ol>
          <li>
            <span>01</span>
            <p>
              合约冻结了 <strong>{success ? "5" : "2"} 笔</strong>消费者订单与
              2 家工厂报价。
            </p>
          </li>
          <li>
            <span>02</span>
            <p>
              {success
                ? "在 0.019 的价格点，有 5 笔 maxPrice 足够的订单。"
                : "任何价格点都没有至少 5 笔满足条件的订单。"}
            </p>
          </li>
          <li>
            <span>03</span>
            <p>
              {success
                ? "Factory Loom 满足 MOQ，且总成本最低，因此成为唯一中标档位。"
                : "没有工厂满足开工门槛，因此 Campaign 进入 Failed。"}
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
              value={demoWallet}
              display="0x7F2A…41C2"
              label="复制完整钱包地址"
            />
          </div>
          <SourceTag tone="onchain">Onchain</SourceTag>
        </div>
        <div className="receipt-lines">
          <div>
            <span>预锁上限</span>
            <strong>0.024 test INJ</strong>
          </div>
          <div>
            <span>{success ? "最终应付" : "最终应付"}</span>
            <strong>{success ? "0.019" : "0"} test INJ</strong>
          </div>
          <div className="receipt-refund">
            <span>可领取退款</span>
            <strong>{refund} test INJ</strong>
          </div>
        </div>
        <WeiDebug
          amount={refund}
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
              : `领取 ${refund} test INJ`}
        </button>
        <p className="honesty-note">
          <AlertCircle size={14} aria-hidden="true" />
          这是一笔主动领取交易。其他人的领取失败不会影响你。
        </p>
      </section>

      <section className="surface evidence-list">
        <SectionLabel index="03">链上证据</SectionLabel>
        <div className="evidence-row">
          <span>Campaign tx</span>
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
        </div>
        <div className="evidence-row">
          <span>Settlement tx</span>
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
        </div>
        <div className="evidence-row">
          <span>Manifest hash</span>
          <CopyValue
            value={manifestHash}
            display="0x7a19…be42"
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
