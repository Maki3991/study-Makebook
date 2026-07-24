export const copy = {
  global: {
    brand: "MAKEBOOK",
    nav: {
      brand: "MAKEBOOK",
      orders: "My Orders",
      console: "Console",
    },
    banner: {
      testnet:
        "Testnet demo: complete the full on-chain flow with free test INJ. Assets have no real value · Get test INJ →",
    },
    wallet: {
      connect: "Connect wallet",
      wrongNetwork: "Wrong network — click to switch",
      switching: "Switching network…",
    },
  },

  home: {
    hero: {
      title: "Name your max price. Factories produce to real demand.",
      sub: "Your bid is held in full by the contract. If the batch clears, you pay one uniform price and the difference is refunded automatically. If it does not clear, everyone gets a full refund.",
      cta: "Start demo",
    },
    steps: {
      title: "Get started in 3 steps",
      step1: "Connect wallet (auto-switches to Injective testnet)",
      step2: "Claim free test INJ",
      step3: "Place a bid on a batch",
    },
    batches: {
      title: "Active batches",
    },
  },

  batch: {
    a: { name: "Batch A" },
    b: { name: "Batch B", note: "Below-MOQ example batch" },
    bracelet: { name: "Batch A" },
    card: {
      orders: "{n}/50 orders",
      preview:
        "If it closed now: uniform price {price} test INJ, {count} orders clearing",
      previewInfeasible: "Below MOQ — would not clear yet",
      closed: "Closed — awaiting settlement",
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
    countdown: "{dd}d {hh}h {mm}m until deadline",
    orders: "{n}/50 orders",
  },

  product: {
    hashOk: "Product manifest hash verified, matches on-chain ✓",
    hashBad: "Manifest hash does not match on-chain — wait before placing an order",
    specsFrom: "Specs compiled by AI from real user comments and confirmed on-chain",
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
  },

  pledge: {
    title: "Back this batch",
    inputLabel: "Your max price (test INJ)",
    chipHint: "Reference price points",
    feasibleNow: "At current orders, this price would clear",
    infeasibleNow:
      "At current orders, this price would not clear yet (full refund after settlement)",
    cta: "Back now",
    ordered: "You bid {price} test INJ · View order",
    full: "This batch is full (50/50)",
    settleCta: "Settle now (anyone can trigger)",
    resultCta: "View settlement result",
  },

  quotes: {
    title: "Factory terms (demo factories)",
    row: "MOQ {minQty} · Unit price {price} test INJ · {eligible} orders eligible",
    rowShort: "{n} orders short",
  },

  curve: {
    title: "Demand curve: real orders at each price point",
  },

  result: {
    success:
      "Batch cleared: uniform price {price} test INJ, {count} orders",
    failure: "Below MOQ — batch did not clear, everyone gets a full refund",
    mine: {
      win: "You won: pay {clearing}, refund difference {diff} test INJ",
      lose: "Not selected: claim full refund {amount} test INJ",
      claimed: "Claimed ✓",
    },
    goClaim: "Claim refund",
  },

  drawer: {
    title: "Confirm backing",
    step: "Confirm order → Sign in wallet → Done",
    summary: "{product} × 1 · Your max price {price} test INJ",
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
    retry: "Retry",
  },

  orders: {
    empty: {
      connect: "Connect wallet to view orders",
      none: "You have no orders yet. Browse active batches.",
    },
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
      guest: "Connect wallet to identify your role (operator / factory)",
      viewer:
        "Current address is neither operator nor a registered factory. Compile and monitor are read-only; actions are disabled.",
      operator: "Operator",
      factory: "Registered factory (demo)",
    },
    compile: {
      title: "Demand compiler",
      source: "Comment source: {source} (switch between camera bag / bracelet sets)",
      run: "Compile",
      fixture: "Fixture",
      confirm: "Human confirm and generate manifest",
      hashOk: "manifestHash matches the anchor ✓",
      noWallet: "Compiling does not need a wallet — AI has no on-chain write permission",
    },
    admin: {
      title: "Batch monitor",
      note:
        "New batch deployment / factory registration / quotes are done by the deployment script (contracts/script/deploy-bracelet.sh); private keys never enter the browser.",
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
  },

  notOpen: {
    title: "Not open yet",
    body: "This batch has not been deployed. Check back once the operator opens it.",
  },

  errors: {
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
    TransferFailed: "Transfer failed — please retry. Funds remain in the contract and the state is unchanged.",
    RpcError: "On-chain data failed to load. Retrying…",
    fallback: "Action did not complete. Funds are untouched — please retry.",
  },
} as const;

export type Copy = typeof copy;
