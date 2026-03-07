/**
 * useUsdcTransfer – reusable hook for sending USDC between two Solana wallets.
 *
 * Uses the same hand-rolled SPL-token instructions as communities/[slug].tsx so
 * we don't need the @solana/spl-token package.
 */

import { useState } from "react";
import { Alert } from "react-native";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  clusterApiUrl,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import {
  useBackpackDeeplinkWalletConnector,
  useDeeplinkWalletConnector,
} from "@privy-io/expo/connectors";
import { usePhantomClusterConnector } from "./usePhantomClusterConnector";
import { Buffer } from "buffer";

// ── Constants ────────────────────────────────────────────────────────────────

const USDC_MAINNET_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
const USDC_DEVNET_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

const TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL"
);

const BASE58_ALPHABET =
  "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
const BASE58_MAP = new Map(
  BASE58_ALPHABET.split("").map((char, index) => [char, index])
);

// ── Helpers (mirrors communities/[slug].tsx) ─────────────────────────────────

const writeBigUInt64LE = (buffer: Buffer, value: bigint, offset: number) => {
  let remaining = value;
  for (let i = 0; i < 8; i++) {
    buffer[offset + i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
};

const decodeBase58 = (input: string): Uint8Array => {
  if (input.length === 0) return new Uint8Array();
  const bytes = [0];
  for (let i = 0; i < input.length; i++) {
    const value = BASE58_MAP.get(input[i]);
    if (value === undefined) throw new Error("Invalid base58 string");
    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }
    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }
  let leadingZeroCount = 0;
  while (
    leadingZeroCount < input.length &&
    input[leadingZeroCount] === BASE58_ALPHABET[0]
  ) {
    leadingZeroCount++;
  }
  const decoded = new Uint8Array(leadingZeroCount + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    decoded[decoded.length - 1 - i] = bytes[i];
  }
  return decoded;
};

const tryDecodeSignedTransaction = (encoded: string): Uint8Array | null => {
  for (const decode of [
    () => decodeBase58(encoded),
    () => Uint8Array.from(Buffer.from(encoded, "base64")),
  ]) {
    try {
      const decoded = decode();
      Transaction.from(Buffer.from(decoded));
      return decoded;
    } catch {}
  }
  return null;
};

const extractSignedTransactionBytes = (response: unknown): Uint8Array | null => {
  const candidateKeys = [
    "transaction",
    "signedTransaction",
    "signed_transaction",
    "serializedTransaction",
    "serialized_transaction",
    "signature",
  ];
  const obj =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;
  if (!obj) return null;

  for (const key of candidateKeys) {
    const value = obj[key];
    if (typeof value === "string" && value.length > 0) {
      const decoded = tryDecodeSignedTransaction(value);
      if (decoded) return decoded;
    }
    if (
      Array.isArray(value) &&
      value.every((item) => typeof item === "number")
    ) {
      try {
        const bytes = Uint8Array.from(value as number[]);
        Transaction.from(Buffer.from(bytes));
        return bytes;
      } catch {}
    }
  }
  return null;
};

const findAssociatedTokenAddress = (
  owner: PublicKey,
  mint: PublicKey
): PublicKey =>
  PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];

const buildCreateAtaInstruction = (
  payer: PublicKey,
  ata: PublicKey,
  owner: PublicKey,
  mint: PublicKey
): TransactionInstruction =>
  new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: ata, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });

const buildTransferCheckedInstruction = (
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number
): TransactionInstruction => {
  const data = Buffer.alloc(10);
  data[0] = 12;
  writeBigUInt64LE(data, amount, 1);
  data[9] = decimals;
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
};

// ── Hook ─────────────────────────────────────────────────────────────────────

export interface UsdcTransferHook {
  /** Transfer USDC from the connected wallet to `toAddress`. Returns the tx signature. */
  transferUsdc: (toAddress: string, amountUsdc: number, useDevnet?: boolean) => Promise<string>;
  connectedAddress: string | null;
  isConnected: boolean;
  isTransferring: boolean;
  showWalletPicker: boolean;
  setShowWalletPicker: (v: boolean) => void;
  connectWallet: (wallet: "phantom" | "backpack" | "solflare") => Promise<void>;
}

