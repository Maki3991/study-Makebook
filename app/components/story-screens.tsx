"use client";

import Image from "next/image";
import {
  AlertCircle,
  Check,
  CheckCircle2,
  ChevronDown,
  Factory,
  LoaderCircle,
  PencilLine,
  Quote,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import {
  candidates,
  demandPoints,
  factoryTiers,
  sourceComments,
} from "../lib/mock-data";
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
            <SourceTag tone="ai">Interest signal</SourceTag>
            <Metric label="评论 / 访谈样本" value="72" suffix="条" />
            <p>说明方向值得研究，不参与清算。</p>
          </div>
          <div className="surface signal-card">
            <SourceTag tone="onchain">Funded orders</SourceTag>
            <Metric label="已预锁资金订单" value="4" suffix="笔" />
            <p>钱包已预锁 maxPrice，进入清算。</p>
          </div>
        </div>
      </section>

      <section className="surface">
        <SectionLabel
          index="02"
          aside={<span className="mono-note">ORDER BOOK / LIVE</span>}
        >
          资金需求曲线
        </SectionLabel>
        <div
          className="demand-chart"
          role="img"
          aria-label="价格越高，满足最高愿付价的链上订单数越少。0.019 test INJ 时有 4 笔订单。"
        >
          <div className="chart-y-label">预锁订单数</div>
          <div className="chart-bars">
            {demandPoints.map((point) => (
              <div className="chart-column" key={point.price}>
                <span className="chart-value">{point.orders}</span>
                <div
                  className="chart-bar"
                  style={{ height: `${point.orders * 18}%` }}
                />
                <span className="chart-price">{point.price}</span>
              </div>
            ))}
            <div className="tier-line" aria-hidden="true">
              <span>LOOM · MOQ 3 @ 0.019</span>
            </div>
          </div>
          <div className="chart-x-label">最高愿付价 / test INJ</div>
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
          <strong>如果现在截止，Factory Loom 的 3 件档位可成批。</strong>
          <p>最终结果只在截止后由合约清算；此处不是承诺。</p>
        </div>
      </section>
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
