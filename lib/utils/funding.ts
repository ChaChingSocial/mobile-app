import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl } from "@solana/web3.js";
import { Buffer } from "buffer";
import { Alert, Linking } from "react-native";

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

const parseAmountToUnits = (
  rawAmount: string,
  decimals: number
): bigint | null => {
  const normalized = rawAmount.trim();
  if (!/^(\d+(\.\d*)?|\.\d+)$/.test(normalized)) return null;
  const [wholePartRaw, fractionalPart = ""] = normalized.split(".");
  const wholePart = wholePartRaw === "" ? "0" : wholePartRaw;
  if (fractionalPart.length > decimals) return null;

  const wholeUnits = BigInt(wholePart) * 10n ** BigInt(decimals);
  const paddedFraction = (fractionalPart + "0".repeat(decimals)).slice(
    0,
    decimals
  );
  const fractionalUnits = BigInt(paddedFraction || "0");
  return wholeUnits + fractionalUnits;
};

const isWalletAuthorizationOrTimeoutError = (error: unknown) => {
  const message = (error instanceof Error ? error.message : String(error)).toLowerCase();
  return (
    message.includes("timed out") ||
    message.includes("timeout") ||
    message.includes("not been authorized") ||
    message.includes("not authorized") ||
    message.includes("method is not supported")
  );
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

const tryDecodeSignedTransaction = (encodedTransaction: string) => {
  const decodeAttempts: Array<() => Uint8Array> = [
    () => decodeBase58(encodedTransaction),
    () => Uint8Array.from(Buffer.from(encodedTransaction, "base64")),
  ];

  for (const decode of decodeAttempts) {
    try {
      const decoded = decode();
      Transaction.from(Buffer.from(decoded));
      return decoded;
    } catch {}
  }

  return null;
};

const extractSignedTransactionBytes = (response: unknown) => {
  const candidateKeys = [
    "transaction",
    "signedTransaction",
    "signed_transaction",
    "serializedTransaction",
    "serialized_transaction",
    "signature",
  ];
  const responseObject =
    response && typeof response === "object"
      ? (response as Record<string, unknown>)
      : null;

  if (!responseObject) return null;

  for (const key of candidateKeys) {
    const value = responseObject[key];
    if (typeof value === "string" && value.length > 0) {
      const decoded = tryDecodeSignedTransaction(value);
      if (decoded) return decoded;
    }
    if (Array.isArray(value) && value.every((item) => typeof item === "number")) {
      try {
        const bytes = Uint8Array.from(value as number[]);
        Transaction.from(Buffer.from(bytes));
        return bytes;
      } catch {}
    }
  }

  return null;
};

const waitForSignatureConfirmation = async (
  connection: Connection,
  signature: string,
  timeoutMs = 90000
) => {
  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    const statusResponse = await connection.getSignatureStatuses([signature], {
      searchTransactionHistory: true,
    });
    const status = statusResponse.value[0];

    if (status?.err) {
      throw new Error(`Transaction failed: ${JSON.stringify(status.err)}`);
    }

    if (
      status?.confirmationStatus === "confirmed" ||
      status?.confirmationStatus === "finalized"
    ) {
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1500));
  }

  throw new Error("Signature confirmation timed out");
};

const writeBigUInt64LE = (buffer: Buffer, value: bigint, offset: number) => {
  let remaining = value;
  for (let i = 0; i < 8; i++) {
    buffer[offset + i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
};

const findAssociatedTokenAddress = (owner: PublicKey, mint: PublicKey) =>
  PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  )[0];

const createAssociatedTokenAccountInstruction = (
  payer: PublicKey,
  associatedTokenAddress: PublicKey,
  owner: PublicKey,
  mint: PublicKey
) =>
  new TransactionInstruction({
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: associatedTokenAddress, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: PublicKey.default, isSigner: false, isWritable: false },
    ],
    data: Buffer.alloc(0),
  });

