/**
 * English UI dictionary — every user-facing static string on the site,
 * verbatim from the pre-i18n components. Flat keys, dot-namespaced by section.
 * Brand / protocol labels (MAKEBOOK, FRAME-01, Factory North/Loom, MOQ,
 * test INJ, the six source tags, Fixture, wei/tx hashes) never enter this
 * file as translatable values — they render untranslated in both languages.
 *
 * `{name}` tokens are interpolation slots filled by t(key, vars).
 */
export const en: Record<string, string> = {
  // ------------------------------------------------------------- shared
  "common.copied": "Copied",
  "common.copyValue": "Copy {value}",
  "common.ended": "Ended",
  "common.connectWallet": "Connect Wallet",
  "common.retry": "Retry",
  "common.contract": "Contract",
  "common.viewTx": "View tx",
  "common.viewTransaction": "View transaction",
  "common.viewOnBlockscout": "View on Blockscout",
  "common.ordersEscrowed": "Orders escrowed",
  "common.closesIn": "Closes in",
  "common.clearingPrice": "Clearing price",
  "common.clearingPreview": "Clearing preview",
  "common.outcome": "Outcome",
  "common.backThisBatch": "Back this batch",
  "common.triggerSettlement": "Trigger settlement",
  "common.claimAmount": "Claim {amount} test INJ",
  "common.noRefundDue": "No refund due · mark as claimed",
  "common.switchInjective": "Switch to Injective testnet",
  "common.manifestHash": "Manifest hash",
  "common.hackathonData": "Hackathon scaled test data",
  "common.hackathonNoValue":
    "Hackathon scaled test data · Testnet INJ has no value.",
  "campaign.success": "Success campaign",
  "campaign.failure": "Failure campaign",
  "campaign.playground": "Playground campaign",
  "state.draft": "Draft",
  "state.open": "Open",
  "state.succeeded": "Succeeded",
  "state.failed": "Failed",
  "state.paidout": "PaidOut",

  // ------------------------------------------------------------- top bar
  "topbar.langToggleAria": "Switch to 中文",
  "topbar.frameCampaign": "FRAME-01 Campaign",
  "topbar.nav.campaign": "Campaign",
  "topbar.nav.myBatch": "My batch",
  "topbar.nav.evidence": "Evidence",
  "topbar.wrongNetwork": "Wrong Network",

  // ------------------------------------------------- home page scaffolding
  "tabs.ariaLabel": "Campaign details",
  "tabs.defaultAria": "Campaign sections",
  "tab.story": "Demand evidence",
  "tab.demand": "Demand & quotes",
  "tab.production": "Production plan",
  "tab.settlement": "Results & receipts",
  "page.heroAria": "Product overview",
  "page.evidenceAria": "Onchain evidence",

  // ------------------------------------------------------------ demo panel
  "demo.openAria": "Open judge demo panel",
  "demo.closeAria": "Close demo panel",
  "demo.dialogAria": "Judge demo panel",
  "demo.kicker": "Judge controls",
  "demo.title": "Demo panel",
  "demo.intro":
    "Judge-only switches — not part of the buyer path. Each one remodes every campaign read on this page at once.",
  "demo.scenario": "Campaign scenario",
  "demo.scenario.successTitle": "Success script",
  "demo.scenario.successBody":
    "Preloaded with 5 escrowed orders — settles to one uniform clearing price.",
  "demo.scenario.failureTitle": "Failure script",
  "demo.scenario.failureBody":
    "2 orders, no tier reaches MOQ — every backer claims a full refund.",
  "demo.scenario.playgroundTitle": "Playground",
  "demo.scenario.playgroundBody":
    "Open batch for real visitors — any wallet can place one order.",
  "demo.rpcTitle": "RPC failure simulation",
  "demo.rpcBody":
    "Force the contract → fixtures fallback. Every number flips to its OFF-CHAIN DEMO view without touching the network.",
  "demo.rpcSwitchAria": "Simulate RPC failure",
  "demo.rpcFallbackTag": "Fallback active",
  "demo.rpcFallback": "All campaign numbers are fixture data.",
  "demo.reset": "Reset to defaults",
  "demo.addresses": "Scenario addresses:",

  // ---------------------------------------------------------------- hero
  "hero.kicker": "FRAME-01 · Production demand campaign",
  "hero.positioning":
    "A crowdfunding campaign where your maximum price is escrowed on-chain, and a factory's MOQ quote decides production — by public rule, at a public deadline.",
  "hero.loadingAria": "Loading campaign state",
  "hero.status": "Status",
  "hero.tierViable":
    "{name}'s {quantity}-unit tier is currently viable — {eligible} orders qualify at {price} test INJ per unit.",
  "hero.noOrders": "No orders yet — the first backers set the demand curve.",
  "hero.noMoq":
    "No factory tier currently reaches its MOQ — if that holds, every order is refunded in full.",
  "hero.figuresNote": "Campaign figures: Hackathon scaled test data.",
  "hero.operator": "Campaign Operator",
  "hero.operatorLoadingAria": "Loading operator address",
  "hero.operatorOffline": "address unavailable offline",
  "hero.operatorNote":
    "Demo operator identity for the hackathon. The operator registers factory quotes and opens the batch — escrowed funds never touch this wallet.",
  "hero.imgAlt":
    "FRAME-01 — black 8L modular camera sling bag with removable insert",
  "hero.spec.capacity": "Capacity",
  "hero.spec.color": "Color",
  "hero.spec.insert": "Insert",
  "hero.spec.load": "Load",

  // ----------------------------------------------------------- status bar
  "statusbar.title": "Batch status",
  "statusbar.loadingAria": "Loading batch status",
  "statusbar.toNearestMoq": "To nearest MOQ",
  "statusbar.moqMet": "MOQ met",
  "statusbar.ordersShort": "{count} orders short",
  "statusbar.ctaNotOpen": "Not open yet",
  "statusbar.ctaClaimRefund": "Claim your refund",
  "statusbar.ctaClaimFull": "Claim full refund",
  "statusbar.ctaViewReceipt": "View receipt",
  "statusbar.note":
    "One order per wallet, locked in full escrow. If no factory MOQ is met, every order is refunded in full.",

  // ------------------------------------------------------------- AI story
  "story.kicker": "02 / The Story",
  "story.title": "How this product was born",
  "story.intro":
    "FRAME-01 started as twenty user comments, not a factory catalog. An AI compiler drafted candidates with evidence, a human confirmed one spec sheet, and its hash was locked into the campaign contract before the first order.",
  "story.step1Title": "Comments",
  "story.step1Desc":
    "20 user inputs collected from interviews, forums, and surveys",
  "story.step2Title": "AI compile",
  "story.step2Desc":
    "An AI compiler drafts product candidates, each tied to comment evidence",
  "story.step3Title": "Human confirm",
  "story.step3Desc":
    "A person edits and confirms one spec sheet — the AI does not ship",
  "story.step4Title": "Manifest hash",
  "story.step4Desc":
    "keccak256 of the confirmed sheet is written into the campaign contract",
  "story.stats": "{valid} valid inputs · {duplicates} duplicates removed",
  "story.fallbackReason": "Fallback reason: {reason}",
  "story.loadingAria": "Compiling comments",
  "story.empty": "No candidates were returned for this comment set.",
  "story.cardSpecs": "Specs",
  "story.cardEvidence": "Evidence",
  "story.cardUnknowns": "Unknowns",
  "story.operationalAssumption": "operational assumption",
  "story.confirmedLine": "{code} · confirmed {date}",
  "story.stillUnknown": "Still unknown",
  "story.manifestHashLabel": "Manifest hash (keccak256)",
  "story.copyHash": "Copy full manifest hash",
  "story.hashNote":
    "The hash proves exactly one thing: this spec sheet has not been altered since it was written into the campaign contract. It says nothing about whether the specs are right.",
  "story.footerNote": "Comment set and campaign figures: Hackathon scaled test data.",

  // --------------------------------------------------------- demand curve
  "demand.kicker": "Funded demand · the order book",
  "demand.title": "The demand curve is real money",
  "demand.intro":
    "Every point counts wallets that escrowed at least that price in the campaign contract. No likes, no sign-ups — locked test INJ only.",
  "demand.loadingAria": "Loading demand curve",
  "demand.empty":
    "No escrowed orders yet — the curve draws itself as soon as the first order lands.",
  "demand.legendEscrowed": "escrowed demand",
  "demand.legendViable": "viable tier (MOQ met)",
  "demand.legendShort": "tier short of MOQ",
  "demand.explainer":
    "Each bar counts wallets that escrowed at least this price. AI interest samples (72) are shown separately and never enter clearing.",
  "demand.aiSamples": "{count} interest samples · interviews and comments",
  "demand.axisY": "ESCROWED ORDERS",
  "demand.axisX": "UNIFORM PRICE · TEST INJ",
  "demand.ariaPrefix": "Escrowed demand curve: ",
  "demand.ariaTiersPrefix": "Factory MOQ tiers: ",
  "demand.ariaPoint": "{orders} orders at {price} test INJ",
  "demand.ariaTier":
    "{name} minimum {quantity} at {price} test INJ, {status}",
  "demand.ariaViable": "viable",
  "demand.ariaShort": "short of MOQ",

  // ------------------------------------------------------- factory quotes
  "quotes.kicker": "Factory quotes · MOQ ladders",
  "quotes.title": "Factory MOQ quotes",
  "quotes.intro":
    "Each factory submitted a price ladder before the campaign opened. A tier is viable when at least its minimum quantity of escrowed orders bid the unit price or higher — the contract enforces that at settlement.",
  "quotes.thTier": "Tier",
  "quotes.thMinQty": "Min qty",
  "quotes.thUnitPrice": "Unit price",
  "quotes.thEligible": "Eligible",
  "quotes.thFeasible": "Feasible",
  "quotes.eligibleOrders": "{count} orders",
  "quotes.viable": "Viable",
  "quotes.notMet": "Not met",
  "quotes.frozen":
    "Quotes are frozen once the campaign opened. No one can change them now.",
  "quotes.leadTime": "Lead time 35 days · off-chain note",
  "quotes.empty": "No factory quotes on this campaign yet.",
  "quotes.loadingAria": "Loading",

  // --------------------------------------------------------- pledge panel
  "pledge.loadingAria": "Loading campaign panel",
  "pledge.connectNote":
    "Connect a wallet to escrow your max price — one order per wallet, locked until the batch clears.",
  "pledge.connectNoteClaim":
    "Connect the wallet you ordered with to claim your refund.",
  "pledge.connectButton": "Connect wallet",
  "pledge.connecting": "Connecting…",
  "pledge.connectHint":
    "The wallet asks you to approve the connection — no transaction is sent yet.",
  "pledge.wrongNetworkBody":
    "Your wallet is on another network. Orders and claims settle on Injective EVM Testnet (chain ID 1439).",
  "pledge.switchButton": "Switch to Injective Testnet",
  "pledge.switching": "Switching…",
  "pledge.faucetBody":
    "Insufficient balance — get free test INJ. This order escrows {amount} test INJ plus ~0.001 for gas; this wallet holds {balance}.",
  "pledge.faucetWallet": "Your wallet",
  "pledge.faucetOpen": "Open the testnet faucet",
  "pledge.faucetRecheck": "I already claimed",
  "pledge.faucetHint": "New wallets get 1 free test INJ after hCaptcha.",
  "pledge.faucetNotePending":
    "No new test INJ detected yet — the faucet drip can take a minute.",
  "pledge.faucetNoteFailed":
    "Balance check failed — please try again in a moment.",
  "pledge.txConfirmed": "Confirmed",
  "pledge.batchStatus": "Batch status",
  "pledge.deadlineReached": "Deadline reached",
  "pledge.timeToDeadline": "Time to deadline",
  "pledge.winnersSuffix": "test INJ · {count} winners",
  "pledge.batchFailedSuffix": "batch failed",
  "pledge.noOrdersYet": "No orders yet — be the first.",
  "pledge.ordersInSuffix": "test INJ · {count} orders in",
  "pledge.noTierYet": "No tier reaches its MOQ yet.",
  "pledge.oneOrderNote": "Every wallet can place 1 order · full escrow.",
  "pledge.claimsTitle": "Claims",
  "pledge.claimsSuccess":
    "The batch cleared at one uniform price — {price} test INJ — with {count} winning orders.",
  "pledge.claimsFailed":
    "No factory tier reached its MOQ, so every order claims a full refund.",
  "pledge.yourRefund": "Your refund",
  "pledge.reasonFailed":
    "The batch did not reach any factory MOQ — your full escrow comes back.",
  "pledge.reasonOutbid":
    "Your max price was below the clearing price — you claim a full refund.",
  "pledge.reasonExact":
    "You win at exactly your max price — no refund due; marking claimed closes your receipt.",
  "pledge.reasonDiff":
    "You win at one uniform clearing price — the difference above it comes back.",
  "pledge.markedClaimed": "Marked as claimed",
  "pledge.refundClaimed": "Refund claimed",
  "pledge.claimsNoOrder":
    "This wallet has no order in the batch — nothing to claim.",
  "pledge.factoryPayout": "Factory payout",
  "pledge.factoryNote":
    "This wallet is the selected factory — the receivable is winner count × clearing price.",
  "pledge.payoutClaimed": "Payout claimed",
  "pledge.claimPayout": "Claim payout · {amount} test INJ",
  "pledge.paused":
    "Live campaign data is unreachable, so ordering and claims are paused. The numbers on this panel right now are cached demo data.",
  "pledge.orderConfirmed": "Order confirmed — escrow locked",
  "pledge.yourOrder": "Your order",
  "pledge.lockedInEscrow": "Locked in escrow",
  "pledge.maxSuffix": "test INJ max",
  "pledge.orderTx": "Order transaction",
  "pledge.orderNote":
    "One order per wallet — it cannot be cancelled or changed. After the deadline the batch clears at one uniform price and any refund opens here.",
  "pledge.maxPriceLabel": "Your max price · test INJ",
  "pledge.errorZero": "Enter a price above zero.",
  "pledge.errorInvalid": "Enter a valid decimal amount (up to 18 places).",
  "pledge.quickPicksAria": "Quick price picks",
  "pledge.formExplainer":
    "You lock your max price in the contract now. If the uniform clearing price is lower, you claim back the difference. If the batch fails or you are outbid, you claim a full refund.",
  "pledge.confirmNoCancel":
    "I understand this order cannot be cancelled or changed.",
  "pledge.confirmPublic":
    "My wallet address and max price will be public on Injective testnet.",
  "pledge.reviewCta": "Review order · {amount} test INJ",
  "pledge.notOpenYet": "The campaign is not open for orders yet.",
  "pledge.pastDeadline":
    "The deadline has passed — this batch is waiting for settlement.",
  "pledge.estimateWin":
    "If the current preview holds, you claim back {amount} test INJ after clearing.",
  "pledge.estimateOutbid":
    "Below the current clearing preview ({price} test INJ) — outbid → full refund.",
  "pledge.estimateNoTier":
    "No tier reaches its MOQ yet — if that holds at the deadline, you claim a full refund.",
  "pledge.reviewTitle": "Review your order",
  "pledge.reviewEdit": "Edit",
  "pledge.reviewItem": "Item",
  "pledge.reviewMaxPrice": "Your max price",
  "pledge.escrowNote": "test INJ · escrowed in full now",
  "pledge.reviewRule1":
    "You pay the uniform clearing price, never more than your max.",
  "pledge.reviewRule2": "This order cannot be cancelled or changed.",
  "pledge.reviewRule3":
    "Your wallet address and max price will be public on Injective testnet.",
  "pledge.confirmInWallet": "Confirm in wallet…",
  "pledge.confirmLock": "Confirm and lock {amount} test INJ",
  "pledge.confirmOrder": "Confirm order",
  "pledge.backToEdit": "Back to edit",
  "pledge.footerNote": "Testnet INJ has no value. Hackathon scaled test data.",
  "pledge.error.order.CampaignNotOpen": "This campaign is not open for orders.",
  "pledge.error.order.DeadlinePassed":
    "The deadline has passed — this batch is no longer taking orders.",
  "pledge.error.order.InvalidPayment":
    "Payment mismatch: the escrowed amount must equal your max price and be above zero.",
  "pledge.error.order.DuplicateOrder":
    "This wallet already has an order in the batch — one order per wallet.",
  "pledge.error.order.OrderLimitReached": "This batch is full (50 orders).",
  "pledge.error.orderRejected":
    "Signature cancelled in your wallet — no order was created and no funds moved.",
  "pledge.error.claim.WrongState": "Claims open after the batch settles.",
  "pledge.error.claim.NoOrder": "This wallet has no order in the batch.",
  "pledge.error.claim.AlreadyClaimed":
    "Already claimed — each wallet claims once.",
  "pledge.error.claim.NotSelectedFactory":
    "Only the selected factory wallet can claim the payout.",
  "pledge.error.claim.TransferFailed":
    "The transfer failed — please retry; your claim status did not change.",
  "pledge.error.claimRejected":
    "Signature cancelled in your wallet — no transaction was submitted.",
  "pledge.error.fallback": "The transaction failed — please try again.",

  // ------------------------------------------------------ settlement (05)
  "settlement.kicker": "05 / Clearing",
  "settlement.title": "How clearing works",
  "settlement.intro":
    "One public transaction at a public deadline. The contract picks the winning tier and a single price for every winner — no negotiation after the fact.",
  "settlement.rules.1": "At the deadline anyone can trigger settlement.",
  "settlement.rules.2":
    "The contract picks the tier with the most eligible orders; ties go to the lower price. Every winner pays that one price.",
  "settlement.rules.3":
    "If no tier reaches its MOQ, everyone claims a full refund.",
  "settlement.toggleNote":
    "Two campaigns are deployed on Injective testnet. Switch to preview either outcome against live contract state.",
  "settlement.cardSettled": "Settled · {state}",
  "settlement.cardPreview": "If settlement ran now",
  "settlement.winningFactory": "Winning factory",
  "settlement.everyWinnerPays": "every winner pays this",
  "settlement.winners": "Winners",
  "settlement.winnersValue": "{winners} of {total} orders",
  "settlement.factoryReceivable": "Factory receivable",
  "settlement.settlementTx": "Settlement tx",
  "settlement.batchFailed": "Batch failed",
  "settlement.reason": "Reason",
  "settlement.noTierWithOrders": "No tier reached its MOQ ({orders} orders)",
  "settlement.lowestMoqSuffix": ", lowest MOQ {min}",
  "settlement.refunds": "Refunds",
  "settlement.refundAll": "Every backer claims a full refund",
  "settlement.leadingTier": "Leading tier",
  "settlement.leadingTierValue": "{name} · {quantity}+ units @ {price}",
  "settlement.ordersThatClear": "Orders that clear",
  "settlement.ordersOfTotal": "{winners} of {total}",
  "settlement.factoryWouldReceive": "Factory would receive",
  "settlement.everyWinnerPaysLabel": "Every winner pays",
  "settlement.higherEscrows": "higher escrows claim the difference",
  "settlement.wouldFail": "Would fail",
  "settlement.ordersOnBooks": "Orders on the books",
  "settlement.lowestMoqIs": "lowest MOQ is {min}",
  "settlement.noTierRefundAll":
    "No tier reaches its MOQ — everyone claims a full refund",
  "settlement.selectedFactory": "Selected factory",
  "settlement.allocTitle": "Allocation preview",
  "settlement.allocFactoryCost": "Factory cost",
  "settlement.allocCostNote": "clearing price × winners",
  "settlement.allocBrandMargin": "Brand margin",
  "settlement.allocPlaceholder": "placeholder",
  "settlement.allocPlatformFee": "Platform fee",
  "settlement.allocNote":
    "P0 platform fee is 0 by design; real fees would be frozen before opening.",
  "settlement.finalTitle": "Settlement is final and onchain.",
  "settlement.finalBody":
    "Refunds for backers and the payout for the winning factory are claimed from {link}.",
  "settlement.finalLink": "the pledge panel",
  "settlement.triggerTitle": "Settlement trigger",
  "settlement.triggerNote":
    "Permissionless — anyone can send it once the deadline passes.",
  "settlement.opensIn": "Opens in",
  "settlement.notYet": "Not yet — settlement opens {date}.",
  "settlement.connectToSettle": "Connect wallet to settle",
  "settlement.settleConfirmed":
    "Settlement transaction confirmed — refreshing results.",
  "settlement.errorDeadline": "Not yet — settlement opens at the deadline.",
  "settlement.errorNotOpen": "This campaign is not open for settlement.",
  "settlement.errorWrongState":
    "Settlement has already run for this campaign.",
  "settlement.errorRejected":
    "You cancelled the wallet signature — no transaction was submitted.",
  "settlement.errorFallback": "Transaction failed. Please try again.",

  // ------------------------------------------------------ production plan
  "plan.kicker": "Production plan",
  "plan.title": "From settlement to shipping",
  "plan.intro":
    "Three milestones sit between a successful batch and bags in backers' hands.",
  "plan.m1Name": "Sampling",
  "plan.m1Timing": "Weeks 1–2 · after a successful settlement",
  "plan.m1Desc":
    "The selected factory produces two sample units for operator sign-off against the confirmed manifest.",
  "plan.m2Name": "Mass production",
  "plan.m2Timing": "Weeks 3–6",
  "plan.m2Desc":
    "The winning tier quantity goes into production at the uniform clearing unit price locked on-chain.",
  "plan.m3Name": "Shipping",
  "plan.m3Timing": "Weeks 7–8",
  "plan.m3Desc":
    "Units ship to backers. Delivery addresses and tracking are collected off-chain (V1).",
  "plan.note": "Off-chain demo timeline. The contract does not track production.",

  // ----------------------------------------------- evidence footer (06)
  "footer.kicker": "06 / Evidence & boundaries",
  "footer.title": "Everything on this page is checkable",
  "footer.intro":
    "The contracts, the manifest, and the settlement transactions are public. Here is exactly where to verify them — and what they do not prove.",
  "footer.onchainRefs": "On-chain references",
  "footer.manifestHashBoth": "Manifest hash (both campaigns)",
  "footer.manifestFile": "Manifest file",
  "footer.view": "View",
  "footer.verified": "Verified source on Blockscout:",
  "footer.verifiedSuccess": "Success",
  "footer.verifiedFailure": "Failure",
  "footer.boundaries": "Boundaries",
  "footer.b1Title": "Testnet INJ has no value",
  "footer.b1Body":
    "Every amount on this page is denominated in test INJ on Injective EVM Testnet. It cannot be sold, swapped, or redeemed.",
  "footer.b2Title": "Demo factories are team-controlled wallets",
  "footer.b2Body":
    "Factory North and Factory Loom are wallets operated by the team. Their MOQ quotes are illustrative and were frozen when the campaign opened.",
  "footer.b3Title": "Production and logistics are an off-chain demo",
  "footer.b3Body":
    "Nothing after settlement is a commitment. Manufacturing, quality, and delivery are demonstrated, not promised.",
  "footer.b4Title": "The manifest hash proves one thing only",
  "footer.b4Body":
    "It proves the published spec file has not changed since the campaign opened. It says nothing about demand, quality, or delivery.",
  "footer.note":
    "Hackathon scaled test data — amounts, orders, and quotes are scaled down for demonstration.",

  // -------------------------------------------------- /me claim center
  "me.kicker": "Me / Claim center",
  "me.title": "My batch",
  "me.intro":
    "Your FRAME-01 orders across every deployed campaign, what each one can claim after settlement, and where to top up test INJ.",
  "me.connectTitle": "Connect your wallet",
  "me.connectBody":
    "Connect the wallet you backed FRAME-01 with. Your orders, claimable refunds, and your faucet address show up here.",
  "me.connectedWallet": "Connected wallet",
  "me.wrongNetwork":
    "Wrong network — claims run on Injective EVM Testnet (chain 1439).",
  "me.switchNetwork": "Switch network",
  "me.emptyTitle": "No orders yet — back FRAME-01",
  "me.emptyBody":
    "This wallet has no order on any deployed campaign. Pledge a max price on the campaign page — your order and every refund show up here.",
  "me.emptyCta": "Back FRAME-01",
  "me.campaignState": "Campaign state",
  "me.yourMaxPrice": "Your max price",
  "me.orderStatus": "Order status",
  "me.orderTx": "Order tx",
  "me.claimed": "Claimed — nothing left on this order.",
  "me.waitSettlement":
    "Refunds open after settlement — check back at the deadline.",
  "me.claimConfirmed": "Claim confirmed — refreshing your order.",
  "me.outcomeFailed": "Batch failed — full refund",
  "me.outcomeFailedReason":
    "No factory tier reached its MOQ, so your full escrow comes back.",
  "me.outcomeOutbid": "Outbid — full refund",
  "me.outcomeOutbidReason":
    "Your max price was below the clearing price ({price} test INJ) — you claim a full refund.",
  "me.outcomeWinnerDiff": "Winner — uniform price difference",
  "me.outcomeWinnerExact": "Winner — paid exactly the clearing price",
  "me.outcomeWinnerDiffReason":
    "Every winner pays one clearing price ({price} test INJ) — the difference above it comes back.",
  "me.outcomeWinnerExactReason":
    "You win at exactly your max price — no refund due; marking claimed closes your receipt.",
  "me.outcomeOpenExpired": "Open — past the deadline, settlement pending",
  "me.outcomeOpen": "Open — settles at the deadline",
  "me.outcomeNotSettled": "{state} — not settled yet",
  "me.refundsAfterSettlement": "Refunds open after settlement runs.",
  "me.previewWin":
    "Current preview: on track to win at {price} test INJ — you would claim back {amount}.",
  "me.previewOutbid":
    "Current preview: below the clearing price ({price} test INJ) — you would claim a full refund.",
  "me.previewNoTier":
    "Current preview: no tier reaches its MOQ — a full refund if that holds at settlement.",
  "me.errorAlreadyClaimed": "Already claimed — this order is settled.",
  "me.errorWrongState": "Refunds open after settlement runs.",
  "me.errorNoOrder": "No order found for this wallet on this campaign.",
  "me.errorTransferFailed":
    "The transfer failed — your claim state is unchanged. Please try again.",
  "me.errorRejected":
    "You cancelled the wallet signature — no transaction was submitted.",
  "me.errorFallback": "Transaction failed. Please try again.",
  "me.unavailableBody":
    "Live reads for this campaign are unavailable right now — demo data is never used for your orders or claims.",
  "me.faucetLabel": "Faucet",
  "me.faucetTitle": "Need test INJ?",
  "me.faucetBody":
    "New wallets get 1 free test INJ after hCaptcha — enough to back FRAME-01 and claim refunds afterwards.",
  "me.faucetOpen": "Open the Injective faucet",
  "me.faucetYourWallet": "Your wallet:",
  "me.faucetConnectHint": "Connect your wallet to copy its address.",
  "me.slotLoadingAria": "{label} loading",

  // ------------------------------------------------------ /evidence page
  "ev.kicker": "Evidence",
  "ev.title": "Everything verifies onchain",
  "ev.intro":
    "The deployed FRAME-01 campaigns, their live state, and every transaction the ops CLI ran — each testnet hash deep-links to Blockscout.",
  "ev.successNote":
    "Scripted demo — the batch clears and winners claim the difference.",
  "ev.failureNote":
    "Scripted demo — no tier reaches its MOQ, everyone claims a full refund.",
  "ev.playgroundNote": "Open instance — any visitor can back this batch.",
  "ev.playgroundPending":
    "Deployment in progress — once the open instance address lands in deployments/injective-testnet.json, this card goes live with its own contract details.",
  "ev.metaNote":
    "Deployment metadata: deployments/injective-testnet.json · Live state: chain RPC reads",
  "ev.receiptsTitle": "Transaction receipts",
  "ev.receiptsIntro":
    "Receipt logs are written by the ops CLI as batches run (deployments/receipts/*.jsonl). Testnet rows deep-link to Blockscout; local anvil rehearsal rows are shown without links — the explorer never saw them.",
  "ev.receiptsEmpty":
    "No receipts yet — the ops CLI appends one line per transaction as batches run.",
  "ev.colTime": "Time (UTC)",
  "ev.colCampaign": "Campaign",
  "ev.colAction": "Action",
  "ev.colActor": "Actor",
  "ev.colNetwork": "Network",
  "ev.colTransaction": "Transaction",
  "ev.networkLocal": "local anvil",
  "ev.deadline": "Deadline",
  "ev.liveState": "Live state",
  "ev.liveOrders": "{count} orders",
  "ev.liveFailed": "Live read failed",
};
