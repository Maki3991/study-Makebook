"use client";

import { RotateCcw, Settings, X } from "lucide-react";
import { useEffect, useState } from "react";
import {
  failureDeployment,
  successDeployment,
} from "@/app/lib/chain/deployments";
import type { CampaignScenario } from "@/app/lib/chain/use-campaign";
import { useCampaignMode } from "./campaign-provider";
import { CopyValue, SourceTag, truncateMiddle } from "./primitives";

/**
 * Judge demo panel — hidden drawer opened from the gear button.
 *
 * Controls (judge-only, never part of the buyer path):
 * - Campaign scenario: success / failure / playground. Playground is offered
 *   only when deployments.playground exists with a non-zero address. The
 *   choice remodes every useCampaignData consumer on the page at once.
 * - RPC failure simulation: forces the contract → fixtures degradation path,
 *   so every number flips to its OFF-CHAIN DEMO fallback view.
 */

interface ScenarioOption {
  id: CampaignScenario;
  title: string;
  body: string;
  address: string | null;
}

export function DemoPanel() {
  const {
    scenario,
    setScenario,
    simulateRpcFailure,
    setSimulateRpcFailure,
    playgroundAvailable,
    playgroundAddress,
  } = useCampaignMode();
  const [open, setOpen] = useState(false);

  // A selected playground that is not deployed must never stick (deployments
  // are static, so this is purely defensive).
  useEffect(() => {
    if (scenario === "playground" && !playgroundAvailable) {
      setScenario("success");
    }
  }, [scenario, playgroundAvailable, setScenario]);

  // Esc closes; body scroll locks while the drawer is open.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  const options: ScenarioOption[] = [
    {
      id: "success",
      title: "Success script",
      body: "Preloaded with 5 escrowed orders — settles to one uniform clearing price.",
      address: successDeployment.address,
    },
    {
      id: "failure",
      title: "Failure script",
      body: "2 orders, no tier reaches MOQ — every backer claims a full refund.",
      address: failureDeployment.address,
    },
  ];
  if (playgroundAvailable) {
    options.push({
      id: "playground",
      title: "Playground",
      body: "Open batch for real visitors — any wallet can place one order.",
      address: playgroundAddress,
    });
  }

  const reset = () => {
    setScenario("success");
    setSimulateRpcFailure(false);
  };

  return (
    <>
      <button
        type="button"
        aria-label="Open judge demo panel"
        aria-expanded={open}
        aria-controls="demo-panel-drawer"
        onClick={() => setOpen(true)}
        className="fixed right-5 bottom-5 z-40 flex size-11 items-center justify-center rounded-[2px] border border-n-30 bg-n-00 text-n-64 transition-colors hover:text-n-92"
      >
        <Settings size={17} aria-hidden="true" />
      </button>

      {open ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Close demo panel"
            onClick={() => setOpen(false)}
            className="absolute inset-0 min-h-0 min-w-0 cursor-default bg-n-92/30"
          />
          <aside
            id="demo-panel-drawer"
            role="dialog"
            aria-modal="true"
            aria-label="Judge demo panel"
            className="reveal absolute top-0 right-0 flex h-full w-[min(380px,100vw)] flex-col gap-6 overflow-y-auto border-l border-n-22 bg-n-00 p-6"
          >
            <header className="flex items-start justify-between gap-4">
              <div className="flex flex-col gap-1">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Judge controls
                </span>
                <strong className="font-display text-21 font-medium text-n-92">
                  Demo panel
                </strong>
              </div>
              <button
                type="button"
                aria-label="Close demo panel"
                autoFocus
                onClick={() => setOpen(false)}
                className="flex size-9 items-center justify-center rounded-[2px] border border-n-22 text-n-64 transition-colors hover:text-n-92"
              >
                <X size={16} aria-hidden="true" />
              </button>
            </header>

            <p className="text-13 leading-relaxed text-n-64">
              Judge-only switches — not part of the buyer path. Each one
              remodes every campaign read on this page at once.
            </p>

            <section className="flex flex-col gap-3" aria-label="Campaign scenario">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  Campaign scenario
                </span>
                <SourceTag tone="onchain">Onchain</SourceTag>
              </div>
              <div role="radiogroup" aria-label="Campaign scenario" className="flex flex-col gap-2">
                {options.map((option) => {
                  const selected = scenario === option.id;
                  return (
                    <button
                      key={option.id}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setScenario(option.id)}
                      className={`flex min-h-0 flex-col gap-1.5 rounded-[2px] border p-4 text-left transition-colors ${
                        selected
                          ? "border-azure bg-n-04"
                          : "border-n-22 hover:border-n-40"
                      }`}
                    >
                      <span className="flex items-center justify-between gap-3">
                        <span className="text-15 font-medium text-n-92">
                          {option.title}
                        </span>
                        {option.address ? (
                          <span className="num text-11 text-n-40">
                            {truncateMiddle(option.address, 6, 4)}
                          </span>
                        ) : null}
                      </span>
                      <span className="text-13 leading-relaxed text-n-64">
                        {option.body}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-3" aria-label="RPC failure simulation">
              <div className="flex items-center justify-between gap-3">
                <span className="font-mono text-11 font-medium uppercase tracking-[0.14em] text-n-40">
                  RPC failure simulation
                </span>
                <SourceTag tone="offchain">Off-chain demo</SourceTag>
              </div>
              <div className="flex items-start justify-between gap-4">
                <p className="text-13 leading-relaxed text-n-64">
                  Force the contract → fixtures fallback. Every number flips to
                  its OFF-CHAIN DEMO view without touching the network.
                </p>
                <button
                  type="button"
                  role="switch"
                  aria-checked={simulateRpcFailure}
                  aria-label="Simulate RPC failure"
                  onClick={() => setSimulateRpcFailure(!simulateRpcFailure)}
                  className={`relative h-6 w-11 shrink-0 rounded-[2px] transition-colors ${
                    simulateRpcFailure ? "bg-azure" : "bg-n-30"
                  }`}
                >
                  <span
                    aria-hidden="true"
                    className={`absolute top-0.5 left-0.5 size-5 bg-n-00 transition-transform ${
                      simulateRpcFailure ? "translate-x-5" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
              {simulateRpcFailure ? (
                <p className="flex items-center gap-2 text-13 text-n-52" role="status">
                  <SourceTag tone="offchain">Fallback active</SourceTag>
                  All campaign numbers are fixture data.
                </p>
              ) : null}
            </section>

            <div className="mt-auto flex flex-col gap-4 border-t border-n-22 pt-4">
              <button
                type="button"
                onClick={reset}
                className="btn btn-ghost w-full"
              >
                <RotateCcw size={14} aria-hidden="true" />
                <span>Reset to defaults</span>
              </button>
              <p className="text-11 leading-relaxed text-n-40">
                Scenario addresses:
              </p>
              <div className="flex flex-col gap-1.5">
                {options.map((option) =>
                  option.address ? (
                    <div
                      key={option.id}
                      className="flex items-center justify-between gap-3"
                    >
                      <span className="font-mono text-11 uppercase tracking-[0.14em] text-n-40">
                        {option.id}
                      </span>
                      <CopyValue value={option.address} />
                    </div>
                  ) : null,
                )}
              </div>
            </div>
          </aside>
        </div>
      ) : null}
    </>
  );
}