const createTransferCheckedInstruction = (
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number
) => {
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

export const SOL = "SOL" as const;
export const USDC = "USDC" as const;

export type ConnectedWallet = {
  name: string;
  address: string;
  connector: any;
};

export type SubmitFundingOptions = {
  connectedWallet: ConnectedWallet | null;
  fundingAsset: "SOL" | "USDC";
  fundAmount: string;
  useDevnet: boolean;
  resolveCommunityFundingDestination: () => string;
  phantomWalletConnector?: any;
  addCommunityPaidContribution?: (communityId: string, contribution: any) => Promise<void>;
  getCommunityContributors?: (communityId: string) => Promise<any[]>;
  session?: any;
  communityId?: string | string[];
  onSetIsFunding?: (v: boolean) => void;
  onSetShowFundModal?: (v: boolean) => void;
  onSetFundAmount?: (v: string) => void;
  onShowConnectWalletPrompt?: () => void;
  setContributors?: (c: any[]) => void;
  // New optional overrides so callers can pass amount/asset directly
  amount?: number | string | bigint; // human-readable amount (e.g. "0.5" or 0.5) or bigint base units
  amountInBaseUnits?: bigint; // explicit amount already converted to base units
  asset?: "SOL" | "USDC"; // override fundingAsset
  // Optional success message to display in the success alert (can include purpose like "for payment request")
  successMessage?: string;
  // Optional explicit destination address (recipient) — preferred over resolveCommunityFundingDestination()
  destinationAddress?: string;
};

// Module-level defaults registry so callers can call a simple submitFunding(...) without passing full context every time
let fundingDefaults: Partial<SubmitFundingOptions> | null = null;

export function registerFundingDefaults(defaults: Partial<SubmitFundingOptions>) {
  fundingDefaults = { ...(fundingDefaults || {}), ...defaults };
}

export async function submitFunding(
  amount: number | string | bigint,
  asset: "SOL" | "USDC",
  message?: string,
  overrides: Partial<SubmitFundingOptions> = {}
) {
  if (!fundingDefaults && Object.keys(overrides).length === 0) {
    throw new Error(
      "No funding defaults registered and no overrides provided. Call registerFundingDefaults(...) or pass necessary options in overrides."
    );
  }

  const merged: SubmitFundingOptions = {
    // pull required fields from defaults/overrides
    connectedWallet: (overrides.connectedWallet ?? fundingDefaults?.connectedWallet) as any,
    fundingAsset: asset,
    fundAmount: String(amount),
    useDevnet: (overrides.useDevnet ?? fundingDefaults?.useDevnet) as boolean,
    resolveCommunityFundingDestination: (overrides.resolveCommunityFundingDestination ?? fundingDefaults?.resolveCommunityFundingDestination) as any,
    phantomWalletConnector: overrides.phantomWalletConnector ?? fundingDefaults?.phantomWalletConnector,
    addCommunityPaidContribution: overrides.addCommunityPaidContribution ?? fundingDefaults?.addCommunityPaidContribution,
    getCommunityContributors: overrides.getCommunityContributors ?? fundingDefaults?.getCommunityContributors,
    session: overrides.session ?? fundingDefaults?.session,
    communityId: overrides.communityId ?? fundingDefaults?.communityId,
    onSetIsFunding: overrides.onSetIsFunding ?? fundingDefaults?.onSetIsFunding,
    onSetShowFundModal: overrides.onSetShowFundModal ?? fundingDefaults?.onSetShowFundModal,
    onSetFundAmount: overrides.onSetFundAmount ?? fundingDefaults?.onSetFundAmount,
    onShowConnectWalletPrompt: overrides.onShowConnectWalletPrompt ?? fundingDefaults?.onShowConnectWalletPrompt,
    setContributors: overrides.setContributors ?? fundingDefaults?.setContributors,
    amount,
    asset,
    amountInBaseUnits: overrides.amountInBaseUnits ?? fundingDefaults?.amountInBaseUnits,
    successMessage: message ?? (overrides.successMessage ?? fundingDefaults?.successMessage),
    destinationAddress: overrides.destinationAddress ?? fundingDefaults?.destinationAddress,
  } as SubmitFundingOptions;

  return await submitFundingExternal(merged);
}

export async function submitFundingExternal(opts: SubmitFundingOptions) {
  const {
    connectedWallet,
    fundingAsset,
    fundAmount,
    useDevnet,
    resolveCommunityFundingDestination,
    phantomWalletConnector,
    addCommunityPaidContribution,
    getCommunityContributors,
    session,
    communityId,
    onSetIsFunding,
    onSetShowFundModal,
    onSetFundAmount,
    onShowConnectWalletPrompt,
    setContributors,
    // new options
    amount,
    amountInBaseUnits,
    asset,
    successMessage,
    destinationAddress,
  } = opts;

  if (!connectedWallet) {
    if (onSetShowFundModal) onSetShowFundModal(false);
    if (onShowConnectWalletPrompt) onShowConnectWalletPrompt();
    return { success: false, reason: "no-wallet" };
  }

  // Determine which asset to use: explicit override (asset) -> fundingAsset from caller
  const selectedAsset = asset ?? fundingAsset;
  const decimals = selectedAsset === "SOL" ? 9 : 6;

  // Resolve amount in base units. Priority:
  // 1) amountInBaseUnits (explicit bigint)
  // 2) amount (string|number|bigint) passed by caller
  // 3) fundAmount (legacy string from component state)
  let resolvedAmountInBaseUnits: bigint | null;
  if (typeof amountInBaseUnits === "bigint") {
    resolvedAmountInBaseUnits = amountInBaseUnits;
  } else if (amount !== undefined) {
    if (typeof amount === "bigint") {
      resolvedAmountInBaseUnits = amount;
    } else {
      resolvedAmountInBaseUnits = parseAmountToUnits(String(amount), decimals);
    }
  } else {
    resolvedAmountInBaseUnits = parseAmountToUnits(fundAmount, decimals);
  }

  if (!resolvedAmountInBaseUnits || resolvedAmountInBaseUnits <= 0n) {
    Alert.alert("Invalid amount", `Enter a valid ${selectedAsset} amount.`);
    return { success: false, reason: "invalid-amount" };
  }

  // Keep the existing safety check for SOL because SystemProgram.transfer expects a JS number for lamports
  if (selectedAsset === "SOL" && resolvedAmountInBaseUnits > BigInt(Number.MAX_SAFE_INTEGER)) {
    Alert.alert("Amount too large", "Please enter a smaller SOL amount.");
    return { success: false, reason: "amount-too-large" };
  }

  // Prefer explicit destinationAddress if provided, otherwise call the resolver
  const destinationAddr = destinationAddress ?? resolveCommunityFundingDestination();
  const destinationPublicKey = new PublicKey(destinationAddr);

  const targetCluster = useDevnet ? "devnet" : "mainnet-beta";
  const connection = new Connection(clusterApiUrl(targetCluster), "confirmed");
  const senderPublicKey = new PublicKey(connectedWallet.address);

  // --- Balance checks: avoid attempting transfers that will fail with "Insufficient lamports" ---
  // For SOL: ensure the sender's SOL balance can cover the requested lamports plus a small fee buffer
  const SOL_FEE_ESTIMATE = 5000; // lamports (~0.000005 SOL) — conservative small buffer
  if (selectedAsset === "SOL") {
    const senderBalance = await connection.getBalance(senderPublicKey, "confirmed");
    const requiredLamports = Number(resolvedAmountInBaseUnits) + SOL_FEE_ESTIMATE;
    if (senderBalance < requiredLamports) {
      const have = (senderBalance / 1e9).toFixed(9);
      const need = (requiredLamports / 1e9).toFixed(9);
      Alert.alert(
        "Insufficient SOL",
        `Your wallet has ${have} SOL but this payment requires ${need} SOL (including estimated fees). Please top up your wallet and try again.`
      );
      return { success: false, reason: "insufficient-lamports", balance: senderBalance, required: requiredLamports };
    }
  }

  try {
    if (onSetIsFunding) onSetIsFunding(true);
    if (
      connectedWallet.name === "Phantom" &&
      phantomWalletConnector &&
      phantomWalletConnector.sessionCluster !== targetCluster
    ) {
      await phantomWalletConnector.connect(targetCluster);
    }
    const tx = new Transaction();
    // Use 'finalized' to get the most up-to-date blockhash and reduce likelihood of expiry.
    const latestBlockhash = await connection.getLatestBlockhash("finalized");

    if (selectedAsset === "SOL") {
      tx.add(
        SystemProgram.transfer({
          fromPubkey: senderPublicKey,
          toPubkey: destinationPublicKey,
          lamports: Number(resolvedAmountInBaseUnits),
        })
      );
    } else {
      const usdcMint = new PublicKey(useDevnet ? USDC_DEVNET_MINT : USDC_MAINNET_MINT);
      const senderTokenAddress = findAssociatedTokenAddress(senderPublicKey, usdcMint);
      const destinationTokenAddress = findAssociatedTokenAddress(destinationPublicKey, usdcMint);

      const senderTokenInfo = await connection.getAccountInfo(senderTokenAddress);
      if (!senderTokenInfo) {
        Alert.alert(
          "USDC account not found",
          "Your connected wallet does not have a USDC token account on this network."
        );
        return { success: false, reason: "no-usdc-account" };
      }

      // Check USDC token balance to ensure sufficient funds
      try {
        const tokenBalanceResp = await connection.getTokenAccountBalance(senderTokenAddress);
        // tokenBalanceResp.value.amount is a string amount in base units
        const tokenAmountBase = BigInt(tokenBalanceResp.value.amount || "0");
        if (tokenAmountBase < resolvedAmountInBaseUnits) {
          const haveUi = tokenBalanceResp.value.uiAmount ?? Number(tokenAmountBase) / 10 ** 6;
          const needUi = Number(resolvedAmountInBaseUnits) / 10 ** 6;
          Alert.alert(
            "Insufficient USDC",
            `Your USDC balance is ${haveUi} USDC but this payment requires ${needUi} USDC. Please top up and try again.`
          );
          return { success: false, reason: "insufficient-usdc", balance: tokenAmountBase.toString(), required: resolvedAmountInBaseUnits.toString() };
        }
      } catch (e) {
        // If token balance lookup fails, continue — existing checks will catch any subsequent RPC errors
        console.warn("Failed to fetch USDC token account balance:", e);
      }

      const destinationTokenInfo = await connection.getAccountInfo(destinationTokenAddress);
      if (!destinationTokenInfo) {
        tx.add(
          createAssociatedTokenAccountInstruction(
            senderPublicKey,
            destinationTokenAddress,
            destinationPublicKey,
            usdcMint
          )
        );
      }

      tx.add(
        createTransferCheckedInstruction(
          senderTokenAddress,
          usdcMint,
          destinationTokenAddress,
          senderPublicKey,
          resolvedAmountInBaseUnits,
          6
        )
      );
    }

    // Set fee payer & recent blockhash before asking the wallet to sign/send
    tx.feePayer = senderPublicKey;
    tx.recentBlockhash = latestBlockhash.blockhash;

    // Some wallet connectors (mobile Phantom/Backpack) provide a signAndSendTransaction helper
    // which handles fetching a fresh blockhash server-side and submitting the tx immediately.
    // Prefer that to avoid 'blockhash not found' when the user takes time to approve in an external app.
    let signature: string | null = null;

    try {
      if (connectedWallet.connector && typeof connectedWallet.connector.signAndSendTransaction === "function") {
        // Connector will sign and send the transaction; the return shape varies by connector
        const res = await connectedWallet.connector.signAndSendTransaction(tx);
        if (typeof res === "string") {
          signature = res;
        } else if (res && typeof res === "object") {
          signature = (res as any).signature ?? (res as any).txid ?? (res as any).transactionId ?? null;
        }
        if (signature) {
          await waitForSignatureConfirmation(connection, signature);
        }
      }
    } catch (err) {
      // If the connector's signAndSendTransaction failed, fall back to signTransaction + sendRawTransaction
      console.warn("signAndSendTransaction failed, falling back to signTransaction:", err);
      signature = null;
    }

    if (!signature) {
      const signResponse = await connectedWallet.connector.signTransaction(tx);
      const signedTransactionBytes = extractSignedTransactionBytes(signResponse);
      if (!signedTransactionBytes) {
        Alert.alert(
          "Signing failed",
          "Wallet returned an unsupported signed transaction payload. Please try a different wallet or reconnect."
        );
        return { success: false, reason: "unsupported-signed-payload" };
      }

      try {
        signature = await connection.sendRawTransaction(signedTransactionBytes, {
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 3,
        });
        await waitForSignatureConfirmation(connection, signature);
      } catch (sendErr: any) {
        const msg = (sendErr instanceof Error ? sendErr.message : String(sendErr || "")).toLowerCase();
        if (msg.includes("blockhash not found") || msg.includes("transaction simulation failed")) {
          Alert.alert(
            "Transaction failed: expired blockhash",
            "The wallet approval took too long and the blockhash expired. If you're on mobile, try using a wallet that supports signAndSendTransaction (Phantom/Backpack), or reconnect and try again.",
          );
          return { success: false, reason: "blockhash-expired", error: sendErr };
        }
        throw sendErr;
      }
    }

    // Capture values
    // Compute human-readable donated amount from base units so it's correct for all callers
    const donatedAmount = Number(resolvedAmountInBaseUnits) / 10 ** decimals;
    const donatedAsset = selectedAsset;
    const donatedNetwork = useDevnet ? "devnet" : "mainnet-beta";

    if (onSetShowFundModal) onSetShowFundModal(false);
    if (onSetFundAmount) onSetFundAmount("");

    // Persist the contribution (best-effort)
    const cid = Array.isArray(communityId) ? communityId[0] : (communityId as string);
    if (cid && addCommunityPaidContribution) {
      addCommunityPaidContribution(cid, {
        userId: session?.uid ?? "",
        displayName: session?.displayName ?? "Anonymous",
        profilePic: session?.profilePic ?? null,
        amount: donatedAmount,
        asset: donatedAsset,
        transactionId: signature,
        network: donatedNetwork,
        status: "COMPLETED",
        date: new Date().toISOString(),
      })
        .then(() => getCommunityContributors ? getCommunityContributors(cid) : Promise.resolve([]))
        .then((res) => setContributors ? setContributors(res) : null)
        .catch((err) => console.warn("Failed to persist contribution:", err));
    }

    const solscanUrl = `https://solscan.io/tx/${signature}${donatedNetwork === "devnet" ? "?cluster=devnet" : ""}`;
    const alertTitle = successMessage && successMessage.length > 0 ? successMessage : "Funding submitted ✅";
    const alertMessage = `${donatedAsset} was sent to this community wallet.\n\nTransaction: ${signature}`;
    Alert.alert(
      alertTitle,
      alertMessage,
      [
        {
          text: "View on Solscan",
          onPress: () => Linking.openURL(solscanUrl).catch(() => {}),
        },
        { text: "Close", style: "cancel" },
      ]
    );

    return { success: true, signature, donatedAmount, donatedAsset, donatedNetwork };
  } catch (error) {
    console.error("Error funding community:", error);
    if (isWalletAuthorizationOrTimeoutError(error)) {
      Alert.alert(
        "Wallet approval needed",
        "Wallet approval timed out, was not authorized, or the wallet session expired. Reconnect in Profile and try funding again."
      );
    } else {
      Alert.alert(
        "Funding failed",
        "Could not submit this funding transaction. Please try again."
      );
    }

    return { success: false, reason: "error", error };
  } finally {
    if (onSetIsFunding) onSetIsFunding(false);
  }
}
