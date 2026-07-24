import type { Metadata } from "next";
import { ClaimCenter } from "./claim-center";

export const metadata: Metadata = {
  title: "My batch — MAKEBOOK",
  description:
    "Your FRAME-01 orders across the deployed campaigns, claimable refunds, and the test INJ faucet on Injective EVM Testnet.",
};

/** /me — 我的批次与领取中心（交互全部在 client 的 ClaimCenter 内）。 */
export default function MePage() {
  return <ClaimCenter />;
}
