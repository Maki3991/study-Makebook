import { DemoPanel } from "@/app/components/site/demo-panel";
import { Tabs, type TabItem } from "@/app/components/site/tabs";
import { TopBar } from "@/app/components/site/top-bar";
import { AiStory } from "@/app/components/sections/ai-story";
import { CampaignHero } from "@/app/components/sections/campaign-hero";
import { DemandCurve } from "@/app/components/sections/demand-curve";
import { EvidenceFooter } from "@/app/components/sections/evidence-footer";
import { FactoryQuotes } from "@/app/components/sections/factory-quotes";
import { PledgePanel } from "@/app/components/sections/pledge-panel";
import { ProductionPlan } from "@/app/components/sections/production-plan";
import { SettlementSection } from "@/app/components/sections/settlement-section";
import { StatusBar } from "@/app/components/sections/status-bar";

/**
 * Product homepage (= the FRAME-01 campaign page, crowdfunding-platform IA).
 *
 * Grid: single column on mobile; from lg up, a 1fr content column plus a
 * 380px rail whose pledge panel sticks below the 64px top bar.
 * Content column: hero → batch status bar → four tabs
 * (demand evidence / demand & quotes / production plan / results & receipts).
 * The judge demo panel floats bottom-right and remodes every campaign read.
 */
export default function Home() {
  const tabs: TabItem[] = [
    {
      id: "story",
      index: "01",
      label: "Demand evidence",
      content: <AiStory />,
    },
    {
      id: "demand",
      index: "02",
      label: "Demand & quotes",
      content: (
        <div className="flex flex-col gap-16 lg:gap-20">
          <DemandCurve />
          <FactoryQuotes />
        </div>
      ),
    },
    {
      id: "production",
      index: "03",
      label: "Production plan",
      content: <ProductionPlan />,
    },
    {
      id: "settlement",
      index: "04",
      label: "Results & receipts",
      content: <SettlementSection />,
    },
  ];

  return (
    <div className="flex min-h-dvh flex-col">
      <TopBar />
      <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-12 py-10 lg:grid-cols-[1fr_380px] lg:gap-16 lg:py-16">
          <div className="flex min-w-0 flex-col gap-12 lg:gap-16">
            <section id="hero" aria-label="Product overview">
              <CampaignHero />
            </section>

            <StatusBar />

            <Tabs items={tabs} ariaLabel="Campaign details" />
          </div>

          <aside className="relative">
            <div id="pledge" className="lg:sticky lg:top-20">
              <PledgePanel />
            </div>
          </aside>
        </div>

        <section
          id="evidence"
          aria-label="Onchain evidence"
          className="pb-16 lg:pb-24"
        >
          <EvidenceFooter />
        </section>
      </main>
      <DemoPanel />
    </div>
  );
}
