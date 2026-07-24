"use client";

import { ArrowRight, Check, Settings2, WalletCards } from "lucide-react";
import Image from "next/image";
import { useState } from "react";
import { useCampaignData } from "../lib/chain/use-campaign";
import { shortenAddress, useWallet } from "../lib/chain/wallet";
import { storySteps, type StoryStepId } from "../lib/mock-data";
import {
  DemoPanel,
  type ContractReadState,
  type DemoNetworkState,
  type DemoSettlementMode,
  type DemoSignatureMode,
} from "./demo-panel";
import {
  CampaignScreen,
  OrderScreen,
  SettlementScreen,
  StudioScreen,
} from "./story-screens";
import { SourceTag } from "./ui";

export function MakebookApp() {
  const [activeStep, setActiveStep] = useState<StoryStepId>("studio");
  const [studioConfirmed, setStudioConfirmed] = useState(true);
  const [demoOpen, setDemoOpen] = useState(false);
  const [readState, setReadState] = useState<ContractReadState>("ready");
  const [networkState, setNetworkState] =
    useState<DemoNetworkState>("correct");
  const [settlementMode, setSettlementMode] =
    useState<DemoSettlementMode>("success");
  const [signatureMode, setSignatureMode] =
    useState<DemoSignatureMode>("success");
  // 真实浏览器钱包（EIP-1193）；header 按钮连接后显示截断地址、点击复制。
  const { wallet, connecting, connect } = useWallet();
  const [walletCopied, setWalletCopied] = useState(false);
  // hero 的"测试网资金订单"固定读 success Campaign 的 ordersLength（降级时回落 fixtures）。
  const { view: heroCampaign } = useCampaignData("success");
  const activeIndex = storySteps.findIndex((step) => step.id === activeStep);
  const active = storySteps[activeIndex];
  const next = storySteps[activeIndex + 1];

  async function copyWalletAddress() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setWalletCopied(true);
      window.setTimeout(() => setWalletCopied(false), 1200);
    } catch {
      setWalletCopied(false);
    }
  }

  function goToStep(stepId: StoryStepId) {
    const targetIndex = storySteps.findIndex((step) => step.id === stepId);
    if (targetIndex > 0 && !studioConfirmed) return;

    setActiveStep(stepId);

    if (window.innerWidth >= 1280) {
      document
        .getElementById(`stage-${stepId}`)
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function goToNext() {
    if (next) goToStep(next.id);
  }

  function renderScreen(stepId: StoryStepId) {
    if (stepId === "studio") {
      return (
        <StudioScreen
          confirmed={studioConfirmed}
          onConfirmedChange={setStudioConfirmed}
        />
      );
    }
    if (stepId === "campaign") {
      return (
        <CampaignScreen
          readState={readState}
          mode={settlementMode}
          onRetry={() => {
            setReadState("loading");
            window.setTimeout(() => setReadState("ready"), 900);
          }}
        />
      );
    }
    if (stepId === "order") {
      return (
        <OrderScreen
          networkState={networkState}
          signatureMode={signatureMode}
          wallet={wallet}
        />
      );
    }
    return (
      <SettlementScreen
        key={settlementMode}
        mode={settlementMode}
        wallet={wallet}
        onConnect={connect}
      />
    );
  }

  return (
    <div className="app-frame" data-active-step={activeStep}>
      <header className="app-header">
        <div className="brand-lockup" aria-label="MAKEBOOK 造物簿">
          <span className="brand-logo-image" aria-hidden="true" />
          <p className="brand-cn">造物簿 / MANUFACTURING CLEARING LEDGER</p>
        </div>
        <div className="header-actions">
          <span className="network-pill">
            <span className="network-name-short">Testnet</span>
            <span className="network-name-long">Injective Testnet</span>
          </span>
          <button
            className="wallet-pill demo-panel-trigger"
            type="button"
            aria-label="打开演示控制面板"
            onClick={() => setDemoOpen(true)}
          >
            <Settings2 size={15} strokeWidth={1.8} aria-hidden="true" />
            <span className="header-action-label">演示设置</span>
          </button>
          <button
            className="wallet-pill"
            type="button"
            aria-label={wallet ? `复制钱包地址 ${wallet.address}` : "连接钱包"}
            aria-busy={connecting}
            onClick={wallet ? copyWalletAddress : connect}
          >
            {walletCopied ? (
              <Check size={15} strokeWidth={1.8} aria-hidden="true" />
            ) : (
              <WalletCards size={15} strokeWidth={1.8} aria-hidden="true" />
            )}
            <span className="header-action-label">
              {wallet
                ? shortenAddress(wallet.address)
                : connecting
                  ? "连接中…"
                  : "连接钱包"}
            </span>
          </button>
        </div>
      </header>

      <nav className="story-rail" aria-label="产品演示步骤">
        {storySteps.map((step, index) => (
          <button
            key={step.id}
            className="story-step"
            type="button"
            data-active={step.id === activeStep}
            data-done={index < activeIndex}
            data-locked={index > 0 && !studioConfirmed}
            disabled={index > 0 && !studioConfirmed}
            aria-current={step.id === activeStep ? "step" : undefined}
            onClick={() => goToStep(step.id)}
          >
            <span className="story-number">0{index + 1}</span>
            <span className="story-label">{step.shortLabel}</span>
          </button>
        ))}
      </nav>

      <main className="app-main mobile-tablet-view">
        <div className="adaptive-page">
          <div className="screen-head">
            <p className="screen-kicker">{active.kicker}</p>
            <h1 className="screen-title">{active.title}</h1>
            <p className="screen-intro">{active.intro}</p>
            <div className="screen-task">
              <span>本步要做</span>
              <strong>{active.task}</strong>
            </div>
          </div>

          <div className="active-screen">{renderScreen(activeStep)}</div>
        </div>
      </main>

      <div className="desktop-shell">
        <aside className="desktop-step-nav" aria-label="完整步骤导航">
          <div className="desktop-nav-intro">
            <span>评审路径</span>
            <strong>从需求证据到链上凭证</strong>
            <p>四步同屏展开，所有演示数据标明来源。</p>
          </div>
          {storySteps.map((step, index) => (
            <button
              key={step.id}
              type="button"
              data-active={step.id === activeStep}
              data-locked={index > 0 && !studioConfirmed}
              disabled={index > 0 && !studioConfirmed}
              onClick={() => goToStep(step.id)}
            >
              <span>0{index + 1}</span>
              <div>
                <strong>{step.shortLabel}</strong>
                <small>{step.kicker}</small>
              </div>
              <ArrowRight size={16} strokeWidth={1.8} aria-hidden="true" />
            </button>
          ))}
        </aside>

        <main className="desktop-dashboard">
          <header className="dashboard-hero">
            <div className="dashboard-hero-copy">
              <div className="dashboard-hero-meta">
                <span>ACL / ADVENTUREX 2026</span>
                <span>LIVE PROTOTYPE · 01</span>
              </div>
              <p className="screen-kicker">FRAME-01 / PRODUCTION DEMAND RECORD</p>
              <h1>
                <span>先看见真实需求，</span>
                <span>再决定生产</span>
              </h1>
              <p>
                MAKEBOOK 把评论编译成可制造规格，再用测试网资金订单与工厂
                MOQ 报价形成公开清算。这里制造的是一个真实的包，不是代币行情。
              </p>
              <div className="dashboard-proof" aria-label="当前需求证据摘要">
                <div>
                  <strong>20</strong>
                  <span>真实评论输入</span>
                </div>
                <div>
                  <strong>
                    {String(heroCampaign.ordersLength).padStart(2, "0")}
                  </strong>
                  <span>测试网资金订单</span>
                </div>
                <div>
                  <strong>01</strong>
                  <span>当前可行档位</span>
                </div>
              </div>
              <div className="dashboard-flow" aria-label="产品四步流程">
                <span>Comments</span>
                <span>Manifest</span>
                <span>Escrow</span>
                <span>Clearing</span>
              </div>
            </div>

            <figure className="dashboard-product">
              <span className="dashboard-product-index">OBJECT / 01</span>
              <div className="dashboard-product-image">
                <Image
                  src="/frame-01-hero.webp"
                  alt="FRAME-01 黑色 8L 模块化摄影斜挎包"
                  fill
                  priority
                  unoptimized
                  sizes="(min-width: 1280px) 48vw, 100vw"
                />
                <div className="dashboard-product-tags">
                  <SourceTag tone="human">Human Confirmed</SourceTag>
                  <SourceTag tone="testnet">Testnet</SourceTag>
                </div>
              </div>
              <div className="dashboard-product-axis" aria-hidden="true">
                <span>COMMENT</span>
                <span>CAPITAL</span>
                <span>FACTORY</span>
                <span>RECEIPT</span>
              </div>
              <figcaption>
                <div>
                  <span>FRAME-01</span>
                  <strong>8L 模块摄影斜挎包</strong>
                </div>
                <dl>
                  <div>
                    <dt>CAPACITY</dt>
                    <dd>8L</dd>
                  </div>
                  <div>
                    <dt>COLOR</dt>
                    <dd>BLACK</dd>
                  </div>
                  <div>
                    <dt>LOAD</dt>
                    <dd>1 + 2</dd>
                  </div>
                </dl>
              </figcaption>
            </figure>
          </header>

          {storySteps.map((step, index) => (
            <section
              className={`desktop-stage desktop-stage-${step.id}`}
              id={`stage-${step.id}`}
              key={step.id}
              aria-labelledby={`stage-title-${step.id}`}
            >
              <header className="desktop-stage-head">
                <div className="desktop-stage-number">0{index + 1}</div>
                <div>
                  <p>{step.kicker}</p>
                  <h2 id={`stage-title-${step.id}`}>{step.title}</h2>
                  <span>{step.intro}</span>
                  <small className="desktop-stage-task">
                    本步完成条件 · {step.task}
                  </small>
                </div>
              </header>
              <div className="desktop-stage-content">
                {renderScreen(step.id)}
              </div>
            </section>
          ))}
        </main>
      </div>

      <div className="bottom-bar">
        <button
          className="bottom-primary"
          type="button"
          disabled={!next || (activeStep === "studio" && !studioConfirmed)}
          onClick={goToNext}
        >
          <span className="bottom-primary-copy">
            <strong>{active.nextLabel}</strong>
            <span>{next ? `下一步 · 0${activeIndex + 2}` : "四步叙事已完成"}</span>
          </span>
          <ArrowRight size={19} strokeWidth={1.8} aria-hidden="true" />
        </button>
      </div>

      <DemoPanel
        open={demoOpen}
        onClose={() => setDemoOpen(false)}
        readState={readState}
        onReadStateChange={setReadState}
        networkState={networkState}
        onNetworkStateChange={setNetworkState}
        settlementMode={settlementMode}
        onSettlementModeChange={setSettlementMode}
        signatureMode={signatureMode}
        onSignatureModeChange={setSignatureMode}
        onReset={() => {
          setReadState("ready");
          setNetworkState("correct");
          setSettlementMode("success");
          setSignatureMode("success");
        }}
      />
    </div>
  );
}
