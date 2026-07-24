"use client";

import { useCallback } from "react";
import type { Address } from "viem";
import { playgroundDeployment } from "@/app/lib/chain/deployments";
import {
  setCampaignMode,
  useCampaignModeState,
  type CampaignScenario,
} from "@/app/lib/chain/use-campaign";

/**
 * Site-level campaign mode interface (Demo Panel).
 *
 * The actual store lives in app/lib/chain/use-campaign.ts as a module-level
 * external store, because every section calls `useCampaignData("success")`
 * with a hardcoded default — the override has to be applied inside the hook
 * itself. This hook is the friendly read/write facade for site chrome.
 *
 * Semantics:
 * - scenario "success" maps to `null` override = the page default; sections
 *   keep their own requested scenario (settlement-section's local toggle
 *   stays functional). Picking "failure"/"playground" forces every
 *   useCampaignData consumer on the page to that campaign.
 * - simulateRpcFailure forces the contract → fixtures degradation path, so
 *   judges can demo the OFF-CHAIN DEMO fallback without killing the network.
 */

export interface CampaignMode {
  /** Effective page scenario ("success" when no override is active). */
  scenario: CampaignScenario;
  setScenario: (scenario: CampaignScenario) => void;
  /** Force all campaign reads onto the fixture fallback path. */
  simulateRpcFailure: boolean;
  setSimulateRpcFailure: (value: boolean) => void;
  /** Playground option is offered only when a non-zero deployment exists. */
  playgroundAvailable: boolean;
  playgroundAddress: Address | null;
}

export function useCampaignMode(): CampaignMode {
  const state = useCampaignModeState();

  const setScenario = useCallback((scenario: CampaignScenario) => {
    setCampaignMode({
      scenarioOverride: scenario === "success" ? null : scenario,
    });
  }, []);

  const setSimulateRpcFailure = useCallback((value: boolean) => {
    setCampaignMode({ forceFixture: value });
  }, []);

  return {
    scenario: state.scenarioOverride ?? "success",
    setScenario,
    simulateRpcFailure: state.forceFixture,
    setSimulateRpcFailure,
    playgroundAvailable: playgroundDeployment !== null,
    playgroundAddress: playgroundDeployment?.address ?? null,
  };
}
