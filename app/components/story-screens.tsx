"use client";

import Image from "next/image";
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDollarSign,
  Copy,
  ExternalLink,
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
import { useState } from "react";
import {
  candidates,
  demandPoints,
  factoryTiers,
  sourceComments,
} from "../lib/mock-data";
import type { CSSProperties } from "react";
import { Metric, SectionLabel, SourceTag } from "./ui";

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
    <div className="screen-stack">
      <section className="surface input-surface">
        <SectionLabel
          index="01"
          aside={<span className="mono-note">20 条有效输入</span>}
        >
          原始需求
        </SectionLabel>
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

      <section>
        <SectionLabel
          index="02"
          aside={<SourceTag tone="ai">AI Generated</SourceTag>}
        >
          候选方向
        </SectionLabel>
        <div className="candidate-strip">
          {candidates.map((candidate) => (
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
              <span>{candidate.id}</span>
              <strong>{candidate.name}</strong>
              <small>{candidate.confidence}% confidence</small>
            </button>
          ))}
        </div>
      </section>

      <section className="surface candidate-detail">
        <div className="candidate-heading">
          <div>
            <span className="mono-note">{selected.id}</span>
            <h2>{selected.name}</h2>
          </div>
          <div className="confidence-ring" aria-label={`置信度 ${selected.confidence}%`}>
            {selected.confidence}
          </div>
        </div>

        <div className="spec-grid">
          {selected.specs.map((spec) => (
            <span key={spec}>{spec}</span>
          ))}
        </div>

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
          {confirmed ? "已人工确认，可进入 Campaign" : "编辑并确认这个方向"}
        </button>

        {confirmed ? (
          <div className="confirmation-proof">
            <SourceTag tone="human">Human Confirmed</SourceTag>
            <span>manifestHash · 0x7a19…be42</span>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function CampaignScreen() {
  return (
    <div className="screen-stack">
      <section className="product-hero">
        <Image
          src="/frame-01-hero.png"
          alt="FRAME-01 黑色 8L 模块化摄影斜挎包"
          fill
          priority
          sizes="(max-width: 540px) 100vw, 540px"
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
                  y="316"
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
            <text className="chart-x-title" x="586" y="316" textAnchor="end">
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
    </div>
  );
}

const priceOptions = ["0.019", "0.021", "0.024", "0.026"];

export function OrderScreen() {
  const [maxPrice, setMaxPrice] = useState("0.024");
  const [acknowledged, setAcknowledged] = useState(false);
  const [publicAcknowledged, setPublicAcknowledged] = useState(false);
  const [status, setStatus] = useState<"idle" | "pending" | "success">("idle");
  const clearingPrice = 0.019;
  const numericPrice = Number(maxPrice) || 0;
  const estimatedRefund = Math.max(numericPrice - clearingPrice, 0);
  const canSubmit =
    acknowledged &&
    publicAcknowledged &&
    numericPrice > 0 &&
    status === "idle";

  function submitOrder() {
    if (!canSubmit) return;
    setStatus("pending");
    window.setTimeout(() => setStatus("success"), 1200);
  }

  return (
    <div className="screen-stack">
      <section className="surface wallet-status-card">
        <div className="wallet-status-icon">
          <WalletCards size={20} aria-hidden="true" />
        </div>
        <div>
          <span className="mono-note">CONNECTED WALLET</span>
          <strong>0x7F2A…41C2</strong>
          <p>Injective EVM Testnet · Chain ID 1439</p>
        </div>
        <SourceTag tone="testnet">Testnet</SourceTag>
      </section>

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
          disabled={!canSubmit && status !== "success"}
          onClick={status === "success" ? () => setStatus("idle") : submitOrder}
        >
          {status === "pending" ? (
            <LoaderCircle className="spin" size={17} aria-hidden="true" />
          ) : status === "success" ? (
            <CheckCircle2 size={17} aria-hidden="true" />
          ) : (
            <LockKeyhole size={17} aria-hidden="true" />
          )}
          {status === "pending"
            ? "交易已提交，正在等待 Injective 确认。请不要重复点击。"
            : status === "success"
              ? "订单已上链 · 查看交易"
              : `签名并预锁 ${numericPrice.toFixed(3)} test INJ`}
        </button>

        {status === "success" ? (
          <div className="tx-proof">
            <div>
              <SourceTag tone="onchain">Onchain</SourceTag>
              <span>0xb7e4…9c21</span>
            </div>
            <button type="button" aria-label="复制交易哈希">
              <Copy size={14} aria-hidden="true" />
            </button>
          </div>
        ) : null}
      </section>
    </div>
  );
}

export function SettlementScreen() {
  const [mode, setMode] = useState<"success" | "failure">("success");
  const [claimStatus, setClaimStatus] = useState<"idle" | "pending" | "claimed">(
    "idle",
  );
  const success = mode === "success";
  const refund = success ? "0.005" : "0.024";

  function switchMode(nextMode: "success" | "failure") {
    setMode(nextMode);
    setClaimStatus("idle");
  }

  function claimRefund() {
    if (claimStatus !== "idle") return;
    setClaimStatus("pending");
    window.setTimeout(() => setClaimStatus("claimed"), 1000);
  }

  return (
    <div className="screen-stack">
      <div className="scenario-switch" aria-label="清算演示场景">
        <button
          type="button"
          data-active={success}
          onClick={() => switchMode("success")}
        >
          成功 Campaign
        </button>
        <button
          type="button"
          data-active={!success}
          onClick={() => switchMode("failure")}
        >
          失败 Campaign
        </button>
      </div>

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
            <strong>0x7F2A…41C2</strong>
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
        <button
          className="action-button receipt-claim"
          data-claimed={claimStatus === "claimed"}
          type="button"
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
        {[
          ["Campaign", "0x98E2…B771"],
          ["Settlement tx", "0x43a9…ec18"],
          ["Manifest hash", "0x7a19…be42"],
        ].map(([label, value]) => (
          <button type="button" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <ExternalLink size={14} aria-hidden="true" />
          </button>
        ))}
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
