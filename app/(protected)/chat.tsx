import {
    addParticipantToConversation,
    getOrCreateConversation,
    markMessagesAsRead,
    Message,
    MessageBudget,
    removeParticipantFromConversation,
    sendMessage,
    sendPaymentRequest,
    recordPayment,
    subscribeToMessages,
    toggleReaction,
    Conversation,
    updateConversationTitle,
    deleteConversation,
    deleteMessage,
    topUpMessageBudget,
    decrementMessageBudget,
    getMessageBudget,
    updateConversationGradient,
} from "@/lib/api/messages";
import { getAllUsers, getUserProfile, getUserMessagePricing } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Colors } from "@/lib/constants/Colors";
import { app } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { doc, getFirestore, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    KeyboardAvoidingView,
    Modal,
    Platform,
    Pressable,
    Switch,
    Text,
    TextInput,
    TouchableOpacity,
    View,
    ScrollView,
    Keyboard,
} from "react-native";
import {
    Avatar,
    AvatarFallbackText,
    AvatarImage,
} from "@/components/ui/avatar";
import { VideoView, useVideoPlayer } from "expo-video";
import LinearGradient from "react-native-linear-gradient";
import { gradients, getGradientByName, getGradientForKey } from "@/lib/constants/gradients";
import { Buffer } from "buffer";
import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction, clusterApiUrl, SYSVAR_RENT_PUBKEY, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useBackpackDeeplinkWalletConnector, useDeeplinkWalletConnector } from "@privy-io/expo/connectors";
import { usePhantomClusterConnector } from "@/lib/wallet/usePhantomClusterConnector";
import { submitFunding, SOL } from "@/lib/utils/funding";
import PaymentRequestSheet from "@/components/PaymentRequestSheet";
import AddUserSheet from "@/components/AddUserSheet";

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

// ── USDC transfer helpers (mirrors communities funding flow) ───────────────────
const USDC_MAINNET_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v");
const USDC_DEVNET_MINT = new PublicKey("4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU");
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

const writeBigUInt64LE = (buffer: Buffer, value: bigint, offset: number) => {
  let remaining = value;
  for (let i = 0; i < 8; i++) {
    buffer[offset + i] = Number(remaining & 0xffn);
    remaining >>= 8n;
  }
};

const findAssociatedTokenAddress = (owner: PublicKey, mint: PublicKey): PublicKey =>
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
  data[0] = 12; // TransferChecked instruction
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

