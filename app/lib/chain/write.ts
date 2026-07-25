"use client";

import { useCallback, useState } from "react";
import { useAccount, useChainId, useWriteContract } from "wagmi";
import { useQueryClient } from "@tanstack/react-query";
import {
  parseUnits,
  parseEventLogs,
  ContractFunctionRevertedError,
  type Address,
  type Hash,
  type TransactionReceipt,
} from "viem";
import { makebookAbi } from "./abi";
import { CHAIN_ID, CAMPAIGNS, type CampaignId } from "./config";
import { mapErrorName, humanizeError } from "./errors";

export type TxStage =
  | "idle"
  | "signing"
  | "confirming"
  | "success"
  | "error";

export type DecodeReceipt<T> = (receipt: TransactionReceipt) => T;

export type TxExecution<T> = {
  preflight?: () => string | undefined;
  send: () => Promise<Hash>;
  decode: DecodeReceipt<T>;
};

export type UseTxResult<T = unknown> = {
  stage: TxStage;
  error: string | null;
  receipt: TransactionReceipt | null;
  result: T | null;
  execute: (tx: TxExecution<T>) => Promise<T | null>;
  reset: () => void;
};

export type PlaceOrderResult = {
  txHash: Hash;
  buyer: Address;
  maxPriceWei: bigint;
  variantHash: `0x${string}`;
};

export type SettleResult = {
  txHash: Hash;
  success: boolean;
  winningQuoteId: bigint;
  tierIndex: bigint;
  clearingPrice: bigint;
  winnerCount: bigint;
};

export type ClaimRefundResult = {
  txHash: Hash;
  buyer: Address;
  amount: bigint;
};

export type ClaimPayoutResult = {
  txHash: Hash;
  factory: Address;
  amount: bigint;
};

export type ClaimCreatorPayoutResult = {
  txHash: Hash;
  creator: Address;
  amount: bigint;
};

export type ClaimPlatformFeeResult = {
  txHash: Hash;
  feeRecipient: Address;
  amount: bigint;
};

function invalidateCampaignReads(
  queryClient: ReturnType<typeof useQueryClient>,
  campaignAddress: Address,
) {
  queryClient.invalidateQueries({
    predicate: (query) => {
      const first = query.queryKey[0] as Record<string, unknown> | undefined;
      return first?.address === campaignAddress;
    },
  });
}

