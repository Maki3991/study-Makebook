"use client";

import { ArrowRight, Settings2, WalletCards } from "lucide-react";
import { useState } from "react";
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

export function MakebookApp() {
  const [activeStep, setActiveStep] = useState<StoryStepId>("studio");
  const [demoOpen, setDemoOpen] = useState(false);
  const [readState, setReadState] = useState<ContractReadState>("ready");
  const [networkState, setNetworkState] =
    useState<DemoNetworkState>("correct");
  const [settlementMode, setSettlementMode] =
    useState<DemoSettlementMode>("success");
  const [signatureMode, setSignatureMode] =
    useState<DemoSignatureMode>("success");
  const activeIndex = storySteps.findIndex((step) => step.id === activeStep);
  const active = storySteps[activeIndex];
  const next = storySteps[activeIndex + 1];

  function goToStep(stepId: StoryStepId) {
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
    if (stepId === "studio") return <StudioScreen />;
    if (stepId === "campaign") {
      return (
        <CampaignScreen
          readState={readState}
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
        />
      );
    }
    return <SettlementScreen key={settlementMode} mode={settlementMode} />;
  }

  return (
    <div className="app-frame" data-active-step={activeStep}>
      <header className="app-header">
        <div className="brand-lockup" aria-label="MAKEBOOK 造物簿">
          <span className="brand-mark">MB</span>
          <div>
            <p className="brand-name">MAKEBOOK</p>
            <p className="brand-cn">造物簿</p>
          </div>
        </div>
        <div className="header-actions">
          <span className="network-pill">Testnet</span>
          <button
            className="wallet-pill demo-panel-trigger"
            type="button"
            aria-label="打开演示控制面板"
            onClick={() => setDemoOpen(true)}
          >
            <Settings2 size={15} strokeWidth={1.8} aria-hidden="true" />
          </button>
          <button className="wallet-pill" type="button" aria-label="连接钱包">
            <WalletCards size={15} strokeWidth={1.8} aria-hidden="true" />
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
            <p className="screen-kicker">MAKEBOOK / FOUR STEP DEMO</p>
            <h1>把制造需求，变成可验证的订单簿。</h1>
            <p>
              从评论证据、人工确认、测试网资金订单，到统一清算与个人凭证。
              产品讨论的是一个真实的包，不是代币行情。
            </p>
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
          disabled={!next}
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