export function useUsdcTransfer(): UsdcTransferHook {
  const appUrl =
    (process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL as string | undefined) ||
    "https://chachingsocial.io";

  const phantomConnector = usePhantomClusterConnector({
    appUrl,
    redirectUri: "/",
  });
  const backpackConnector = useBackpackDeeplinkWalletConnector({
    appUrl,
    redirectUri: "/",
  });
  const solflareConnector = useDeeplinkWalletConnector({
    appUrl,
    baseUrl: "https://solflare.com",
    encryptionPublicKeyName: "solflare_encryption_public_key",
    redirectUri: "/",
  });

  const [isTransferring, setIsTransferring] = useState(false);
  const [showWalletPicker, setShowWalletPicker] = useState(false);

  const connectedWallet =
    phantomConnector.isConnected && phantomConnector.address
      ? { name: "Phantom" as const, address: phantomConnector.address, connector: phantomConnector }
      : backpackConnector.isConnected && backpackConnector.address
        ? { name: "Backpack" as const, address: backpackConnector.address, connector: backpackConnector }
        : solflareConnector.isConnected && solflareConnector.address
          ? { name: "Solflare" as const, address: solflareConnector.address, connector: solflareConnector }
          : null;

  const connectWallet = async (wallet: "phantom" | "backpack" | "solflare") => {
    const connector =
      wallet === "phantom"
        ? phantomConnector
        : wallet === "backpack"
          ? backpackConnector
          : solflareConnector;
    setShowWalletPicker(false);
    try {
      await connector.connect();
    } catch (error) {
      const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
      if (!msg.includes("timed out") && !msg.includes("not been authorized")) {
        Alert.alert(
          "Connection failed",
          "Could not connect wallet. Make sure the app is installed and try again."
        );
      }
    }
  };

  const transferUsdc = async (
    toAddress: string,
    amountUsdc: number,
    useDevnet = false
  ): Promise<string> => {
    if (!connectedWallet) throw new Error("No wallet connected");

    const amountMicroUsdc = BigInt(Math.round(amountUsdc * 1_000_000));
    const cluster = useDevnet ? "devnet" : ("mainnet-beta" as const);
    const connection = new Connection(clusterApiUrl(cluster), "confirmed");
    const senderPk = new PublicKey(connectedWallet.address);
    const recipientPk = new PublicKey(toAddress);
    const usdcMint = new PublicKey(useDevnet ? USDC_DEVNET_MINT : USDC_MAINNET_MINT);

    setIsTransferring(true);
    try {
      // Ensure Phantom is on the right cluster
      if (
        connectedWallet.name === "Phantom" &&
        (phantomConnector as any).sessionCluster !== cluster
      ) {
        await phantomConnector.connect(cluster);
      }

      const senderAta = findAssociatedTokenAddress(senderPk, usdcMint);
      const recipientAta = findAssociatedTokenAddress(recipientPk, usdcMint);

      const senderAtaInfo = await connection.getAccountInfo(senderAta);
      if (!senderAtaInfo) {
        throw new Error(
          "USDC account not found — your wallet has no USDC on this network."
        );
      }

      const tx = new Transaction();
      const { blockhash } = await connection.getLatestBlockhash("confirmed");

      // Create recipient ATA if it doesn't exist
      const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
      if (!recipientAtaInfo) {
        tx.add(buildCreateAtaInstruction(senderPk, recipientAta, recipientPk, usdcMint));
      }

      tx.add(
        buildTransferCheckedInstruction(senderAta, usdcMint, recipientAta, senderPk, amountMicroUsdc, 6)
      );

      tx.feePayer = senderPk;
      tx.recentBlockhash = blockhash;

      const signResponse = await connectedWallet.connector.signTransaction(tx);
      const signedBytes = extractSignedTransactionBytes(signResponse);
      if (!signedBytes) {
        throw new Error("Wallet returned an unsupported signed transaction payload");
      }

      const signature = await connection.sendRawTransaction(signedBytes, {
        preflightCommitment: "confirmed",
        skipPreflight: false,
        maxRetries: 3,
      });

      return signature;
    } finally {
      setIsTransferring(false);
    }
  };

  return {
    transferUsdc,
    connectedAddress: connectedWallet?.address ?? null,
    isConnected: !!connectedWallet,
    isTransferring,
    showWalletPicker,
    setShowWalletPicker,
    connectWallet,
  };
}