function extractRevertReason(err: unknown): string {
  if (err instanceof ContractFunctionRevertedError) {
    return err.data?.errorName ?? "";
  }
  if (err instanceof Error) {
    if (
      err.message.includes("User rejected the request") ||
      err.message.includes("rejected")
    ) {
      return "UserRejected";
    }
    if (err.message.toLowerCase().includes("insufficient funds")) {
      return "InsufficientFunds";
    }
    const revertMatch = err.message.match(/reverted: ([A-Za-z]+)\(\)/);
    if (revertMatch) {
      return revertMatch[1];
    }
    const nameMatch = err.message.match(
      /errorName["']?\s*[:=]\s*["']?([A-Za-z]+)/,
    );
    if (nameMatch) {
      return nameMatch[1];
    }
  }
  return "";
}

export function useTx<T = unknown>(): UseTxResult<T> {
  const [stage, setStage] = useState<TxStage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [receipt, setReceipt] = useState<TransactionReceipt | null>(null);
  const [result, setResult] = useState<T | null>(null);

  const reset = useCallback(() => {
    setStage("idle");
    setError(null);
    setReceipt(null);
    setResult(null);
  }, []);

  const execute = useCallback(async (tx: TxExecution<T>) => {
    reset();

    if (tx.preflight) {
      const preflightError = tx.preflight();
      if (preflightError) {
        setError(preflightError);
        setStage("error");
        return null;
      }
    }

    setStage("signing");
    try {
      const hash = await tx.send();
      setStage("confirming");
      const { publicClient } = await import("./client");
      const receipt = await publicClient.waitForTransactionReceipt({ hash });
      const decoded = tx.decode(receipt);
      setReceipt(receipt);
      setResult(decoded);
      setStage("success");
      return decoded;
    } catch (err) {
      const reason = extractRevertReason(err);
      if (reason === "UserRejected" || reason === "InsufficientFunds") {
        setError(humanizeError(err) || mapErrorName(reason));
      } else if (reason) {
        setError(mapErrorName(reason));
      } else {
        setError(humanizeError(err));
      }
      setStage("error");
      return null;
    }
  }, [reset]);

  return { stage, error, receipt, result, execute, reset };
}

export function usePlaceOrder(id: CampaignId): UseTxResult<PlaceOrderResult> & {
  placeOrder: (maxPrice: string) => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<PlaceOrderResult>();
  const campaign = CAMPAIGNS[id];

  const placeOrder = useCallback(
    async (maxPrice: string) => {
      const result = await tx.execute({
        preflight: () => {
          if (!address) return mapErrorName("");
          if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
          if (!campaign.deployed || !campaign.deployment) {
            return mapErrorName("CampaignNotOpen");
          }
          try {
            parseUnits(maxPrice, 18);
          } catch {
            return mapErrorName("InvalidPayment");
          }
          return undefined;
        },
        send: async () => {
          const maxPriceWei = parseUnits(maxPrice, 18);
          return writeContractAsync({
            address: campaign.deployment!.address as Address,
            abi: makebookAbi,
            functionName: "placeOrder",
            args: [
              campaign.deployment!.manifestHash as `0x${string}`,
              maxPriceWei,
            ],
            value: maxPriceWei,
          });
        },
        decode: (receipt) => {
          const logs = parseEventLogs({
            abi: makebookAbi,
            eventName: "OrderPlaced",
            logs: receipt.logs,
          });
          const placed = logs[0];
          if (!placed) {
            throw new Error("OrderPlaced event not found in receipt");
          }
          return {
            txHash: receipt.transactionHash,
            buyer: placed.args.buyer as Address,
            maxPriceWei: placed.args.maxPrice as bigint,
            variantHash: placed.args.variantHash as `0x${string}`,
          };
        },
      });
      if (result) {
        queryClient.invalidateQueries({ queryKey: ["orders", id] });
        if (campaign.deployed && campaign.deployment) {
          invalidateCampaignReads(
            queryClient,
            campaign.deployment.address as Address,
          );
        }
      }
    },
    [address, chainId, campaign, id, queryClient, tx, writeContractAsync],
  );

  return { ...tx, placeOrder };
}

export function useSettle(id: CampaignId): UseTxResult<SettleResult> & {
  settle: () => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<SettleResult>();
  const campaign = CAMPAIGNS[id];

  const settle = useCallback(async () => {
    const result = await tx.execute({
      preflight: () => {
        if (!address) return mapErrorName("");
        if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
        if (!campaign.deployed || !campaign.deployment) {
          return mapErrorName("CampaignNotOpen");
        }
        return undefined;
      },
      send: async () => {
        return writeContractAsync({
          address: campaign.deployment!.address as Address,
          abi: makebookAbi,
          functionName: "settle",
        });
      },
      decode: (receipt) => {
        const logs = parseEventLogs({
          abi: makebookAbi,
          eventName: "CampaignSettled",
          logs: receipt.logs,
        });
        const settled = logs[0];
        if (!settled) {
          throw new Error("CampaignSettled event not found in receipt");
        }
        return {
          txHash: receipt.transactionHash,
          success: settled.args.success as boolean,
          winningQuoteId: settled.args.winningQuoteId as bigint,
          tierIndex: settled.args.tierIndex as bigint,
          clearingPrice: settled.args.clearingPrice as bigint,
          winnerCount: settled.args.winnerCount as bigint,
        };
      },
    });
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      if (campaign.deployed && campaign.deployment) {
        invalidateCampaignReads(
          queryClient,
          campaign.deployment.address as Address,
        );
      }
    }
  }, [address, chainId, campaign, id, queryClient, tx, writeContractAsync]);

  return { ...tx, settle };
}

export function useClaimRefund(id: CampaignId): UseTxResult<ClaimRefundResult> & {
  claimRefund: () => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<ClaimRefundResult>();
  const campaign = CAMPAIGNS[id];

  const claimRefund = useCallback(async () => {
    const result = await tx.execute({
      preflight: () => {
        if (!address) return mapErrorName("");
        if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
        if (!campaign.deployed || !campaign.deployment) {
          return mapErrorName("CampaignNotOpen");
        }
        return undefined;
      },
      send: async () => {
        return writeContractAsync({
          address: campaign.deployment!.address as Address,
          abi: makebookAbi,
          functionName: "claimRefund",
        });
      },
      decode: (receipt) => {
        const logs = parseEventLogs({
          abi: makebookAbi,
          eventName: "RefundClaimed",
          logs: receipt.logs,
        });
        const claimed = logs[0];
        if (!claimed) {
          throw new Error("RefundClaimed event not found in receipt");
        }
        return {
          txHash: receipt.transactionHash,
          buyer: claimed.args.buyer as Address,
          amount: claimed.args.amount as bigint,
        };
      },
    });
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      if (campaign.deployed && campaign.deployment) {
        invalidateCampaignReads(
          queryClient,
          campaign.deployment.address as Address,
        );
      }
    }
  }, [address, chainId, campaign, id, queryClient, tx, writeContractAsync]);

  return { ...tx, claimRefund };
}

