export const copy = {
  global: {
    brand: "MAKEBOOK",
    nav: {
      brand: "MAKEBOOK",
      orders: "My Orders",
      console: "Console",
    },
    a11y: {
      toggleLanguage: "Toggle language",
      close: "Close",
      demandCurve: "Demand curve",
      openMenu: "Open menu",
      loading: "Loading…",
    },
    banner: {
      testnet: {
        message:
          "Complete the full on-chain flow with free test INJ. Assets have no real value",
        cta: "Get test INJ →",
      },
    },
    wallet: {
      connect: "Connect wallet",
      wrongNetwork: "Wrong network — click to switch",
      switching: "Switching network…",
      installMetaMask: "Install MetaMask →",
    },
    errorPage: {
      title: "Something went wrong",
      body: "An unexpected error occurred. On-chain state is unaffected — retry or head back home.",
      retry: "Retry",
      home: "Back to home",
    },
    notFound: {
      title: "Page not found",
      body: "This page does not exist.",
      home: "Back to home",
    },
  },

  home: {
    hero: {
      title:
        "Name your max price. The brand orders against it, the factory produces against it.",
      sub: "Your bid is held in full by the contract. If the batch clears, you pay one uniform price and the difference is refunded automatically. If it does not clear, everyone gets a full refund.",
      cta: "See live batches",
    },
    steps: {
      title: "Get started in 3 steps",
      stepLabel: "Step {n}",
      step1: "Connect wallet (auto-switches to Injective testnet)",
      step2: "Claim free test INJ",
      step3: "Bid on what you want",
    },
    batches: {
      title: "Active batches",
    },
    ticker: {
      openBatches: "Batches live",
      orders: "Total orders",
      escrowed: "Escrowed",
      escrowedValue: "{amount} test INJ",
      untilDeadline: "Until deadline",
    },
    // Spec 009 §3.3: creator-facing narrative block on the home page. The 2%
    // fee and "your" stay bold-able via split segments. Never use
    // profit/return/invest wording in this section (spec 009 §2.1 rule 1).
    creator: {
      title: "Run a production line without inventory",
      sub: "For creators with a community and an idea, who don't want to stake all their cash flow on one try.",
      cards: {
        noInventory: {
          title: "You never order first",
          body: "Buyers' money is locked in the contract in full, first. Production starts only when MOQ is met; otherwise everyone is refunded in full. Inventory risk is not on you.",
        },
        margin: {
          title: "You keep the retail margin",
          body1:
            "Clearing price = factory price × the markup factor you set. Booked on-chain the moment the batch clears; you claim it yourself — the platform never holds it. Platform fee ",
          fee: "2%",
          body2: " (big marketplaces take 8–12%).",
        },
        responsibility: {
          title: "What you own",
          body1:
            "Product liability, warranty, refunds and exchanges, shipping, community ops. The factory is ",
          your: "your",
          body2: " supplier — it never faces consumers directly.",
        },
      },
      flow: {
        label: "How a batch runs",
        steps: [
          "Pick a comment source",
          "AI compiles SKUs",
          "You confirm on-chain",
          "Factory quotes freeze",
          "Community bids",
          "Settlement",
          "You claim the margin",
        ],
      },
      cta: "Talk to us about your batch →",
      note: "Self-serve launch is V1; current batches are opened with help from the MAKEBOOK team.",
    },
  },

  // Spec 009 §1.7: provenance pills go through the dictionary — the enum value
  // itself is never rendered as visible text.
  provenance: {
    onchain: "ONCHAIN",
    aiGenerated: "AI GENERATED",
    humanConfirmed: "HUMAN CONFIRMED",
    demoFactory: "DEMO FACTORY",
    demoBrand: "DEMO BRAND",
    offchainDemo: "OFF-CHAIN DEMO",
    testnet: "TESTNET",
  },

  batch: {
    a: { name: "Batch A" },
    b: { name: "Batch B", note: "Demo: a below-MOQ batch" },
    bracelet: { name: "Community batch" },
    card: {
      orders: "{n}/50 orders",
      preview:
        "If it closed now: uniform price {price} test INJ, {count} orders clearing",
      previewInfeasible: "Below MOQ — not clearing at current orders",
      closed: "Closed — awaiting settlement",
      // N-3/spec 009 §2.1 rule 3: the card CTA names its destination instead
      // of reusing the hero CTA.
      cta: "View batch",
    },
  },

  preview: {
    title: "Demand being compiled",
    note:
      "These products are compiled by AI from the same set of user comments. They will open once demand is confirmed.",
    status: "Not yet open",
    from: "From comments {ids}",
  },

  status: {
    open: "Accepting orders",
    closed: "Closed",
    succeeded: "Cleared",
    failed: "Did not clear",
    // N-8: leading zero units are omitted — pick the template by magnitude.
    countdownUntil: "{span} until deadline",
    countdown: {
      dhm: "{dd}d {hh}h {mm}m",
      hm: "{hh}h {mm}m",
      m: "{mm}m",
    },
    // N-9: short badge-only status labels; long explanations drop to a micro
    // line next to the badge instead of living inside it.
    badge: {
      canClear: "Can clear",
      belowMoq: "Below MOQ",
    },
    orders: "{n}/50 orders",
    ordersLabel: "orders",
  },

  // Spec 009 §11.2 N-2: clearing-price monument at the top of the campaign
  // page. The preview label must frame the number as hypothetical — it is
  // never presented as a final result before settlement.
  monument: {
    previewLabel: "Clearing price · preview if it closed now",
    settledLabel: "Final clearing price",
    unit: "test INJ",
    context: "{winners} of {orders} orders clearing · {factory} · MOQ {moq}",
    contextSettled:
      "{winners} of {orders} orders cleared · {factory} · MOQ {moq}",
  },

  product: {
    hashOk: "Product manifest hash verified, matches on-chain ✓",
    hashBad: "Manifest hash does not match on-chain — wait before placing an order",
    specsFrom: "Specs compiled by AI from real user comments and confirmed on-chain",
    specsTitle: "Specs",
    manifestLoading: "Loading…",
    manifestError: "Failed to load manifest",
    spec: {
      key: {
        capacity: "Capacity",
        color: "Color",
        insert: "Insert",
        materials: "Materials",
        charms: "Charms",
        style: "Style",
        size: "Size",
      },
      value: {
        black: "Black",
        removable: "Removable",
      },
    },
    trust: {
      toggle: "On-chain verification",
      manifestTitle: "Manifest JSON",
      canonicalNote:
        "Canonical hash: keccak-256 of the manifest JSON with keys recursively sorted",
      onchainNote: "On-chain manifestHash() read from the contract",
      match: "Locally computed hash matches the on-chain anchor",
    },
  },

  pledge: {
    title: "Bid to pre-order",
    inputLabel: "Your max price (test INJ)",
    inputError: "Enter a price greater than 0",
    chipHint: "Reference price points",
    feasibleNow: "At current orders, this price would clear",
    infeasibleNow:
      "At current orders, this price would not clear yet (full refund after settlement)",
    cta: "Bid now",
    connectCta: "Connect wallet to bid",
    ordered: "You bid {price} test INJ · View order",
    full: "This batch is full (50/50)",
    settleCta: "Settle now (anyone can trigger)",
    resultCta: "View settlement result",
  },

  quotes: {
    title: "Factory quotes (factory price)",
    empty: "No factory quotes yet.",
    ordersSuffix: "orders",
    row: "MOQ {minQty} · Unit price {price} test INJ · {eligible} orders eligible",
    headers: {
      factory: "Factory",
      moq: "MOQ",
      factoryPrice: "Factory price",
      retailPrice: "Retail price",
      eligible: "Eligible",
      status: "Result",
    },
    result: {
      win: "Selected",
      lost: "Not selected",
    },
    reason: {
      win: "{n} eligible ≥ MOQ {moq} · most eligible → selected",
      infeasible: "{n} eligible < MOQ {moq} · infeasible",
      lost: "{n} eligible ≥ MOQ {moq}, but fewer than {winner} → not selected",
    },
    tiebreak:
      "Tie-break: highest eligibleCount → lowest factory price → lowest quoteId/tierIndex",
  },

  curve: {
    title: "Demand curve: real orders at each price point",
    yAxis: "Orders",
    xAxis: "Price (test INJ)",
    legendDemand: "Demand (orders at price)",
    legendClearing: "Clearing price",
    legendFeasible: "Feasible factory tier",
    legendInfeasible: "Infeasible factory tier",
    clearingLabel: "Uniform price {price} · {count} clearing",
    tooltip: {
      price: "Price {price} test INJ",
      orders: "{count} orders ≥ this price",
      clears: "Meets clearing price — clears",
      below: "Below clearing price — not selected",
      infeasible: "Below MOQ — would not clear yet",
    },
  },

  result: {
    title: "Settlement result",
    factoryPaidOut:
      "Factory payout claimed. Buyers can still claim their refunds.",
    success:
      "Batch cleared: uniform price {price} test INJ, {count} orders",
    failure: "Below MOQ — batch did not clear, everyone gets a full refund",
    viewSettleTx: "View settle tx ↗",
    mine: {
      win: "You won: pay {clearing}, refund difference {diff} test INJ",
      lose: "Not selected: claim full refund {amount} test INJ",
      claimed: "Claimed ✓",
    },
    goClaim: "Claim refund",
  },

  drawer: {
    title: "Confirm your bid",
    step: "Confirm order → Sign in wallet → Done",
    summary: "{product} × 1 · Your max price {price} test INJ",
    breakdown: {
      factory: "Factory price",
      markup: "Brand markup ×{factor}",
      youPay: "You pay (uniform clearing price)",
      ofWhich: "of which",
      creatorNet: "Brand receives",
      creatorNetNote: "(markup − platform fee)",
      platformFee: "Platform fee",
      platformFeeNote: "({pct}%)",
    },
    legal1:
      "You will lock {price} test INJ. If the uniform price is not higher than this, you will receive 1 × {product} and can claim the difference; otherwise you can claim a full refund. After submitting, the order cannot be cancelled.",
    legal2:
      "Your wallet address, max price and transaction will be publicly visible on Injective EVM Testnet. Do not use a main wallet that holds real assets.",
    check1: "I understand: the order cannot be cancelled after submitting",
    check2: "I understand: my address and bid will be public",
    submit: "Sign and pay {price} test INJ",
    signing: "Waiting for wallet signature…",
    confirming: "Confirming on-chain, please do not close…",
    success: "Order placed and held in full",
    viewOrder: "View my orders",
    viewTxBlockscout: "View on Blockscout",
    retry: "Retry",
  },

  orders: {
    subtitle: "Manage your bids and refunds across all active batches.",
    empty: {
      connect: "Connect wallet to view orders",
      connectBody:
        "Connect your wallet to see your active bids, refunds, and settlement results across all batches.",
      none: "You have no orders yet. Browse active batches.",
    },
    bidLabel: "Your bid",
    escrowed: "Held in escrow · deadline {date}",
    awaitingSettle: "Closed — awaiting settlement",
    refundDiff: "Selected · claim difference {amount} test INJ",
    refundFull:
      "Not selected / did not clear · claim full refund {amount} test INJ",
    noRefundNeeded:
      "Selected · no refund needed (you may still click to finalize)",
    claimed: "Claimed ✓",
    claim: "Claim {amount} test INJ",
    settle: "Settle now",
    viewTx: "View tx ↗",
  },

  console: {
    title: "Console",
    role: {
      subtitle:
        "Compile demand, monitor batches, and manage factory receivables.",
      guest: "Connect wallet to identify your role (operator / factory)",
      viewer:
        "Current address is neither operator nor a registered factory. Compile and monitor are read-only; actions are disabled.",
      operator: "Operator",
      factory: "Registered factory",
      creator: "Brand creator",
      platform: "Platform fee recipient",
      operatorNote:
        "Operator actions (open batch / register factory / submit quote) run via CLI — private keys never enter the browser.",
    },
    compile: {
      title: "Demand compiler",
      source: "Comment source: {source} (switch between camera bag / bracelet sets)",
      sourceLabel: "Source:",
      sourceCamera: "Camera bag (c01–c20)",
      sourceBracelet: "Bracelet (b01–b20)",
      run: "Compile",
      compiling: "Compiling…",
      fixture: "Fixture",
      confirm: "Human confirm and generate manifest",
      humanConfirmTitle: "Human confirm manifest",
      editJsonHint:
        "Edit the JSON below, then confirm to compute canonicalHash and check against the on-chain anchor.",
      confirmHashButton: "Confirm and compute hash",
      validComments: "valid comments",
      candidates: "candidates",
      stats: "{valid} valid comments · {candidates} candidates",
      sourceFrom: "from {ids}",
      operational: "operational",
      confidence: {
        high: "high",
        medium: "medium",
        low: "low",
      },
      hashOk: "manifestHash matches the anchor ✓",
      hashMismatch: "Hash mismatch: {hash}… vs anchor {anchor}…",
      viewJson: "View manifest JSON",
      noWallet: "Compiling does not need a wallet — AI has no on-chain write permission",
      sourcePaste: "Paste your own comments",
      pasteHint: "One comment per line, 10–50 comments",
      pasteCount: "{n} / 50",
      pasteTooFew: "Need at least 10 non-empty comments to compile",
      pasteTooMany: "Too many comments — keep it to 50 lines or fewer",
      noAnchor: "New manifest hash: {hash}… — use it to anchor a new batch",
    },
    admin: {
      title: "Batch monitor",
      note:
        "New batch deployment / factory registration / quotes are done by the deployment script (contracts/script/deploy-bracelet.sh); private keys never enter the browser.",
      noQuotes: "No quotes",
      clearing: "{price} · {count} clearing",
      cleared: "{price} · {count} cleared",
      headers: {
        batch: "Batch",
        state: "State",
        orders: "Orders",
        factoryQuotes: "Factory quotes",
        currentPreview: "Current preview",
        deadline: "Deadline",
      },
    },
    factory: {
      title: "My quotes",
      none: "Current address has no quote in this batch",
      win: "Won · receivable {amount} test INJ",
      lose: "Not selected",
      failed: "Did not clear — no receivable",
      claim: "Claim receivable {amount} test INJ",
      claimed: "Receivable claimed ✓",
    },
    creator: {
      title: "My batches",
      address: "Brand creator address",
      previewPrice: "Preview retail price",
      expected: "Expected brand receivable",
      actual: "Final receivable",
      awaitingSettle: "Claimable after settlement",
      previewInfeasible: "Below MOQ at current orders — no receivable",
      pending: "Not settled yet",
      win: "Cleared · brand receivable {amount} test INJ",
      failed: "Did not clear — no receivable",
      claim: "Claim brand receivable {amount} test INJ",
      claimed: "Brand receivable claimed ✓",
    },
    platform: {
      title: "Platform fees",
      address: "Fee recipient address",
      pending: "Not settled yet",
      win: "Cleared · platform fee {amount} test INJ",
      failed: "Did not clear — no fee",
      claim: "Claim platform fee {amount} test INJ",
      claimed: "Platform fee claimed ✓",
    },
  },

  campaign: {
    contractLabel: "Contract:",
    brand: {
      byline: "Sold by {brand}",
    },
    evidence: {
      title: "On-chain evidence",
      deployTxLabel: "Deploy tx:",
      activityTitle: "Recent orders",
      activityEmpty: "No orders yet.",
      viewAddress: "View address on Blockscout",
      copyAddress: "Copy address",
      copied: "Copied ✓",
      bid: "bid {amount} test INJ",
      time: {
        justNow: "just now",
        minutesAgo: "{n}m ago",
        hoursAgo: "{n}h ago",
        daysAgo: "{n}d ago",
      },
    },
  },

  fundsSplit: {
    title: "Where every penny goes",
    roles: {
      factory: "Factory",
      creator: "Brand",
      platform: "Platform",
    },
    columns: {
      role: "Role",
      amount: "Amount",
      share: "Share",
    },
    note: "Every unit is booked on-chain at settlement; each of the three parties claims its own share — the platform never holds the brand's or the factory's money.",
    basisPreview: "Per unit, at the current preview clearing price",
    basisSettled: "Per unit, at the final clearing price",
    totals:
      "{count} orders cleared — factory receivable {factory} · brand receivable {creator} · platform fee {platform} test INJ",
  },

  notOpen: {
    title: "Not open yet",
    body: "This batch has not been deployed. Check back once the operator opens it.",
  },

  errors: {
    ConnectRequired: "Please connect your wallet first",
    UserRejected: "You cancelled the signature. No order was created on-chain.",
    WrongNetwork: "Wrong network — click here to switch to Injective testnet",
    InsufficientFunds: "Not enough test INJ. Get free test tokens from the faucet first.",
    InvalidPayment: "Payment amount must equal your max price",
    DuplicateOrder: "This wallet already placed an order in this batch. Limit 1 per wallet.",
    OrderLimitReached: "This batch is full (50/50)",
    CampaignNotOpen: "This batch is not accepting orders right now",
    WrongState: "This action is not allowed at the current stage. The page is refreshing to the latest state.",
    DeadlinePassed: "Deadline passed — wait for settlement",
    DeadlineNotReached: "Deadline not reached — settlement is not available yet",
    NoOrder: "This wallet has no order in this batch",
    AlreadyClaimed: "Already claimed — cannot claim again",
    NotSelectedFactory: "Only the selected factory can claim this payout",
    NotCreator: "Only the brand creator address can claim this receivable",
    NotFeeRecipient: "Only the platform fee recipient address can claim this fee",
    InvalidFeeConfig: "This batch has an invalid fee configuration",
    TransferFailed: "Transfer failed — please retry. Funds remain in the contract and the state is unchanged.",
    RpcError: "On-chain data failed to load. Retrying…",
    fallback: "Action did not complete. Funds are untouched — please retry.",
  },
} as const;

export type Copy = typeof copy;