const decodeBase58 = (input: string): Uint8Array => {
  const alphabet = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  const map = new Map(alphabet.split("").map((c, i) => [c, i] as const));
  const bytes = [0];
  for (let i = 0; i < input.length; i++) {
    const value = map.get(input[i]);
    if (value === undefined) throw new Error("Invalid base58");
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
  while (leadingZeroCount < input.length && input[leadingZeroCount] === alphabet[0]) leadingZeroCount++;
  const decoded = new Uint8Array(leadingZeroCount + bytes.length);
  for (let i = 0; i < bytes.length; i++) decoded[decoded.length - 1 - i] = bytes[i];
  return decoded;
};

const tryDecodeSignedTransaction = (encoded: string): Uint8Array | null => {
  for (const decode of [() => decodeBase58(encoded), () => Uint8Array.from(Buffer.from(encoded, "base64"))]) {
    try {
      const decoded = decode();
      Transaction.from(Buffer.from(decoded));
      return decoded;
    } catch {}
  }
  return null;
};

const extractSignedTransactionBytes = (response: unknown): Uint8Array | null => {
  const candidateKeys = ["transaction", "signedTransaction", "signed_transaction", "serializedTransaction", "serialized_transaction", "signature"];
  const obj = response && typeof response === "object" ? (response as Record<string, unknown>) : null;
  if (!obj) return null;
  for (const key of candidateKeys) {
    const value: any = obj[key as keyof typeof obj];
    if (typeof value === "string" && value.length > 0) {
      const decoded = tryDecodeSignedTransaction(value);
      if (decoded) return decoded;
    }
    if (Array.isArray(value) && value.every((x) => typeof x === "number")) {
      try {
        const bytes = Uint8Array.from(value as number[]);
        Transaction.from(Buffer.from(bytes));
        return bytes;
      } catch {}
    }
  }
  return null;
};

async function transferUsdcViaConnectedWallet(
  connected: { name: "Phantom" | "Backpack" | "Solflare"; address: string; connector: any },
  toAddress: string,
  amountUsdc: number,
  useDevnet: boolean
): Promise<string> {
  const cluster = useDevnet ? "devnet" : ("mainnet-beta" as const);
  // Ensure Phantom cluster matches
  if (connected.name === "Phantom" && connected.connector.sessionCluster !== cluster) {
    await connected.connector.connect(cluster);
  }
  const connection = new Connection(clusterApiUrl(cluster), "confirmed");
  const senderPk = new PublicKey(connected.address);
  const recipientPk = new PublicKey(toAddress);
  const mint = useDevnet ? USDC_DEVNET_MINT : USDC_MAINNET_MINT;
  const senderAta = findAssociatedTokenAddress(senderPk, mint);
  const recipientAta = findAssociatedTokenAddress(recipientPk, mint);

  const senderAtaInfo = await connection.getAccountInfo(senderAta);
  if (!senderAtaInfo) {
    throw new Error("USDC account not found — your wallet has no USDC on this network.");
  }

  const tx = new Transaction();
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  const recipientAtaInfo = await connection.getAccountInfo(recipientAta);
  if (!recipientAtaInfo) {
    tx.add(buildCreateAtaInstruction(senderPk, recipientAta, recipientPk, mint));
  }
  const amountMicro = BigInt(Math.round(amountUsdc * 1_000_000));
  tx.add(buildTransferCheckedInstruction(senderAta, mint, recipientAta, senderPk, amountMicro, 6));
  tx.feePayer = senderPk;
  tx.recentBlockhash = blockhash;

  const signResponse = await connected.connector.signTransaction(tx);
  const signedBytes = extractSignedTransactionBytes(signResponse) ?? new Uint8Array(tx.serialize({ requireAllSignatures: false }));
  const signature = await connection.sendRawTransaction(signedBytes, { preflightCommitment: "confirmed", skipPreflight: false, maxRetries: 3 });
  return signature;
}

async function transferSolViaConnectedWallet(
  connected: { name: "Phantom" | "Backpack" | "Solflare"; address: string; connector: any },
  toAddress: string,
  amountSol: number,
  useDevnet: boolean
): Promise<string> {
  const cluster = useDevnet ? "devnet" : ("mainnet-beta" as const);
  if (connected.name === "Phantom" && connected.connector.sessionCluster !== cluster) {
    await connected.connector.connect(cluster);
  }
  const connection = new Connection(clusterApiUrl(cluster), "confirmed");
  const senderPk = new PublicKey(connected.address);
  const recipientPk = new PublicKey(toAddress);
  const tx = new Transaction();
  const { blockhash } = await connection.getLatestBlockhash("confirmed");
  tx.add(
    SystemProgram.transfer({
      fromPubkey: senderPk,
      toPubkey: recipientPk,
      lamports: Math.round(amountSol * LAMPORTS_PER_SOL),
    })
  );
  tx.feePayer = senderPk;
  tx.recentBlockhash = blockhash;
  const signResponse = await connected.connector.signTransaction(tx);
  const signedBytes = extractSignedTransactionBytes(signResponse) ?? new Uint8Array(tx.serialize({ requireAllSignatures: false }));
  const signature = await connection.sendRawTransaction(signedBytes, { preflightCommitment: "confirmed", skipPreflight: false, maxRetries: 3 });
  return signature;
}

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadChatMedia(
    localUri: string,
    conversationId: string,
    senderId: string,
    mediaType: "image" | "video"
): Promise<string> {
    const ext = mediaType === "video" ? "mp4" : "jpg";
    const path = `chat-media/${conversationId}/${senderId}_${Date.now()}.${ext}`;
    const storage = getStorage(app);
    const storageRef = ref(storage, path);

    const response = await fetch(localUri);
    const blob = await response.blob();
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
}

// ── Media picker action sheet ─────────────────────────────────────────────────
function MediaPickerSheet({
                              visible,
                              onClose,
                              onPick,
                              onPaymentRequest,
                          }: {
    visible: boolean;
    onClose: () => void;
    onPick: (uri: string, type: "image" | "video") => void;
    onPaymentRequest: () => void;
}) {
    const requestAndPick = async (
        source: "library" | "camera",
        mediaTypes: ImagePicker.MediaType
    ) => {
        onClose();

        const permFn =
            source === "camera"
                ? ImagePicker.requestCameraPermissionsAsync
                : ImagePicker.requestMediaLibraryPermissionsAsync;
        const { status } = await permFn();
        if (status !== "granted") return;

        const pickerFn =
            source === "camera"
                ? ImagePicker.launchCameraAsync
                : ImagePicker.launchImageLibraryAsync;

        const result = await pickerFn({
            mediaTypes,
            quality: 0.85,
            allowsEditing: false,
        });

        if (!result.canceled && result.assets.length > 0) {
            const asset = result.assets[0];
            const isVideo = asset.type === "video";
            onPick(asset.uri, isVideo ? "video" : "image");
        }
    };

    if (!visible) return null;
    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                onPress={onClose}
            >
                <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}>
                    <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginVertical: 12 }} />
                    {[
                        { label: "Photo from Library", icon: "image-outline" as const, action: () => requestAndPick("library", "images") },
                        { label: "Video from Library", icon: "videocam-outline" as const, action: () => requestAndPick("library", "videos") },
                        { label: "Take Photo", icon: "camera-outline" as const, action: () => requestAndPick("camera", "images") },
                        { label: "Record Video", icon: "radio-button-on-outline" as const, action: () => requestAndPick("camera", "videos") },
                        {
                            label: "Request Payment",
                            icon: "cash-outline" as const,
                            action: () => { onClose(); onPaymentRequest(); },
                        },
                    ].map((item) => (
                        <TouchableOpacity
                            key={item.label}
                            onPress={item.action}
                            style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}
                        >
                            <Ionicons name={item.icon} size={24} color="#1e3a6e" />
                            <Text style={{ fontSize: 16, color: "#1f2937" }}>{item.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

// ── Message action sheet ──────────────────────────────────────────────────────
function MessageActionSheet({
                                visible,
                                isOwn,
                                onReply,
                                onDelete,
                                onClose,
                            }: {
    visible: boolean;
    isOwn: boolean;
    onReply: () => void;
    onDelete: () => void;
    onClose: () => void;
}) {
    if (!visible) return null;
    return (
        <Modal
            transparent
            animationType="slide"
            visible={visible}
            onRequestClose={onClose}
        >
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                onPress={onClose}
            >
                <Pressable onPress={() => {}}>
                    <View
                        style={{
                            backgroundColor: "white",
                            borderTopLeftRadius: 24,
                            borderTopRightRadius: 24,
                            paddingBottom: 36,
                            overflow: "hidden",
                        }}
                    >
                        {/* Drag handle */}
                        <View
                            style={{
                                width: 40,
                                height: 4,
                                backgroundColor: "#e5e7eb",
                                borderRadius: 2,
                                alignSelf: "center",
                                marginTop: 12,
                                marginBottom: 8,
                            }}
                        />

                        {/* Reply */}
                        <TouchableOpacity
                            onPress={() => { onClose(); onReply(); }}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 24,
                                paddingVertical: 16,
                                gap: 16,
                            }}
                        >
                            <View
                                style={{
                                    width: 40,
                                    height: 40,
                                    borderRadius: 20,
                                    backgroundColor: "#eff6ff",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="arrow-undo-outline" size={20} color="#1e3a6e" />
                            </View>
                            <Text style={{ fontSize: 16, fontWeight: "500", color: "#1f2937" }}>
                                Reply
                            </Text>
                        </TouchableOpacity>

                        <View style={{ height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 24 }} />

                        {/* Delete — own messages only */}
                        {isOwn && (
                            <TouchableOpacity
                                onPress={() => { onClose(); onDelete(); }}
                                style={{
                                    flexDirection: "row",
                                    alignItems: "center",
                                    paddingHorizontal: 24,
                                    paddingVertical: 16,
                                    gap: 16,
                                }}
                            >
                                <View
                                    style={{
                                        width: 40,
                                        height: 40,
                                        borderRadius: 20,
                                        backgroundColor: "#fef2f2",
                                        alignItems: "center",
                                        justifyContent: "center",
                                    }}
                                >
                                    <Ionicons name="trash-outline" size={20} color="#ef4444" />
                                </View>
                                <Text style={{ fontSize: 16, fontWeight: "500", color: "#ef4444" }}>
                                    Delete
                                </Text>
                            </TouchableOpacity>
                        )}

                        <View style={{ height: 1, backgroundColor: "#f3f4f6", marginHorizontal: 24, marginTop: isOwn ? 0 : 4 }} />

                        {/* Cancel */}
                        <TouchableOpacity
                            onPress={onClose}
                            style={{ alignItems: "center", paddingVertical: 16 }}
                        >
                            <Text style={{ fontSize: 16, fontWeight: "600", color: "#9ca3af" }}>
                                Cancel
                            </Text>
                        </TouchableOpacity>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ── Emoji picker ──────────────────────────────────────────────────────────────
function EmojiPicker({
                         visible,
                         onSelect,
                         onClose,
                     }: {
    visible: boolean;
    onSelect: (emoji: string) => void;
    onClose: () => void;
}) {
    if (!visible) return null;
    return (
        <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
            <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} onPress={onClose}>
                <View
                    style={{
                        position: "absolute",
                        bottom: 100,
                        alignSelf: "center",
                        backgroundColor: "white",
                        borderRadius: 32,
                        paddingHorizontal: 12,
                        paddingVertical: 8,
                        flexDirection: "row",
                        gap: 4,
                        shadowColor: "#000",
                        shadowOpacity: 0.15,
                        shadowRadius: 12,
                        elevation: 8,
                    }}
                >
                    {EMOJIS.map((emoji) => (
                        <TouchableOpacity key={emoji} onPress={() => onSelect(emoji)} style={{ padding: 6 }}>
                            <Text style={{ fontSize: 26 }}>{emoji}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

// ── Full-screen image viewer ──────────────────────────────────────────────────
function ImageViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
    return (
        <Modal transparent animationType="fade" visible onRequestClose={onClose}>
            <Pressable style={{ flex: 1, backgroundColor: "black", justifyContent: "center" }} onPress={onClose}>
                <Image source={{ uri }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
                <TouchableOpacity
                    onPress={onClose}
                    style={{ position: "absolute", top: 56, right: 20, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 }}
                >
                    <Ionicons name="close" size={22} color="white" />
                </TouchableOpacity>
            </Pressable>
        </Modal>
    );
}

// ── Inline video player ───────────────────────────────────────────────────────
function VideoMessagePlayer({ uri }: { uri: string }) {
    const player = useVideoPlayer({ uri }, (p) => {
        p.loop = false;
        p.muted = false;
    });

    return (
        <VideoView
            player={player}
            style={{ width: 220, height: 150 }}
            nativeControls
            allowsFullscreen
        />
    );
}


// ── Budget setup / top-up bottom sheet ───────────────────────────────────────
const MESSAGE_COUNT_PRESETS = [5, 10, 20, 50];

function BudgetSetupSheet({
                              visible,
                              onClose,
                              onTopUp,
                              recipientName,
                              recipientPricing,
                              currentBudget,
                          }: {
    visible: boolean;
    onClose: () => void;
    onTopUp: (count: number, txSignature: string, pricePerMsg: number, totalPaid: number) => Promise<void>;
    recipientName: string;
    recipientPricing: { messagePrice: number; walletAddress: string };
    currentBudget: MessageBudget | null;
}) {
    const [selectedCount, setSelectedCount] = useState(10);
    const [paying, setPaying] = useState(false);
    const [useDevnet, setUseDevnet] = useState(true);
    const [showWalletPicker, setShowWalletPicker] = useState(false);

    // Wallet connectors (same pattern as communities funding)
    const appUrl = (process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL as string | undefined) || "https://chachingsocial.io";
    const phantom = usePhantomClusterConnector({ appUrl, redirectUri: "/" });
    const backpack = useBackpackDeeplinkWalletConnector({ appUrl, redirectUri: "/" });
    const solflare = useDeeplinkWalletConnector({ appUrl, baseUrl: "https://solflare.com", encryptionPublicKeyName: "solflare_encryption_public_key", redirectUri: "/" });

    const connectedWallet =
        phantom.isConnected && phantom.address
            ? { name: "Phantom" as const, address: phantom.address, connector: phantom }
            : backpack.isConnected && backpack.address
                ? { name: "Backpack" as const, address: backpack.address, connector: backpack }
                : solflare.isConnected && solflare.address
                    ? { name: "Solflare" as const, address: solflare.address, connector: solflare }
                    : null;

    const isConnected = !!connectedWallet;

    const pricePerMsg = recipientPricing.messagePrice;
    const totalCost = parseFloat((selectedCount * pricePerMsg).toFixed(6));

    const isTopUp = currentBudget !== null && currentBudget.messagesRemaining > 0;
    const title = isTopUp ? "Top Up Messages" : `Message ${recipientName}`;

    const handlePay = async () => {
        if (!isConnected) {
            setShowWalletPicker(true);
            return;
        }
        setPaying(true);
        try {
            const sig = await transferUsdcViaConnectedWallet(connectedWallet!, recipientPricing.walletAddress, totalCost, useDevnet);
            await onTopUp(selectedCount, sig, pricePerMsg, totalCost);
        } catch (error) {
            const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
            if (msg.includes("usdc account not found")) {
                Alert.alert("No USDC", "Your wallet doesn't have USDC on this network. Top up your wallet first.");
            } else if (
                msg.includes("timed out") ||
                msg.includes("not been authorized") ||
                msg.includes("not authorized") ||
                msg.includes("method is not supported") ||
                msg.includes("wallet not connected")
            ) {
                Alert.alert("Wallet approval needed", "Wallet approval timed out or session expired. Reconnect and try again.");
            } else {
                Alert.alert("Payment failed", "Could not process the USDC payment. Please try again.");
            }
        } finally {
            setPaying(false);
        }
    };

    if (!visible) return null;

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
                onPress={onClose}
            >
                <Pressable
                    onPress={() => {}}
                    style={{
                        backgroundColor: "white",
                        borderTopLeftRadius: 24,
                        borderTopRightRadius: 24,
                        paddingHorizontal: 24,
                        paddingBottom: 40,
                    }}
                >
                    {/* Handle */}
                    <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />

                    {/* Title */}
                    <Text style={{ fontSize: 18, fontWeight: "700", color: "#1f2937", marginBottom: 4 }}>
                        {title}
                    </Text>
                    <Text style={{ fontSize: 14, color: "#6b7280", marginBottom: 20 }}>
                        {recipientName} charges{" "}
                        <Text style={{ fontWeight: "700", color: "#1e3a6e" }}>${pricePerMsg.toFixed(2)} USDC</Text>
                        {" "}per message · Replies are free
                    </Text>

                    {/* Count presets */}
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151", marginBottom: 10 }}>
                        How many messages?
                    </Text>
                    <View style={{ flexDirection: "row", gap: 10, marginBottom: 20 }}>
                        {MESSAGE_COUNT_PRESETS.map((count) => (
                            <TouchableOpacity
                                key={count}
                                onPress={() => setSelectedCount(count)}
                                style={{
                                    flex: 1,
                                    paddingVertical: 12,
                                    borderRadius: 12,
                                    alignItems: "center",
                                    backgroundColor: selectedCount === count ? "#1e3a6e" : "#f3f4f6",
                                }}
                            >
                                <Text style={{ fontSize: 16, fontWeight: "700", color: selectedCount === count ? "white" : "#374151" }}>
                                    {count}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    {/* Total summary */}
                    <View
                        style={{
                            backgroundColor: "#f0f4ff",
                            borderRadius: 12,
                            padding: 14,
                            marginBottom: 20,
                            flexDirection: "row",
                            justifyContent: "space-between",
                            alignItems: "center",
                        }}
                    >
                        <Text style={{ fontSize: 14, color: "#6b7280" }}>
                            {selectedCount} messages
                        </Text>
                        <Text style={{ fontSize: 18, fontWeight: "700", color: "#1e3a6e" }}>
                            ${totalCost.toFixed(2)} USDC
                        </Text>
                    </View>

                    {/* Network toggle */}
                    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                        <Text style={{ fontSize: 13, color: "#374151", fontWeight: "600" }}>
                            Use Devnet
                        </Text>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                {useDevnet ? "Devnet" : "Mainnet"}
                            </Text>
                            <Switch value={useDevnet} onValueChange={setUseDevnet} disabled={paying} />
                        </View>
                    </View>

                    {/* Wallet status */}
                    {isConnected ? (
                        <Text style={{ fontSize: 12, color: "#6b7280", marginBottom: 12, textAlign: "center" }}>
                            Paying from {connectedWallet?.address.slice(0, 4)}…{connectedWallet?.address.slice(-4)}
                        </Text>
                    ) : (
                        <Text style={{ fontSize: 12, color: "#d97706", marginBottom: 12, textAlign: "center" }}>
                            No wallet connected — tap Pay to connect
                        </Text>
                    )}

                    {/* Pay button */}
                    <TouchableOpacity
                        onPress={handlePay}
                        disabled={paying}
                        style={{
                            backgroundColor: paying ? "#9ca3af" : "#1e3a6e",
                            borderRadius: 14,
                            paddingVertical: 16,
                            alignItems: "center",
                            marginBottom: 12,
                        }}
                    >
                        {paying ? (
                            <ActivityIndicator color="white" />
                        ) : (
                            <Text style={{ color: "white", fontSize: 16, fontWeight: "700" }}>
                                {isConnected ? `Pay $${totalCost.toFixed(2)} USDC` : "Connect Wallet & Pay"}
                            </Text>
                        )}
                    </TouchableOpacity>

                    {/* Wallet picker */}
                    <WalletPickerModal
                        visible={showWalletPicker}
                        onClose={() => setShowWalletPicker(false)}
                        onConnect={(w) => {
                            if (w === "phantom") phantom.connect();
                            else if (w === "backpack") backpack.connect();
                            else solflare.connect();
                        }}
                    />

                    <TouchableOpacity onPress={onClose} style={{ alignItems: "center", paddingVertical: 8 }}>
                        <Text style={{ fontSize: 14, color: "#9ca3af" }}>Cancel</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

// ── Wallet picker modal (reused by BudgetSetupSheet) ─────────────────────────
function WalletPickerModal({
                               visible,
                               onClose,
                               onConnect,
                           }: {
    visible: boolean;
    onClose: () => void;
    onConnect: (wallet: "phantom" | "backpack" | "solflare") => void;
}) {
    if (!visible) return null;
    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                onPress={onClose}
            >
                <View style={{ backgroundColor: "white", borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 24, paddingBottom: 40 }}>
                    <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 20 }} />
                    <Text style={{ fontSize: 17, fontWeight: "700", color: "#1f2937", marginBottom: 6 }}>Connect Wallet</Text>
<Text style={{ fontSize: 13, color: "#6b7280", marginBottom: 20 }}>Choose a wallet to pay</Text>
                    {(["phantom", "backpack", "solflare"] as const).map((w) => (
                        <TouchableOpacity
                            key={w}
                            onPress={() => { onClose(); onConnect(w); }}
                            style={{ borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12, paddingVertical: 14, paddingHorizontal: 16, marginBottom: 10 }}
                        >
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1e3a6e", textTransform: "capitalize" }}>{w}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
            </Pressable>
        </Modal>
    );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
    const { otherUserId, otherUserName, otherUserPic, conversationId: paramConversationId } = useLocalSearchParams<{
        otherUserId: string;
        otherUserName: string;
        otherUserPic: string;
        conversationId: string;
    }>();
    const { session } = useSession();
    const navigation = useNavigation();
    const router = useRouter();

    const [conversationId, setConversationId] = useState<string | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputText, setInputText] = useState("");
    const [sending, setSending] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(true);
    const [otherProfile, setOtherProfile] = useState<any>(null);
    const [allParticipants, setAllParticipants] = useState<any[]>([]);
    const [customTitle, setCustomTitle] = useState<string | null>(null);
    const [conversationGradient, setConversationGradient] = useState<string | null>(null);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const [editingTitle, setEditingTitle] = useState("");
    const [editModalVisible, setEditModalVisible] = useState(false);
    const [selectedGradientName, setSelectedGradientName] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);
    const [addingUserId, setAddingUserId] = useState<string | null>(null);

    // ── Per-message payment state ──────────────────────────────────────────────
    const [recipientPricing, setRecipientPricing] = useState<{
        messagePrice: number;
        walletAddress: string | null;
    } | null>(null);
    const [senderBudget, setSenderBudget] = useState<MessageBudget | null>(null);
    const [budgetSetupVisible, setBudgetSetupVisible] = useState(false);
    const initialBudgetCheckDoneRef = useRef(false);

    // Pending media (picked but not yet sent)
    const [pendingMedia, setPendingMedia] = useState<{
        uri: string;
        type: "image" | "video";
    } | null>(null);

    // Payment request sheet
    const [paymentRequestSheetVisible, setPaymentRequestSheetVisible] = useState<boolean>(false);


    // UI toggles
    const [mediaSheetVisible, setMediaSheetVisible] = useState(false);
    const [addUserSheetVisible, setAddUserSheetVisible] = useState(false);
    const [pickerVisible, setPickerVisible] = useState(false);
    const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
    const [expandedImage, setExpandedImage] = useState<string | null>(null);

    // Message action sheet state
    const [messageAction, setMessageAction] = useState<{
        messageId: string;
        isOwn: boolean;
        messageText: string;
        senderName: string;
    } | null>(null);

    // Reply state — tracks the message being replied to
    const [replyTo, setReplyTo] = useState<{
        id: string;
        text: string;
        senderName: string;
    } | null>(null);

    const flatListRef = useRef<FlatList>(null);

    const resolvedName = otherUserName || otherProfile?.displayName || "User";
    const resolvedPic = otherUserPic || otherProfile?.photoURL || "";

    // Build header title from custom title or participant names
    const headerTitle = customTitle || (allParticipants.length > 0
        ? allParticipants.map((p) => p.displayName || p.username || "Unknown").join(", ")
        : resolvedName);

    useEffect(() => {
        navigation.setOptions?.({
            title: headerTitle,
            headerLeft: () => (
                <TouchableOpacity
                    onPress={() => navigation.goBack()}
                    style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}
                >
                    <Ionicons name="chevron-back" size={24} color="#1e3a6e" />
                    <Text style={{ fontSize: 16, color: "#1e3a6e", fontWeight: "500" }}>
                        Inbox
                    </Text>
                </TouchableOpacity>
            ),
        });
    }, [headerTitle, navigation]);

    // Boot
    useEffect(() => {
        if (!session?.uid) return;
        if (!otherUserId && !paramConversationId) return;
        (async () => {
            setLoading(true);
            try {
                let convId: string;

                if (paramConversationId) {
                    // Group chat navigated from New Chat modal — use the ID directly
                    convId = paramConversationId;
                } else {
                    // 1:1 chat via profile — get or create conversation
                    const [id, profile] = await Promise.all([
                        getOrCreateConversation(session.uid, otherUserId),
                        getUserProfile(otherUserId),
                    ]);
                    convId = id;
                    setOtherProfile(profile ?? null);
                }

                setConversationId(convId);

                // Fetch the conversation document to get all participants and title
                const db = getFirestore(app);
                const conversationRef = doc(db, "conversations", convId);
                const conversationSnap = await getDoc(conversationRef);

                if (conversationSnap.exists()) {
                    const convData = conversationSnap.data() as Conversation;
                    setCustomTitle(convData.title ?? null);
                    setConversationGradient((convData as any).gradient ?? null);

                    // Fetch profiles for all participants
                    const participantProfiles = await Promise.all(
                        convData.participants.map(async (participantId) => {
                            try {
                                const participantProfile = await getUserProfile(participantId);
                                return participantProfile
                                    ? { ...participantProfile, userId: participantId }
                                    : { userId: participantId, displayName: "Unknown" };
                            } catch (e) {
                                console.error(`Error fetching profile for participant ${participantId}:`, e);
                                return { userId: participantId, displayName: "Unknown" };
                            }
                        })
                    );
                    setAllParticipants(participantProfiles);
                }
            } catch (e) {
                console.error("Error in chat boot:", e);
            } finally {
                setLoading(false);
            }
        })();
    }, [session?.uid, otherUserId, paramConversationId]);

    // Title management: handleSaveTitle is declared later (keeps gradient-persisting logic)

    // ── Pricing + budget loader (fires when participants list is ready) ──────────
    useEffect(() => {
        if (!session?.uid || !conversationId || allParticipants.length === 0) return;
        // Only apply pricing for 1-on-1 conversations
        if (allParticipants.length !== 2) return;
        if (initialBudgetCheckDoneRef.current) return;

        const other = allParticipants.find(
            (p) => (p.userId || p.id) !== session.uid
        );
        if (!other) return;
        const otherParticipantId: string = other.userId || other.id || "";
        if (!otherParticipantId) return;

        (async () => {
            const [pricing, budget] = await Promise.all([
                getUserMessagePricing(otherParticipantId),
                getMessageBudget(conversationId, session.uid!),
            ]);
            setRecipientPricing(pricing);
            setSenderBudget(budget);
            initialBudgetCheckDoneRef.current = true;

            // Auto-open budget sheet if recipient charges and sender has no budget
            if (pricing && pricing.messagePrice > 0 && pricing.walletAddress) {
                if (!budget || budget.messagesRemaining <= 0) {
                    setBudgetSetupVisible(true);
                }
            }
        })();
    }, [allParticipants, conversationId, session?.uid]);

    // Real-time messages
    useEffect(() => {
        if (!conversationId || !session?.uid) return;
        return subscribeToMessages(conversationId, (msgs) => {
            setMessages(msgs);
            markMessagesAsRead(conversationId, session.uid!);
        });
    }, [conversationId, session?.uid]);

    // Auto-scroll
    useEffect(() => {
        if (messages.length > 0) {
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        }
    }, [messages]);

    // ── Per-message budget top-up callback ────────────────────────────────────
    const handleBudgetTopUp = async (
        count: number,
        txSignature: string,
        pricePerMsg: number,
        totalPaid: number
    ) => {
        if (!conversationId || !session?.uid) return;
        await topUpMessageBudget(
            conversationId,
            session.uid,
            count,
            pricePerMsg,
            totalPaid,
            txSignature
        );
        setSenderBudget((prev) => ({
            messagesRemaining: (prev?.messagesRemaining ?? 0) + count,
            pricePerMsg,
            totalPaid: (prev?.totalPaid ?? 0) + totalPaid,
            txSignature,
            lastTopUpAt: null, // will be server timestamp on next read
        }));
        setBudgetSetupVisible(false);
    };

    const isPricedChat =
        (recipientPricing?.messagePrice ?? 0) > 0 &&
        !!recipientPricing?.walletAddress;

    // ── Helpers ───────────────────────────────────────────────────────────────
    const getSenderName = (senderId: string): string => {
        if (senderId === session?.uid) return "You";
        const participant = allParticipants.find(
            (p) => (p.userId || p.id) === senderId
        );
        return participant?.displayName || resolvedName;
    };

    // ── Payment request ───────────────────────────────────────────────────────
    const [showWalletPicker, setShowWalletPicker] = useState(false);

    // Wallet connectors for request/pay-now flows
    const appUrlForChat = (process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL as string | undefined) || "https://chachingsocial.io";
    const phantomForChat = usePhantomClusterConnector({ appUrl: appUrlForChat, redirectUri: "/" });
    const backpackForChat = useBackpackDeeplinkWalletConnector({ appUrl: appUrlForChat, redirectUri: "/" });
    const solflareForChat = useDeeplinkWalletConnector({ appUrl: appUrlForChat, baseUrl: "https://solflare.com", encryptionPublicKeyName: "solflare_encryption_public_key", redirectUri: "/" });
    const connectedWalletForChat =
        phantomForChat.isConnected && phantomForChat.address
            ? { name: "Phantom" as const, address: phantomForChat.address, connector: phantomForChat }
            : backpackForChat.isConnected && backpackForChat.address
                ? { name: "Backpack" as const, address: backpackForChat.address, connector: backpackForChat }
                : solflareForChat.isConnected && solflareForChat.address
                    ? { name: "Solflare" as const, address: solflareForChat.address, connector: solflareForChat }
                    : null;

const handleSendPaymentRequest = async (amountSol: number, description: string, useDevnet: boolean) => {
        if (!conversationId || !session?.uid) return;
        const walletAddress = connectedWalletForChat?.address;
        if (!walletAddress) {
            setShowWalletPicker(true);
            throw new Error("No wallet connected");
        }
await sendPaymentRequest(conversationId, session.uid, amountSol, description, walletAddress, useDevnet);
    };

const handlePayNow = async (
        messageId: string,
        recipientAddress: string,
        amountSol: number,
        useDevnet: boolean,
        description?: string
    ) => {
        if (!conversationId || !session?.uid) return;
        if (!connectedWalletForChat) {
            setShowWalletPicker(true);
            return;
        }
        try {
            // Use the shared funding helper which will prompt the wallet and return the signature
            const result = await submitFunding(
                amountSol,
                SOL,
                description ?? "Payment",
                {
                    connectedWallet: connectedWalletForChat,
                    useDevnet,
                    resolveCommunityFundingDestination: () => recipientAddress,
                    onSetIsFunding: (v: boolean) => setSending(v),
                    phantomWalletConnector: phantomForChat,
                }
            );

            if (!result || !result.success) {
                throw new Error("Payment failed");
            }

            const txSignature = result.signature as string;
            const profile = await getUserProfile(session.uid);
            await recordPayment(
                conversationId,
                messageId,
                session.uid,
                txSignature,
                amountSol,
                profile?.photoURL ?? undefined,
                profile?.displayName ?? undefined
            );
        } catch (e: any) {
            const msg = (e instanceof Error ? e.message : String(e ?? "")).toLowerCase();
            if (msg.includes("usdc account not found")) {
                Alert.alert("No USDC", "Your wallet doesn't have USDC on this network. Top up and try again.");
            } else if (
                msg.includes("timed out") ||
                msg.includes("not been authorized") ||
                msg.includes("not authorized") ||
                msg.includes("unexpected error") ||
                msg.includes("wallet not connected")
            ) {
                Alert.alert("Wallet approval needed", "Wallet approval timed out or session expired. Reconnect and try again.");
            } else {
                Alert.alert("Payment failed", e?.message ?? "Unknown error");
            }
        }
    };

    // ── Send ──────────────────────────────────────────────────────────────────
    const handleSend = async () => {
        if ((!inputText.trim() && !pendingMedia) || !conversationId || !session?.uid) return;

        // Block send if recipient charges and sender has no / exhausted budget
        if (isPricedChat) {
            if (!senderBudget || senderBudget.messagesRemaining <= 0) {
                setBudgetSetupVisible(true);
                return;
            }
        }

        setSending(true);
        const text = inputText;
        const media = pendingMedia;
        const replySnapshot = replyTo;
        setInputText("");
        setPendingMedia(null);
        setReplyTo(null);

        try {
            let uploadedMedia: { mediaUrl: string; mediaType: "image" | "video" } | undefined;

            if (media) {
                setUploading(true);
                let tick = 0;
                const timer = setInterval(() => {
                    tick = Math.min(tick + 12, 90);
                    setUploadProgress(tick);
                }, 200);

                try {
                    const url = await uploadChatMedia(media.uri, conversationId, session.uid, media.type);
                    uploadedMedia = { mediaUrl: url, mediaType: media.type };
                } finally {
                    clearInterval(timer);
                    setUploadProgress(100);
                    setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
                }
            }

            await sendMessage(
                conversationId,
                session.uid,
                text,
                uploadedMedia,
                replySnapshot
                    ? {
                        replyToId: replySnapshot.id,
                        replyToText: replySnapshot.text,
                        replyToSenderName: replySnapshot.senderName,
                    }
                    : undefined
            );

            // Decrement budget optimistically after successful send
            if (isPricedChat && senderBudget && senderBudget.messagesRemaining > 0) {
                decrementMessageBudget(conversationId, session.uid).catch(console.error);
                setSenderBudget((prev) =>
                    prev ? { ...prev, messagesRemaining: prev.messagesRemaining - 1 } : null
                );
            }
        } catch (e) {
            console.error("Error sending message:", e);
            setInputText(text);
            setPendingMedia(media);
            setReplyTo(replySnapshot);
        } finally {
            setSending(false);
        }
    };

    // ── Reactions ─────────────────────────────────────────────────────────────
    const openPicker = (messageId: string) => {
        setSelectedMessageId(messageId);
        setPickerVisible(true);
    };

    const handleReaction = async (emoji: string) => {
        setPickerVisible(false);
        if (!conversationId || !selectedMessageId || !session?.uid) return;
        try {
            await toggleReaction(conversationId, selectedMessageId, emoji, session.uid);
        } catch (e) {
            console.error("Error toggling reaction:", e);
        }
        setSelectedMessageId(null);
    };

    // ── Delete message ────────────────────────────────────────────────────────
    const handleDeleteMessage = async (messageId: string) => {
        if (!conversationId) return;
        try {
            await deleteMessage(conversationId, messageId);
        } catch (e) {
            console.error("Error deleting message:", e);
            Alert.alert("Error", "Failed to delete message. Please try again.");
        }
    };

    const handleMessageLongPress = (
        messageId: string,
        isOwn: boolean,
        messageText: string,
        senderName: string
    ) => {
        setMessageAction({ messageId, isOwn, messageText, senderName });
    };

    // ── Title management ──────────────────────────────────────────────────────
    const handleSaveTitle = async () => {
        if (!conversationId || !editingTitle.trim()) return;
        try {
            await updateConversationTitle(conversationId, editingTitle);
            // Persist gradient if changed
            if (selectedGradientName !== conversationGradient) {
                await updateConversationGradient(conversationId, selectedGradientName ?? null);
            }
            setCustomTitle(editingTitle);
            setConversationGradient(selectedGradientName ?? null);
            setEditModalVisible(false);
            setEditingTitle("");
            setSelectedGradientName(null);
        } catch (e) {
            console.error("Error updating title:", e);
        }
    };

    const handleDeleteConversation = async () => {
        if (!conversationId) return;
        try {
            setDeleting(true);
            await deleteConversation(conversationId);
            navigation.goBack();
        } catch (e) {
            console.error("Error deleting conversation:", e);
            setDeleting(false);
        }
    };

    // ── Participant management ─────────────────────────────────────────────────
    const navigateToUserProfile = (participant: any) => {
        const participantId = participant.userId || participant.id || "";
        if (!participantId || participantId === session?.uid) return;
        router.push({
            pathname: "/(protected)/user-profile",
            params: {
                id: participantId,
                displayName: participant.displayName || participant.username || "User",
                photoURL: participant.photoURL || participant.profilePic || "",
                bio: participant.bio || "",
                interests: JSON.stringify(participant.interests || []),
            },
        });
    };

    const handleRemoveUser = (participantId: string, displayName: string) => {
        if (!conversationId) return;
        Alert.alert(
            "Remove User",
            `Remove ${displayName} from this conversation?`,
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Remove",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await removeParticipantFromConversation(conversationId, participantId);
                            setAllParticipants((prev) =>
                                prev.filter((p) => (p.userId || p.id) !== participantId)
                            );
                        } catch (e) {
                            console.error("Error removing participant:", e);
                            Alert.alert("Error", "Failed to remove user. Please try again.");
                        }
                    },
                },
            ]
        );
    };

    const handleAddUser = async (user: any) => {
        if (!conversationId || addingUserId) return;
        const userId = user.userId || user.id;
        setAddingUserId(userId);
        try {
            await addParticipantToConversation(conversationId, userId);
            // Fetch their profile to enrich the local state
            const profile = await getUserProfile(userId);
            const newParticipant = profile
                ? { ...profile, userId }
                : { userId, displayName: user.displayName, photoURL: user.photoURL || "" };
            setAllParticipants((prev) => [...prev, newParticipant]);
            setAddUserSheetVisible(false);
        } catch (e) {
            console.error("Error adding participant:", e);
            Alert.alert("Error", "Failed to add user. Please try again.");
        } finally {
            setAddingUserId(null);
        }
    };

    // ── Render message ────────────────────────────────────────────────────────
    const renderMessage = ({ item }: { item: Message }) => {
        const isMe = item.senderId === session?.uid;
        // derive message colors from the conversation gradient:
        // - myMessageColor: darkened slice for the current user's bubbles
        // - otherMessageColor: lightened slice for other people's bubbles
        const baseColor = bgGradientColors()?.[0] ?? Colors.dark.tint;
        const myMessageColor = darkenHex(baseColor, 0.65);
        const otherMessageColor = lightenHex(baseColor, 0.25);
        const reactionSummary = Object.entries(item.reactions ?? {})
            .filter(([, uids]) => uids.length > 0)
            .map(([emoji, uids]) => ({
                emoji,
                count: uids.length,
                iMine: uids.includes(session?.uid ?? ""),
            }));

        const hasText = !!item.text;
        const hasMedia = !!item.mediaUrl;

        // ── Payment request bubble ─────────────────────────────────────────
        if (item.type === "paymentRequest" && item.paymentRequest) {
            const pr = item.paymentRequest;
            const payerEntries = Object.entries(pr.payers ?? {});
            const iHavePaid = !!pr.payers?.[session?.uid ?? ""];
            const iAmRequester = item.senderId === session?.uid;

            return (
                <View
                    key={item.id}
                    style={{ paddingHorizontal: 12, marginBottom: 12, alignItems: isMe ? "flex-end" : "flex-start" }}
                >
                    <View style={{
                        width: 260,
                        backgroundColor: "white",
                        borderRadius: 18,
                        borderWidth: 1.5,
                        borderColor: "#e5e7eb",
                        overflow: "hidden",
                        shadowColor: "#000",
                        shadowOpacity: 0.06,
                        shadowRadius: 8,
                        elevation: 2,
                    }}>
                        {/* Header */}
                        <View style={{ backgroundColor: "#1e3a6e", paddingHorizontal: 14, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 8 }}>
                            <Ionicons name="cash" size={16} color="white" />
                            <Text style={{ color: "white", fontWeight: "700", fontSize: 13 }}>Payment Request</Text>
                        </View>

                        <View style={{ padding: 14 }}>
                            {/* Description */}
                            <Text style={{ fontSize: 15, fontWeight: "600", color: "#1f2937", marginBottom: 4 }}>
                                {pr.description}
                            </Text>
                            {/* Amount */}
                                <Text style={{ fontSize: 22, fontWeight: "800", color: "#1e3a6e", marginBottom: 12 }}>
                                {pr.amountUsdc.toFixed(4)} <Text style={{ fontSize: 14, fontWeight: "500", color: "#6b7280" }}>SOL each</Text>
                            </Text>

                            {/* Divider */}
                            <View style={{ height: 1, backgroundColor: "#f3f4f6", marginBottom: 12 }} />

                            {/* Payer avatars */}
                            {payerEntries.length > 0 && (
                                <View style={{ marginBottom: 10 }}>
                                    <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 6 }}>
                                        {payerEntries.slice(0, 6).map(([uid, entry], i) => (
                                            <View
                                                key={uid}
                                                style={{
                                                    width: 30, height: 30, borderRadius: 15,
                                                    marginLeft: i === 0 ? 0 : -8,
                                                    borderWidth: 2, borderColor: "white",
                                                    overflow: "hidden",
                                                    backgroundColor: "#dbeafe",
                                                    zIndex: payerEntries.length - i,
                                                }}
                                            >
                                                {entry.avatarUrl ? (
                                                    <Image source={{ uri: entry.avatarUrl }} style={{ width: "100%", height: "100%" }} />
                                                ) : (
                                                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                                                        <Text style={{ fontSize: 11, fontWeight: "700", color: "#1e3a6e" }}>
                                                            {(entry.displayName ?? uid).slice(0, 1).toUpperCase()}
                                                        </Text>
                                                    </View>
                                                )}
                                            </View>
                                        ))}
                                        {payerEntries.length > 6 && (
                                            <Text style={{ fontSize: 11, color: "#6b7280", marginLeft: 6 }}>+{payerEntries.length - 6} more</Text>
                                        )}
                                    </View>
                                    <Text style={{ fontSize: 12, color: "#6b7280" }}>
                                        {payerEntries.length} paid · <Text style={{ fontWeight: "700", color: "#059669" }}>{pr.totalCollected.toFixed(4)} SOL collected</Text>
                                    </Text>
                                </View>
                            )}

                            {/* Action button */}
                            {iHavePaid ? (
                                <View style={{ backgroundColor: "#d1fae5", borderRadius: 10, paddingVertical: 10, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                    <Ionicons name="checkmark-circle" size={16} color="#059669" />
                                    <Text style={{ fontSize: 13, color: "#059669", fontWeight: "700" }}>You paid</Text>
                                </View>
                            ) : (
                                <TouchableOpacity
                                    onPress={() => handlePayNow(item.id, pr.recipientAddress, pr.amountUsdc, pr.useDevnet ?? false, pr.description)}
                                    style={{ backgroundColor: "#1e3a6e", borderRadius: 10, paddingVertical: 12, alignItems: "center" }}
                                >
                                    <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                                            Pay {pr.amountUsdc.toFixed(4)} SOL
                                    </Text>
                                </TouchableOpacity>
                            )}
                        </View>
                    </View>

                    {/* Timestamp */}
                    {item.createdAt && (
                        <Text style={{ fontSize: 10, color: "#9ca3af", marginTop: 4 }}>
                            {item.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                    )}
                </View>
            );
        }

        return (
            <View
                style={{
                    flexDirection: "row",
                    marginBottom: reactionSummary.length ? 18 : 8,
                    paddingHorizontal: 12,
                    justifyContent: isMe ? "flex-end" : "flex-start",
                }}
            >
                {!isMe && (
                    <Avatar size="sm" className="mr-2 self-end mb-1">
                        <AvatarFallbackText>{resolvedName}</AvatarFallbackText>
                        <AvatarImage source={{ uri: resolvedPic }} />
                    </Avatar>
                )}

                <View style={{ maxWidth: "72%" }}>
                    <Pressable
                        onPress={() => openPicker(item.id)}
                        onLongPress={() =>
                            handleMessageLongPress(
                                item.id,
                                isMe,
                                item.text,
                                getSenderName(item.senderId)
                            )
                        }
                        delayLongPress={350}
                        style={{
                            backgroundColor: isMe ? myMessageColor : otherMessageColor,
                            borderRadius: 18,
                            borderBottomRightRadius: isMe ? 4 : 18,
                            borderBottomLeftRadius: isMe ? 18 : 4,
                            overflow: "hidden",
                            borderWidth: isMe ? 0 : 1,
                            borderColor: "#e5e7eb",
                            elevation: 1,
                        }}
                    >
                        {/* Reply quote */}
                        {item.replyToId && (
                            <View
                                style={{
                                    backgroundColor: isMe ? "rgba(255,255,255,0.15)" : "#f3f4f6",
                                    borderLeftWidth: 3,
                                    borderLeftColor: isMe ? "rgba(255,255,255,0.5)" : otherMessageColor,
                                    borderRadius: 6,
                                    marginHorizontal: 8,
                                    marginTop: 8,
                                    paddingHorizontal: 8,
                                    paddingVertical: 5,
                                }}
                            >
                                <Text
                                    style={{
                                        fontSize: 10,
                                        fontWeight: "700",
                                        color: isMe ? "#93c5fd" : otherMessageColor,
                                        marginBottom: 2,
                                    }}
                                >
                                    {item.replyToSenderName}
                                </Text>
                                <Text
                                    style={{
                                        fontSize: 12,
                                        color: isMe ? "rgba(255,255,255,0.75)" : "#6b7280",
                                    }}
                                    numberOfLines={2}
                                >
                                    {item.replyToText}
                                </Text>
                            </View>
                        )}

                        {/* Media */}
                        {hasMedia && item.mediaType === "image" && (
                            <TouchableOpacity onPress={() => setExpandedImage(item.mediaUrl!)}>
                                <Image
                                    source={{ uri: item.mediaUrl }}
                                    style={{ width: 220, height: 180 }}
                                    resizeMode="cover"
                                />
                            </TouchableOpacity>
                        )}
                        {hasMedia && item.mediaType === "video" && (
                            <VideoMessagePlayer uri={item.mediaUrl!} />
                        )}

                        {/* Text */}
                        {hasText && (
                            <View style={{ paddingHorizontal: 14, paddingTop: hasMedia || item.replyToId ? 8 : 10, paddingBottom: 10 }}>
                                <Text style={{ fontSize: 14, color: isMe ? "white" : "#1f2937" }}>
                                    {item.text}
                                </Text>
                            </View>
                        )}

                        {/* Timestamp */}
                        {item.createdAt && (
                            <View style={{ paddingHorizontal: 14, paddingBottom: 8, alignItems: isMe ? "flex-end" : "flex-start" }}>
                                <Text style={{ fontSize: 10, color: isMe ? "white" : "black" }}>
                                    {item.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                                </Text>
                            </View>
                        )}
                    </Pressable>

                    {/* Reaction pills */}
                    {reactionSummary.length > 0 && (
                        <View
                            style={{
                                flexDirection: "row",
                                flexWrap: "wrap",
                                gap: 4,
                                marginTop: 4,
                                justifyContent: isMe ? "flex-end" : "flex-start",
                            }}
                        >
                            {reactionSummary.map(({ emoji, count, iMine }) => (
                                <TouchableOpacity
                                    key={emoji}
                                    onPress={() => {
                                        if (!conversationId || !session?.uid) return;
                                        toggleReaction(conversationId, item.id, emoji, session.uid);
                                    }}
                                    style={{
                                        flexDirection: "row",
                                        alignItems: "center",
                                        backgroundColor: iMine ? "#dbeafe" : "#f3f4f6",
                                        borderRadius: 12,
                                        paddingHorizontal: 7,
                                        paddingVertical: 3,
                                        borderWidth: iMine ? 1 : 0,
                                        borderColor: iMine ? "#93c5fd" : "transparent",
                                    }}
                                >
                                    <Text style={{ fontSize: 13 }}>{emoji}</Text>
                                    {count > 1 && (
                                        <Text style={{ fontSize: 11, marginLeft: 3, color: iMine ? "#1d4ed8" : "#6b7280", fontWeight: "600" }}>
                                            {count}
                                        </Text>
                                    )}
                                </TouchableOpacity>
                            ))}
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <View className="flex-1 items-center justify-center bg-white">
                <ActivityIndicator size="large" color={Colors.dark.tint} />
            </View>
        );
    }

    // Determine gradient colors to render
    // small helper to darken a #rrggbb color by a factor (0-1)
    const darkenHex = (hex: string, factor = 0.75) => {
        try {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            const nr = Math.max(0, Math.min(255, Math.round(r * factor)));
            const ng = Math.max(0, Math.min(255, Math.round(g * factor)));
            const nb = Math.max(0, Math.min(255, Math.round(b * factor)));
            const toHex = (v: number) => v.toString(16).padStart(2, '0');
            return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
        } catch (e) {
            return hex;
        }
    };

    // small helper to lighten a #rrggbb color by blending toward white.
    // factor is 0-1 where 0 = no change, 1 = white. Default 0.25 (subtle lighten).
    const lightenHex = (hex: string, factor = 0.25) => {
        try {
            const h = hex.replace('#', '');
            const r = parseInt(h.substring(0, 2), 16);
            const g = parseInt(h.substring(2, 4), 16);
            const b = parseInt(h.substring(4, 6), 16);
            const nr = Math.max(0, Math.min(255, Math.round(r + (255 - r) * factor)));
            const ng = Math.max(0, Math.min(255, Math.round(g + (255 - g) * factor)));
            const nb = Math.max(0, Math.min(255, Math.round(b + (255 - b) * factor)));
            const toHex = (v: number) => v.toString(16).padStart(2, '0');
            return `#${toHex(nr)}${toHex(ng)}${toHex(nb)}`;
        } catch (e) {
            return hex;
        }
    };

    const bgGradientColors = () => {
        if (conversationGradient) return getGradientByName(conversationGradient).colors;
        // Fallback deterministic by conversation id or session uid
        return getGradientForKey(conversationId ?? session?.uid ?? undefined).colors;
    };

    // Input bar gradient — darkened slice of the conversation colors
    const inputBarColors = () => {
        const g = bgGradientColors();
        if (!g || g.length === 0) return [Colors.dark.tint];
        // pick last two colors if available, otherwise map all
        const pick = g.length >= 2 ? g.slice(-2) : g;
        return pick.map((c) => darkenHex(c, 0.65));
    };

    const participantRowBg = darkenHex(bgGradientColors()?.[0] ?? Colors.dark.tint, 0.75);

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior="padding"
            keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
            <LinearGradient colors={bgGradientColors()} style={{ flex: 1 }}>
                {/* ── Custom header ── */}
                <View
                    style={{
                        backgroundColor: 'black',
                        paddingHorizontal: 16,
                        paddingTop: 55,
                        paddingBottom: 12,
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        borderBottomWidth: 1,
                        borderBottomColor: "rgba(255,255,255,0.15)",
                    }}
                >
                    <TouchableOpacity
                        onPress={() => navigation.goBack()}
                        style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
                    >
                        <Ionicons name="chevron-back" size={24} color="white" />
                        <Text style={{ fontSize: 14, color: "white", fontWeight: "600" }}>
                            Inbox
                        </Text>
                    </TouchableOpacity>

                    <View style={{ flex: 1 }} />

                    {/* Edit title / delete controls */}
                    {isEditingTitle ? (
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 200 }}>
                            <TextInput
                                style={{
                                    flex: 1,
                                    backgroundColor: "white",
                                    borderRadius: 6,
                                    paddingHorizontal: 10,
                                    paddingVertical: 6,
                                    fontSize: 13,
                                    color: "#1f2937",
                                    maxHeight: 40,
                                }}
                                placeholder="Enter title..."
                                placeholderTextColor="#9ca3af"
                                value={editingTitle}
                                onChangeText={setEditingTitle}
                                maxLength={50}
                            />
                            <TouchableOpacity
                                onPress={handleSaveTitle}
                                style={{ backgroundColor: "#10b981", borderRadius: 4, padding: 6 }}
                            >
                                <Ionicons name="checkmark" size={16} color="white" />
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={() => { setIsEditingTitle(false); setEditingTitle(""); }}
                                style={{ backgroundColor: "#ef4444", borderRadius: 4, padding: 6 }}
                            >
                                <Ionicons name="close" size={16} color="white" />
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <>
                            {/* Title */}
                            <Text
                                style={{
                                    fontSize: 15,
                                    fontWeight: "600",
                                    color: "white",
                                    textAlign: "center",
                                    maxWidth: "40%",
                                }}
                                numberOfLines={1}
                            >
                                {headerTitle}
                            </Text>

                            <TouchableOpacity
                                onPress={() => {
                                    setEditingTitle(customTitle || "");
                                    setSelectedGradientName(conversationGradient ?? null);
                                    setEditModalVisible(true);
                                }}
                                style={{ padding: 6 }}
                            >
                                <Ionicons name="pencil" size={18} color="white" />
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() =>
                                    Alert.alert(
                                        "Delete Chat",
                                        "Are you sure you want to delete this conversation? This action cannot be undone.",
                                        [
                                            { text: "Cancel", style: "cancel" },
                                            { text: "Delete", style: "destructive", onPress: handleDeleteConversation },
                                        ]
                                    )
                                }
                                disabled={deleting}
                                style={{ padding: 6, opacity: deleting ? 0.5 : 1 }}
                            >
                                <Ionicons name="trash" size={18} color={deleting ? "#9ca3af" : "white"} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>

                {/* ── Participants row ── */}
                {conversationId && (
                    <View
                        style={{
                            backgroundColor: participantRowBg,
                            paddingHorizontal: 16,
                            paddingVertical: 20,
                            borderBottomWidth: 1,
                            borderBottomColor: "rgba(255,255,255,0.12)",
                        }}
                    >
                        <FlatList
                            data={allParticipants}
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            keyExtractor={(item) => item.userId || item.id || "unknown"}
                            renderItem={({ item }) => {
                                const participantId = item.userId || item.id || "";
                                const isSelf = participantId === session?.uid;
                                const displayName = item.displayName || item.username || "User";

                                return (
                                    <View style={{ position: "relative", alignItems: "center", marginRight: 16 }}>
                                        {/* Tap avatar/name to view profile */}
                                        <TouchableOpacity
                                            onPress={() => navigateToUserProfile(item)}
                                            activeOpacity={isSelf ? 1 : 0.7}
                                            style={{ alignItems: "center" }}
                                        >
                                            <Avatar size="md" style={{ marginBottom: 4 }}>
                                                <AvatarFallbackText>{displayName}</AvatarFallbackText>
                                                <AvatarImage source={{ uri: item.photoURL || "" }} />
                                            </Avatar>
                                            <Text
                                                style={{
                                                    fontSize: 11,
                                                    color: 'white',
                                                    fontWeight: "500",
                                                    maxWidth: 60,
                                                    textAlign: "center",
                                                }}
                                                numberOfLines={1}
                                            >
                                                {isSelf ? "You" : displayName}
                                            </Text>
                                        </TouchableOpacity>

                                        {/* Remove badge — absolutely positioned sibling (not nested) */}
                                        {!isSelf && (
                                            <TouchableOpacity
                                                onPress={() => handleRemoveUser(participantId, displayName)}
                                                style={{
                                                    position: "absolute",
                                                    top: -4,
                                                    right: 6,
                                                    backgroundColor: "#ef4444",
                                                    borderRadius: 9,
                                                    width: 18,
                                                    height: 18,
                                                    alignItems: "center",
                                                    justifyContent: "center",
                                                    borderWidth: 1.5,
                                                    borderColor: Colors.dark.tint,
                                                    zIndex: 10,
                                                }}
                                            >
                                                <Ionicons name="close" size={10} color="white" />
                                            </TouchableOpacity>
                                        )}
                                    </View>
                                );
                            }}
                            ListFooterComponent={
                                <View style={{ alignItems: "center" }}>
                                    <TouchableOpacity
                                        onPress={() => setAddUserSheetVisible(true)}
                                        style={{
                                            width: 44,
                                            height: 44,
                                            borderRadius: 22,
                                            backgroundColor: "rgba(255,255,255,0.15)",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            borderWidth: 1.5,
                                            borderColor: "rgba(255,255,255,0.4)",
                                            marginBottom: 4,
                                        }}
                                    >
                                        <Ionicons name="person-add-outline" size={18} color="white" />
                                    </TouchableOpacity>
                                    <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Add</Text>
                                </View>
                            }
                        />
                    </View>
                )}

                {/* ── Messages ── */}
                <FlatList
                    ref={flatListRef}
                    data={messages}
                    keyExtractor={(item) => item.id}
                    renderItem={renderMessage}
                    contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingBottom: 10 }}
                    ListEmptyComponent={
                        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
                            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
                            <Text className="text-gray-400 mt-3 text-base">No messages yet</Text>
                            <Text className="text-gray-300 text-sm mt-1">Say hi to {resolvedName}!</Text>
                        </View>
                    }
                />

                {/* Upload progress bar */}
                {uploading && (
                    <View style={{ height: 3, backgroundColor: "#e5e7eb" }}>
                        <View
                            style={{
                                height: 3,
                                width: `${uploadProgress}%`,
                                backgroundColor: "#3b82f6",
                            }}
                        />
                    </View>
                )}

                {/* Pending media preview */}
                {pendingMedia && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            backgroundColor: "#1e3a6e",
                            gap: 10,
                        }}
                    >
                        {pendingMedia.type === "image" ? (
                            <Image
                                source={{ uri: pendingMedia.uri }}
                                style={{ width: 56, height: 56, borderRadius: 8 }}
                                resizeMode="cover"
                            />
                        ) : (
                            <View
                                style={{
                                    width: 56,
                                    height: 56,
                                    borderRadius: 8,
                                    backgroundColor: "#111827",
                                    alignItems: "center",
                                    justifyContent: "center",
                                }}
                            >
                                <Ionicons name="videocam" size={24} color="white" />
                            </View>
                        )}
                        <Text style={{ color: "white", fontSize: 13, flex: 1 }} numberOfLines={1}>
                            {pendingMedia.type === "image" ? "Photo ready to send" : "Video ready to send"}
                        </Text>
                        <TouchableOpacity onPress={() => setPendingMedia(null)}>
                            <Ionicons name="close-circle" size={22} color={Colors.light.tint} />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Budget indicator – shown in priced 1:1 chats */}
                {isPricedChat && (
                    senderBudget && senderBudget.messagesRemaining > 0 ? (
                        <View
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                paddingHorizontal: 16,
                                paddingVertical: 6,
                                backgroundColor: senderBudget.messagesRemaining <= 3 ? "#fef2f2" : "#f0f9ff",
                                borderTopWidth: 1,
                                borderTopColor: senderBudget.messagesRemaining <= 3 ? "#fecaca" : "#bae6fd",
                            }}
                        >
                            <Ionicons
                                name={senderBudget.messagesRemaining <= 3 ? "warning-outline" : "wallet-outline"}
                                size={13}
                                color={senderBudget.messagesRemaining <= 3 ? "#ef4444" : "#0284c7"}
                            />
                            <Text
                                style={{
                                    flex: 1,
                                    fontSize: 12,
                                    color: senderBudget.messagesRemaining <= 3 ? "#ef4444" : "#0284c7",
                                    marginLeft: 5,
                                }}
                            >
                                {senderBudget.messagesRemaining} message
                                {senderBudget.messagesRemaining !== 1 ? "s" : ""} remaining
                                {" "}(${senderBudget.pricePerMsg?.toFixed(2) ?? "?"}/msg)
                            </Text>
                            <TouchableOpacity onPress={() => setBudgetSetupVisible(true)}>
                                <Text style={{ fontSize: 12, color: "#0284c7", fontWeight: "700" }}>
                                    Top up
                                </Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <TouchableOpacity
                            onPress={() => setBudgetSetupVisible(true)}
                            style={{
                                flexDirection: "row",
                                alignItems: "center",
                                justifyContent: "center",
                                paddingVertical: 8,
                                backgroundColor: "#fffbeb",
                                borderTopWidth: 1,
                                borderTopColor: "#fde68a",
                                gap: 6,
                            }}
                        >
                            <Ionicons name="cash-outline" size={13} color="#d97706" />
                            <Text style={{ fontSize: 12, color: "#d97706", fontWeight: "600" }}>
                                Tap to set up your message budget (${recipientPricing!.messagePrice.toFixed(2)}/msg)
                            </Text>
                        </TouchableOpacity>
                    )
                )}

                {/* Reply preview bar */}
                {replyTo && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            backgroundColor: "#f0f4ff",
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderTopWidth: 1,
                            borderTopColor: "#e5e7eb",
                            gap: 10,
                        }}
                    >
                        <View
                            style={{
                                width: 3,
                                alignSelf: "stretch",
                                backgroundColor: "#1e3a6e",
                                borderRadius: 2,
                            }}
                        />
                        <View style={{ flex: 1 }}>
                            <Text
                                style={{ fontSize: 11, fontWeight: "700", color: "#1e3a6e", marginBottom: 1 }}
                            >
                                {replyTo.senderName}
                            </Text>
                            <Text
                                style={{ fontSize: 12, color: "#6b7280" }}
                                numberOfLines={1}
                            >
                                {replyTo.text}
                            </Text>
                        </View>
                        <TouchableOpacity onPress={() => setReplyTo(null)} style={{ padding: 4 }}>
                            <Ionicons name="close" size={18} color="#9ca3af" />
                        </TouchableOpacity>
                    </View>
                )}

                {/* Input bar — use a darkened gradient derived from the conversation gradient */}
                <LinearGradient
                    colors={inputBarColors()}
                    style={{
                        paddingHorizontal: 16,
                        paddingBottom: Platform.OS === "ios" ? 20 : 15,
                        paddingTop: 12,
                        borderTopWidth: 1,
                        borderTopColor: "rgba(255,255,255,0.1)",
                    }}
                >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                        {/* Attachment button */}
                        <TouchableOpacity
                            onPress={() => setMediaSheetVisible(true)}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                alignItems: "center",
                                justifyContent: "center",
                                backgroundColor: "white",
                            }}
                        >
                            <Ionicons name="add" size={22} color="black" />
                        </TouchableOpacity>

                        <TextInput
                            style={{
                                flex: 1,
                                backgroundColor: "white",
                                borderRadius: 22,
                                paddingHorizontal: 16,
                                paddingVertical: 10,
                                fontSize: 14,
                                color: "black",
                                maxHeight: 100,
                            }}
                            placeholder="Message..."
                            placeholderTextColor="black"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                            maxLength={1000}
                            returnKeyType="default"
                        />

                        <TouchableOpacity
                            onPress={handleSend}
                            disabled={sending || uploading || (!inputText.trim() && !pendingMedia)}
                            style={{
                                width: 38,
                                height: 38,
                                borderRadius: 19,
                                backgroundColor: inputText.trim() || pendingMedia ? "white" : "white",
                                alignItems: "center",
                                justifyContent: "center",
                            }}
                        >
                            {sending || uploading ? (
                                <ActivityIndicator size="small" color="dark" />
                            ) : (
                                <Ionicons name="send" size={17} color="dark" />
                            )}
                        </TouchableOpacity>
                    </View>
                </LinearGradient>

                {/* ── Modals ── */}
                <MessageActionSheet
                    visible={!!messageAction}
                    isOwn={messageAction?.isOwn ?? false}
                    onReply={() => {
                        if (!messageAction) return;
                        setReplyTo({
                            id: messageAction.messageId,
                            text: messageAction.messageText,
                            senderName: messageAction.senderName,
                        });
                        setMessageAction(null);
                    }}
                    onDelete={() => {
                        if (!messageAction) return;
                        handleDeleteMessage(messageAction.messageId);
                        setMessageAction(null);
                    }}
                    onClose={() => setMessageAction(null)}
                />
                <MediaPickerSheet
                    visible={mediaSheetVisible}
                    onClose={() => setMediaSheetVisible(false)}
                    onPick={(uri, type) => setPendingMedia({ uri, type })}
                    onPaymentRequest={() => setPaymentRequestSheetVisible(true)}
                />
                <PaymentRequestSheet
                    visible={paymentRequestSheetVisible}
                    onClose={() => setPaymentRequestSheetVisible(false)}
                    onSend={handleSendPaymentRequest}
                />
                <EmojiPicker
                    visible={pickerVisible}
                    onSelect={handleReaction}
                    onClose={() => { setPickerVisible(false); setSelectedMessageId(null); }}
                />
                <AddUserSheet
                    visible={addUserSheetVisible}
                    onClose={() => setAddUserSheetVisible(false)}
                    onAdd={handleAddUser}
                    existingParticipantIds={allParticipants.map((p) => p.userId || p.id || "")}
                    currentUserId={session?.uid ?? ""}
                    addingUserId={addingUserId}
                />
                {expandedImage && (
                    <ImageViewer uri={expandedImage} onClose={() => setExpandedImage(null)} />
                )}

                {/* Budget setup / top-up sheet */}
                {isPricedChat && (
                    <BudgetSetupSheet
                        visible={budgetSetupVisible}
                        onClose={() => setBudgetSetupVisible(false)}
                        onTopUp={handleBudgetTopUp}
                        recipientName={headerTitle}
                        recipientPricing={recipientPricing as { messagePrice: number; walletAddress: string }}
                        currentBudget={senderBudget}
                    />
                )}

                {/* Wallet picker for request/pay-now flows */}
                <WalletPickerModal
                    visible={showWalletPicker}
                    onClose={() => setShowWalletPicker(false)}
                    onConnect={(w) => {
                        if (w === "phantom") phantomForChat.connect();
                        else if (w === "backpack") backpackForChat.connect();
                        else solflareForChat.connect();
                    }}
                />

                {/* Edit Chat modal — allows changing title and background gradient */}
                <Modal visible={editModalVisible} transparent animationType="slide" onRequestClose={() => setEditModalVisible(false)}>
                    <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' }} onPress={() => setEditModalVisible(false)}>
                        <Pressable onPress={() => {}} style={{ backgroundColor: 'white', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingBottom: 36 }}>
                            <View style={{ width: 40, height: 4, backgroundColor: '#e5e7eb', borderRadius: 2, alignSelf: 'center', marginTop: 12, marginBottom: 14 }} />
                            <Text style={{ fontSize: 18, fontWeight: '700', color: '#1f2937', marginBottom: 6 }}>Edit Chat</Text>
                            <Text style={{ fontSize: 13, color: '#6b7280', marginBottom: 12 }}>Change the chat name and background style</Text>

                            <TextInput
                                value={editingTitle}
                                onChangeText={setEditingTitle}
                                placeholder="Chat name"
                                placeholderTextColor="#9ca3af"
                                maxLength={50}
                                style={{ backgroundColor: '#f3f4f6', paddingHorizontal: 12, paddingVertical: 10, borderRadius: 10, marginBottom: 12 }}
                            />

                            <Text style={{ fontSize: 13, fontWeight: '700', color: '#374151', marginBottom: 8 }}>Background</Text>
                            <FlatList
                                data={gradients}
                                horizontal
                                showsHorizontalScrollIndicator={false}
                                keyExtractor={(g) => g.name}
                                renderItem={({ item }) => {
                                    const isSelected = item.name === selectedGradientName;
                                    return (
                                        <TouchableOpacity
                                            onPress={() => setSelectedGradientName(item.name)}
                                            style={{ marginRight: 12 }}
                                        >
                                            <LinearGradient colors={item.colors} style={{ width: 78, height: 50, borderRadius: 10, borderWidth: isSelected ? 3 : 0, borderColor: isSelected ? '#1e3a6e' : 'transparent', overflow: 'hidden', justifyContent: 'flex-end' }}>
                                                <Text style={{ fontSize: 11, color: 'white', backgroundColor: 'rgba(0,0,0,0.18)', paddingHorizontal: 6, paddingVertical: 4, borderBottomLeftRadius: 10, borderBottomRightRadius: 10 }}>{item.name}</Text>
                                            </LinearGradient>
                                        </TouchableOpacity>
                                    );
                                }}
                            />

                            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 18 }}>
                                <TouchableOpacity onPress={() => { setEditModalVisible(false); setEditingTitle(''); setSelectedGradientName(null); }} style={{ paddingVertical: 12, paddingHorizontal: 18 }}>
                                    <Text style={{ color: '#9ca3af', fontSize: 15 }}>Cancel</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={handleSaveTitle} style={{ backgroundColor: '#1e3a6e', paddingVertical: 12, paddingHorizontal: 18, borderRadius: 12 }}>
                                    <Text style={{ color: 'white', fontWeight: '700' }}>Save</Text>
                                </TouchableOpacity>
                            </View>
                        </Pressable>
                    </Pressable>
                </Modal>

            </LinearGradient>
        </KeyboardAvoidingView>
    );
}

