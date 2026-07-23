"use client";

import {
  AlertTriangle,
  CheckCircle2,
  CircleDashed,
  LoaderCircle,
  PanelRightClose,
  RotateCcw,
  WifiOff,
} from "lucide-react";
import { SourceTag } from "./ui";

export type ContractReadState = "ready" | "loading" | "error";
export type DemoNetworkState = "correct" | "wrong";
export type DemoSettlementMode = "success" | "failure";
export type DemoSignatureMode = "success" | "reject";

export function DemoPanel({
  open,
  onClose,
  readState,
  onReadStateChange,
  networkState,
  onNetworkStateChange,
  settlementMode,
  onSettlementModeChange,
  signatureMode,
  onSignatureModeChange,
  onReset,
}: {
  open: boolean;
  onClose: () => void;
  readState: ContractReadState;
  onReadStateChange: (value: ContractReadState) => void;
  networkState: DemoNetworkState;
  onNetworkStateChange: (value: DemoNetworkState) => void;
  settlementMode: DemoSettlementMode;
  onSettlementModeChange: (value: DemoSettlementMode) => void;
  signatureMode: DemoSignatureMode;
  onSignatureModeChange: (value: DemoSignatureMode) => void;
  onReset: () => void;
}) {
  return (
    <>
      <button
        className="demo-panel-scrim"
        data-open={open}
        type="button"
        aria-label="关闭演示控制面板"
        onClick={onClose}
      />
      <aside
        className="demo-panel"
        data-open={open}
        aria-hidden={!open}
        aria-label="隐藏演示控制面板"
        inert={!open ? true : undefined}
      >
        <header>
          <div>
            <span>HIDDEN CONTROLS</span>
            <strong>Demo Panel</strong>
          </div>
          <button type="button" aria-label="关闭演示控制面板" onClick={onClose}>
            <PanelRightClose size={18} aria-hidden="true" />
          </button>
        </header>

        <p className="demo-panel-intro">
          仅用于评审切换固定演示状态，不属于消费者主路径。
        </p>

        <section>
          <div className="demo-control-head">
            <span>合约读取</span>
            <SourceTag tone="onchain">ONCHAIN</SourceTag>
          </div>
          <div className="demo-option-grid">
            <button
              data-active={readState === "ready"}
              type="button"
              onClick={() => onReadStateChange("ready")}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              正常
            </button>
            <button
              data-active={readState === "loading"}
              type="button"
              onClick={() => onReadStateChange("loading")}
            >
              <LoaderCircle size={15} aria-hidden="true" />
              Loading
            </button>
            <button
              data-active={readState === "error"}
              type="button"
              onClick={() => onReadStateChange("error")}
            >
              <WifiOff size={15} aria-hidden="true" />
              读取失败
            </button>
          </div>
        </section>

        <section>
          <div className="demo-control-head">
            <span>钱包网络</span>
            <SourceTag tone="testnet">TESTNET</SourceTag>
          </div>
          <div className="demo-option-grid demo-option-grid-two">
            <button
              data-active={networkState === "correct"}
              type="button"
              onClick={() => onNetworkStateChange("correct")}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              Chain 1439
            </button>
            <button
              data-active={networkState === "wrong"}
              type="button"
              onClick={() => onNetworkStateChange("wrong")}
            >
              <AlertTriangle size={15} aria-hidden="true" />
              错误网络
            </button>
          </div>
        </section>

        <section>
          <div className="demo-control-head">
            <span>下一次签名</span>
            <SourceTag tone="testnet">TESTNET</SourceTag>
          </div>
          <div className="demo-option-grid demo-option-grid-two">
            <button
              data-active={signatureMode === "success"}
              type="button"
              onClick={() => onSignatureModeChange("success")}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              成功
            </button>
            <button
              data-active={signatureMode === "reject"}
              type="button"
              onClick={() => onSignatureModeChange("reject")}
            >
              <CircleDashed size={15} aria-hidden="true" />
              用户拒签
            </button>
          </div>
        </section>

        <section>
          <div className="demo-control-head">
            <span>清算场景</span>
            <SourceTag tone="onchain">ONCHAIN</SourceTag>
          </div>
          <div className="demo-option-grid demo-option-grid-two">
            <button
              data-active={settlementMode === "success"}
              type="button"
              onClick={() => onSettlementModeChange("success")}
            >
              <CheckCircle2 size={15} aria-hidden="true" />
              成功 Campaign
            </button>
            <button
              data-active={settlementMode === "failure"}
              type="button"
              onClick={() => onSettlementModeChange("failure")}
            >
              <AlertTriangle size={15} aria-hidden="true" />
              失败 Campaign
            </button>
          </div>
        </section>

        <button className="demo-reset" type="button" onClick={onReset}>
          <RotateCcw size={15} aria-hidden="true" />
          恢复默认演示状态
        </button>
      </aside>
    </>
  );
}