export function useClaimPayout(id: CampaignId): UseTxResult<ClaimPayoutResult> & {
  claimPayout: () => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<ClaimPayoutResult>();
  const campaign = CAMPAIGNS[id];

  const claimPayout = useCallback(async () => {
    const result = await tx.execute({
      preflight: () => {
        if (!address) return mapErrorName("");
        if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
        if (!campaign.deployed || !campaign.deployment) {
          return mapErrorName("CampaignNotOpen");
        }
        return undefined;
      },
      send: async () => {
        return writeContractAsync({
          address: campaign.deployment!.address as Address,
          abi: makebookAbi,
          functionName: "claimPayout",
        });
      },
      decode: (receipt) => {
        const logs = parseEventLogs({
          abi: makebookAbi,
          eventName: "FactoryPayoutClaimed",
          logs: receipt.logs,
        });
        const claimed = logs[0];
        if (!claimed) {
          throw new Error("FactoryPayoutClaimed event not found in receipt");
        }
        return {
          txHash: receipt.transactionHash,
          factory: claimed.args.factory as Address,
          amount: claimed.args.amount as bigint,
        };
      },
    });
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      if (campaign.deployed && campaign.deployment) {
        invalidateCampaignReads(
          queryClient,
          campaign.deployment.address as Address,
        );
      }
    }
  }, [address, chainId, campaign, id, queryClient, tx, writeContractAsync]);

  return { ...tx, claimPayout };
}

export function useClaimCreatorPayout(
  id: CampaignId,
): UseTxResult<ClaimCreatorPayoutResult> & {
  claimCreatorPayout: () => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<ClaimCreatorPayoutResult>();
  const campaign = CAMPAIGNS[id];

  const claimCreatorPayout = useCallback(async () => {
    const result = await tx.execute({
      preflight: () => {
        if (!address) return mapErrorName("");
        if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
        if (!campaign.deployed || !campaign.deployment) {
          return mapErrorName("CampaignNotOpen");
        }
        return undefined;
      },
      send: async () => {
        return writeContractAsync({
          address: campaign.deployment!.address as Address,
          abi: makebookAbi,
          functionName: "claimCreatorPayout",
        });
      },
      decode: (receipt) => {
        const logs = parseEventLogs({
          abi: makebookAbi,
          eventName: "CreatorPayoutClaimed",
          logs: receipt.logs,
        });
        const claimed = logs[0];
        if (!claimed) {
          throw new Error("CreatorPayoutClaimed event not found in receipt");
        }
        return {
          txHash: receipt.transactionHash,
          creator: claimed.args.creator as Address,
          amount: claimed.args.amount as bigint,
        };
      },
    });
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      if (campaign.deployed && campaign.deployment) {
        invalidateCampaignReads(
          queryClient,
          campaign.deployment.address as Address,
        );
      }
    }
  }, [address, chainId, campaign, id, queryClient, tx, writeContractAsync]);

  return { ...tx, claimCreatorPayout };
}

export function useClaimPlatformFee(
  id: CampaignId,
): UseTxResult<ClaimPlatformFeeResult> & {
  claimPlatformFee: () => Promise<void>;
} {
  const { address } = useAccount();
  const chainId = useChainId();
  const { writeContractAsync } = useWriteContract();
  const queryClient = useQueryClient();
  const tx = useTx<ClaimPlatformFeeResult>();
  const campaign = CAMPAIGNS[id];

  const claimPlatformFee = useCallback(async () => {
    const result = await tx.execute({
      preflight: () => {
        if (!address) return mapErrorName("");
        if (chainId !== CHAIN_ID) return mapErrorName("WrongNetwork");
        if (!campaign.deployed || !campaign.deployment) {
          return mapErrorName("CampaignNotOpen");
        }
        return undefined;
      },
      send: async () => {
        return writeContractAsync({
          address: campaign.deployment!.address as Address,
          abi: makebookAbi,
          functionName: "claimPlatformFee",
        });
      },
      decode: (receipt) => {
        const logs = parseEventLogs({
          abi: makebookAbi,
          eventName: "PlatformFeeClaimed",
          logs: receipt.logs,
        });
        const claimed = logs[0];
        if (!claimed) {
          throw new Error("PlatformFeeClaimed event not found in receipt");
        }
        return {
          txHash: receipt.transactionHash,
          feeRecipient: claimed.args.feeRecipient as Address,
          amount: claimed.args.amount as bigint,
        };
      },
    });
    if (result) {
      queryClient.invalidateQueries({ queryKey: ["orders", id] });
      if (campaign.deployed && campaign.deployment) {
        invalidateCampaignReads(
          queryClient,
          campaign.deployment.address as Address,
        );
      }
    }
  }, [address, chainId, campaign, id, queryClient, tx, writeContractAsync]);

  return { ...tx, claimPlatformFee };
}
