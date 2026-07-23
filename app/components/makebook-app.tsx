"use client";

import { ArrowRight, WalletCards } from "lucide-react";
import { useState } from "react";
import { storySteps, type StoryStepId } from "../lib/mock-data";
import {
  CampaignScreen,
  OrderScreen,
  SettlementScreen,
  StudioScreen,
} from "./story-screens";

export function MakebookApp() {
  const [activeStep, setActiveStep] = useState<StoryStepId>("studio");
  const activeIndex = storySteps.findIndex((step) => step.id === activeStep);
  const active = storySteps[activeIndex];
  const next = storySteps[activeIndex + 1];

  function goToNext() {
    if (next) {
      setActiveStep(next.id);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }

  function renderScreen() {
    if (activeStep === "studio") return <StudioScreen />;
    if (activeStep === "campaign") return <CampaignScreen />;
    if (activeStep === "order") return <OrderScreen />;
    return <SettlementScreen />;
  }

  return (
    <div className="app-frame">
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
            onClick={() => setActiveStep(step.id)}
          >
            <span className="story-number">0{index + 1}</span>
            <span className="story-label">{step.shortLabel}</span>
          </button>
        ))}
      </nav>

      <main className="app-main">
        <div className="screen-head">
          <p className="screen-kicker">{active.kicker}</p>
          <h1 className="screen-title">{active.title}</h1>
          <p className="screen-intro">{active.intro}</p>
        </div>

        {renderScreen()}
      </main>

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
    </div>
  );
}
