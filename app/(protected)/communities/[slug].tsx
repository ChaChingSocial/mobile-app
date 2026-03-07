import { Community } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import { Box } from "@/components/ui/box";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import {
  getSingleCommunityBySlug,
  addCommunityPaidContribution,
  getCommunityContributors,
  CommunityContributor,
} from "@/lib/api/communities";
import { getPostsByNewsfeedIdPaged } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { usePostStore } from "@/lib/store/post";
import { stripHtml } from "@/lib/utils/stripHtml";
import { Post } from "@/types/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  View,
  RefreshControl,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  Alert,
  Modal as RNModal,
  Switch,
  TextInput,
  KeyboardAvoidingView,
  Linking,
} from "react-native";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Entypo,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import {Colors} from "@/lib/constants/Colors";
import {
    useBackpackDeeplinkWalletConnector,
    useDeeplinkWalletConnector,
} from "@privy-io/expo/connectors";
import { usePhantomClusterConnector } from "@/lib/wallet/usePhantomClusterConnector";
import {
    Connection,
    PublicKey,
    SystemProgram,
    Transaction,
    TransactionInstruction,
    clusterApiUrl,
    SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Buffer } from "buffer";

const FALLBACK_COMMUNITY_FUND_WALLET =
    "Dn5eBy45nbnV6LndYbn3ZXXE34UGAu2ZJAP4yF61XD7x";
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

type FundingValidationResult = {
  isValid: boolean;
  message: string;
};

// USDC has 6 decimal places, SOL has 9
const FUNDING_AMOUNT_PATTERNS: Record<"SOL" | "USDC", RegExp> = {
  USDC: /^(\d+(\.\d{1,6})?|\.\d{1,6})$/,
  SOL:  /^(\d+(\.\d{1,9})?|\.\d{1,9})$/,
};
const FUNDING_MAX_DECIMALS: Record<"SOL" | "USDC", number> = {
  USDC: 6,
  SOL: 9,
};

const validateFundingAmount = (
  rawAmount: string,
  asset: "SOL" | "USDC"
): FundingValidationResult => {
  const normalized = rawAmount.trim();
  if (!normalized) {
    return {
      isValid: false,
      message: `Enter an amount before funding ${asset}.`,
    };
  }

  if (!FUNDING_AMOUNT_PATTERNS[asset].test(normalized)) {
    return {
      isValid: false,
      message: `Invalid amount. Use up to ${FUNDING_MAX_DECIMALS[asset]} decimal places for ${asset} (e.g. 0.01 or 0.001).`,
    };
  }

  const numericAmount = Number(normalized);
  if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
    return {
      isValid: false,
      message: `Amount must be greater than 0 to fund with ${asset}.`,
    };
  }

  return { isValid: true, message: "" };
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
            { pubkey: SYSVAR_RENT_PUBKEY, isSigner: false, isWritable: false },
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

export default function SingleCommunity() {
  const params = useLocalSearchParams();
  const { slug, communityId } = params;
  const { session } = useSession();
  const router = useRouter();
  const PAGE_SIZE = 3;
  const walletConnectorAppUrl =
    process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL || "https://chachingsocial.io";
  const phantomWalletConnector = usePhantomClusterConnector({
    appUrl: walletConnectorAppUrl,
    redirectUri: "/",
  });
  const backpackWalletConnector = useBackpackDeeplinkWalletConnector({
    appUrl: walletConnectorAppUrl,
    redirectUri: "/",
  });
  const solflareWalletConnector = useDeeplinkWalletConnector({
    appUrl: walletConnectorAppUrl,
    baseUrl: "https://solflare.com",
    encryptionPublicKeyName: "solflare_encryption_public_key",
    redirectUri: "/",
  });

  // FAB state/animation copied from HomePage for consistency
  const [showOptions, setShowOptions] = useState(false);
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === "ios" ? insets.bottom + 16 : 28;

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(rotationAnim, {
        toValue: showOptions ? 1 : 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: showOptions ? 0 : 1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: showOptions ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(animations).start();
  }, [showOptions]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // const routes = navigate.getState()?.routes;
  // const prevRoute = routes[routes.length - 2];

  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showConnectWalletPrompt, setShowConnectWalletPrompt] = useState(false);
  const [showFundModal, setShowFundModal] = useState(false);
  const [fundingAsset, setFundingAsset] = useState<"SOL" | "USDC">("SOL");
  const [fundAmount, setFundAmount] = useState("");
  const [useDevnet, setUseDevnet] = useState(false);
  const [isFunding, setIsFunding] = useState(false);
  const [showFundingValidationPopup, setShowFundingValidationPopup] =
    useState(false);
  const [fundingValidationMessage, setFundingValidationMessage] = useState("");
  const [showDevnetNoticePopup, setShowDevnetNoticePopup] = useState(false);
  const [contributors, setContributors] = useState<CommunityContributor[]>([]);
  const fundingValidation = validateFundingAmount(fundAmount, fundingAsset);
  const canSubmitFunding = fundingValidation.isValid && !isFunding;

  // Post store setters for preselecting/locking community and passing media
  const setCreatedPostImage = usePostStore((state) => state.setCreatedPostImage);
  const setCreatedPostVideo = usePostStore((state) => state.setCreatedPostVideo);
  const setCreatedPostCommunityData = usePostStore(
    (state) => state.setCreatedPostCommunityData
  );
  const setCreatedPostCommunityId = usePostStore(
    (state) => state.setCreatedPostCommunityId
  );
  const setLockCommunitySelection = usePostStore(
    (state) => state.setLockCommunitySelection
  );

  const fetchMore = async () => {
    if (!communityId || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    const { posts: more, lastDoc: next } = await getPostsByNewsfeedIdPaged(
      Array.isArray(communityId) ? communityId[0] : (communityId as string),
      lastDoc,
      PAGE_SIZE
    );
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const deduped = [...prev, ...more.filter((p) => !seen.has(p.id))];
      return deduped;
    });
    setLastDoc(next);
    setLoadingMore(false);
  };

  const onScrollNearBottom = (e: any) => {
    try {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
      if (!layoutMeasurement || !contentOffset || !contentSize) return;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < 200 && !loadingMore && lastDoc) {
        fetchMore();
      }
    } catch {}
  };

  const fetchCommunityData = async () => {
    try {
      // const res = await communityApi.communityBySlugName({
      //   slugName: Array.isArray(slug) ? slug[0] : slug,
      // });
      const res = await getSingleCommunityBySlug(
        Array.isArray(slug) ? slug[0] : slug
      );
      // console.log("slug comm", res[0]);

      if (res) {
        setCommunityData(res);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  useEffect(() => {
    if (!communityId) {
      console.error("No communityId provided in params");
      return;
    }

    fetchCommunityData();

    const cid = Array.isArray(communityId) ? communityId[0] : (communityId as string);

    // Initial page of posts
    setInitialLoading(true);
    getPostsByNewsfeedIdPaged(cid, null, PAGE_SIZE)
      .then(({ posts: first, lastDoc: ld }) => {
        setPosts(first);
        setLastDoc(ld);
      })
      .finally(() => setInitialLoading(false));

    // Load contributor avatars
    getCommunityContributors(cid).then(setContributors).catch(() => {});
  }, [communityId]);

  if (!communityData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Center className="flex-1">
          <Spinner color="green" size="large" />
          <Text size="md">Please Wait...</Text>
        </Center>
      </View>
    );
  }

  // const createdAt = communityData.createdAt
  //   ? format(new Date(communityData.createdAt), "MMM d, yyyy")
  //   : "Unknown date";

  const onRefresh = async () => {
    if (!communityId) return;
    setRefreshing(true);
    const { posts: fresh, lastDoc: ld } = await getPostsByNewsfeedIdPaged(
      Array.isArray(communityId) ? communityId[0] : (communityId as string),
      null,
      PAGE_SIZE
    );
    setPosts(fresh);
    setLastDoc(ld);
    setRefreshing(false);
  };

  // Helper: media permissions + pickers (same as HomePage)
  const requestMediaPermissions = async (mediaType: "photo" | "video") => {
    const [mediaLibraryStatus, imagePickerStatus] = await Promise.all([
      MediaLibrary.requestPermissionsAsync(),
      ImagePicker.requestMediaLibraryPermissionsAsync(),
    ]);

    if (
      mediaLibraryStatus.status !== "granted" ||
      imagePickerStatus.status !== "granted"
    ) {
      Alert.alert(
        "Permission required",
        `Sorry, we need access to your media library to select ${
          mediaType === "photo" ? "images" : "videos"
        }!`
      );
      return false;
    }
    return true;
  };

  const pickVideo = async () => {
    if (!(await requestMediaPermissions("video"))) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!result.canceled && result.assets) {
        const pickedVideo = result.assets[0];
        const video = {
          url: pickedVideo.uri,
          description: pickedVideo.fileName ?? "",
          title: pickedVideo.fileName ?? "Untitled Video",
          image: pickedVideo.uri,
          tags: [],
          publisher: session?.displayName || "Anonymous",
          publisherPicUrl: session?.profilePic || "",
        };
        setCreatedPostVideo(video as any);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const pickImage = async () => {
    if (!(await requestMediaPermissions("photo"))) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 10,
      });
      if (!result.canceled && result.assets) {
        const pictures = result.assets.map((asset, idx) => ({
          id: asset.assetId ?? `${idx}-${asset.fileName}`,
          url: asset.uri,
          description: asset.fileName ?? "",
          createdAt: new Date(),
          modifiedAt: new Date(),
        }));
        if (pictures.length > 0) {
          setCreatedPostImage(pictures as any);
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const postOptions = [
    {
      title: "Article",
      icon: <FontAwesome5 name="newspaper" size={18} color="white" />,
      route: "/(protected)/create-post/new-article-post" as const,
    },
    {
      title: "Video Link",
      icon: <FontAwesome5 name="video" size={18} color="white" />,
      route: "/(protected)/create-post/new-link-post" as const,
    },
    {
      title: "Images",
      icon: <Entypo name="image" size={20} color="white" />,
      route: "/(protected)/create-post/new-image-post" as const,
    },
    {
      title: "Podcast",
      icon: <FontAwesome5 name="spotify" size={18} color="white" />,
      route: "/(protected)/create-post/new-podcast-post" as const,
    },
    // Event option intentionally commented out to match HomePage
  ];

  const selectedCommunityId = Array.isArray(communityId)
    ? (communityId[0] as string)
    : (communityId as string);

  const prepareCommunitySelection = () => {
    if (communityData?.id) {
      setCreatedPostCommunityData(communityData);
    }
    if (selectedCommunityId) setCreatedPostCommunityId(selectedCommunityId);
    setLockCommunitySelection(true);
  };

  const handleOptionPress = async (
    route:
      | "/(protected)/create-post/new-article-post"
      | "/(protected)/create-post/new-link-post"
      | "/(protected)/create-post/new-image-post"
      | "/(protected)/create-post/new-podcast-post"
      | "/(protected)/create-post/new-event-post"
  ) => {
    setShowOptions(false);
    prepareCommunitySelection();

    if (route === "/(protected)/create-post/new-image-post") {
      await pickImage();
    } else if (route === "/(protected)/create-post/new-link-post") {
      await pickVideo();
    }

    router.push(route);
  };

  const connectedWallet =
    phantomWalletConnector.isConnected && phantomWalletConnector.address
      ? {
          name: "Phantom",
          address: phantomWalletConnector.address,
          connector: phantomWalletConnector,
        }
      : backpackWalletConnector.isConnected && backpackWalletConnector.address
        ? {
            name: "Backpack",
            address: backpackWalletConnector.address,
            connector: backpackWalletConnector,
          }
        : solflareWalletConnector.isConnected && solflareWalletConnector.address
          ? {
              name: "Solflare",
              address: solflareWalletConnector.address,
              connector: solflareWalletConnector,
            }
          : null;

  const resolveCommunityFundingDestination = () => {
    const destination = communityData.communityFundingDestination?.trim();
    if (destination) {
      try {
        new PublicKey(destination);
        return destination;
      } catch {}
    }
    return FALLBACK_COMMUNITY_FUND_WALLET;
  };

  const handleFundCommunityPress = () => {
    if (!connectedWallet) {
      setShowConnectWalletPrompt(true);
      return;
    }
    setShowFundModal(true);
  };

  const openFundingValidationPopup = (message: string) => {
    setFundingValidationMessage(message);
    setShowFundingValidationPopup(true);
  };

  const handleFundAmountEndEditing = (e: { nativeEvent: { text: string } }) => {
    const text = e.nativeEvent.text.trim();
    if (!text) return;
    const validation = validateFundingAmount(text, fundingAsset);
    if (!validation.isValid) {
      openFundingValidationPopup(validation.message);
    }
  };

  const handleDevnetToggle = (nextValue: boolean) => {
    setUseDevnet(nextValue);
    if (nextValue) {
      setShowDevnetNoticePopup(true);
    }
  };

  const submitFunding = async () => {
    if (!connectedWallet) {
      setShowFundModal(false);
      setShowConnectWalletPrompt(true);
      return;
    }
    if (!fundingValidation.isValid) {
      openFundingValidationPopup(fundingValidation.message);
      return;
    }

    const decimals = fundingAsset === "SOL" ? 9 : 6;
    const amountInBaseUnits = parseAmountToUnits(fundAmount.trim(), decimals);
    if (!amountInBaseUnits || amountInBaseUnits <= 0n) {
      openFundingValidationPopup(
        `Could not parse this ${fundingAsset} amount. Use x.xx or .xx and try again.`
      );
      return;
    }

    if (
      fundingAsset === "SOL" &&
      amountInBaseUnits > BigInt(Number.MAX_SAFE_INTEGER)
    ) {
      Alert.alert("Amount too large", "Please enter a smaller SOL amount.");
      return;
    }

    const destinationAddress = resolveCommunityFundingDestination();
    const targetCluster = useDevnet ? "devnet" : "mainnet-beta";
    const connection = new Connection(
      clusterApiUrl(targetCluster),
      "confirmed"
    );
    const senderPublicKey = new PublicKey(connectedWallet.address);
    const destinationPublicKey = new PublicKey(destinationAddress);

    try {
      setIsFunding(true);
      if (
        connectedWallet.name === "Phantom" &&
        phantomWalletConnector.sessionCluster !== targetCluster
      ) {
        await phantomWalletConnector.connect(targetCluster);
      }
      const tx = new Transaction();
      const latestBlockhash = await connection.getLatestBlockhash("confirmed");

      if (fundingAsset === "SOL") {
        tx.add(
          SystemProgram.transfer({
            fromPubkey: senderPublicKey,
            toPubkey: destinationPublicKey,
            lamports: Number(amountInBaseUnits),
          })
        );
      } else {
        const usdcMint = new PublicKey(
          useDevnet ? USDC_DEVNET_MINT : USDC_MAINNET_MINT
        );
        const senderTokenAddress = findAssociatedTokenAddress(
          senderPublicKey,
          usdcMint
        );
        const destinationTokenAddress = findAssociatedTokenAddress(
          destinationPublicKey,
          usdcMint
        );

        const senderTokenInfo = await connection.getAccountInfo(
          senderTokenAddress
        );
        if (!senderTokenInfo) {
          Alert.alert(
            "USDC account not found",
            "Your connected wallet does not have a USDC token account on this network."
          );
          return;
        }

        const destinationTokenInfo = await connection.getAccountInfo(
          destinationTokenAddress
        );
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
            amountInBaseUnits,
            6
          )
        );
      }

      tx.feePayer = senderPublicKey;
      tx.recentBlockhash = latestBlockhash.blockhash;
      const signResponse = await connectedWallet.connector.signTransaction(tx);
      const signedTransactionBytes =
        extractSignedTransactionBytes(signResponse);
      if (!signedTransactionBytes) {
        throw new Error(
          "Wallet returned an unsupported signed transaction payload"
        );
      }

      const signature = await connection.sendRawTransaction(
        signedTransactionBytes,
        {
          preflightCommitment: "confirmed",
          skipPreflight: false,
          maxRetries: 3,
        }
      );

      await waitForSignatureConfirmation(connection, signature);

      // Capture values before clearing state
      const donatedAmount = Number(fundAmount.trim()) || 0;
      const donatedAsset = fundingAsset;
      const donatedNetwork = useDevnet ? "devnet" : "mainnet-beta";

      setShowFundModal(false);
      setFundAmount("");

      // Persist the contribution (best-effort — don't block the success alert)
      const cid = Array.isArray(communityId)
        ? communityId[0]
        : (communityId as string);
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
        .then(() => getCommunityContributors(cid))
        .then(setContributors)
        .catch((err) =>
          console.warn("Failed to persist contribution:", err)
        );

      const solscanUrl = `https://solscan.io/tx/${signature}${
        donatedNetwork === "devnet" ? "?cluster=devnet" : ""
      }`;
      Alert.alert(
        "Funding submitted ✅",
        `${donatedAsset} was sent to this community wallet.`,
        [
          {
            text: "View on Solscan",
            onPress: () => Linking.openURL(solscanUrl).catch(() => {}),
          },
          { text: "Close", style: "cancel" },
        ]
      );
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
    } finally {
      setIsFunding(false);
    }
  };

  return (
    <Box className="flex-1 relative">
      {/* Content */}
      <ScrollView
        className="flex-1"
        style={{backgroundColor: communityData.themeDarkColor || Colors.dark.tint}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={onScrollNearBottom}
        scrollEventThrottle={32}
      >
        {communityData.image && (
          <View className="w-full h-60 overflow-hidden">
            <Image
              source={{ uri: communityData.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )}
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold flex-1 mr-2 text-white">
              {communityData.title}
            </Text>
          </View>
          {communityData.featured && (
            <View className="bg-amber-400 self-start px-2 py-1 rounded-full mb-3">
              <Text className="text-green-900 text-xs font-medium">
                Featured Community
              </Text>
            </View>
          )}
          <Text className="text-gray-500 text-sm mb-4"></Text>
          <View className="mb-6">
            <Text className="text-base text-white" numberOfLines={isExpanded ? undefined : 3}>
              {stripHtml(communityData?.description ?? "")}
            </Text>
            <Text
              className="text-white mt-2 underline"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </Text>
          </View>

          {communityData.interests && communityData.interests.length > 0 && (
            <View className="mb-6">
              <View className="flex-row flex-wrap">
                {communityData.interests.map((interest, index) => (
                  <View
                    key={index}
                    className="px-3 py-1 rounded-full mr-2 mb-2"
                    style={{ backgroundColor: communityData.themeLightColor || Colors.light.tint }}
                  >
                    <Text
                        style={{ color: communityData.themeDarkColor || Colors.dark.tint }}
                    >
                        {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* ── Contributor avatars ── */}
          {contributors.length > 0 && (
            <View className="mb-4">
              <Text className="text-white text-xs font-semibold mb-2 uppercase tracking-wide">
                {contributors.length === 1
                  ? "1 Supporter"
                  : `${contributors.length} Supporters`}
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 10 }}
              >
                {contributors.map((c) => (
                  <View key={c.userId} className="items-center" style={{ width: 52 }}>
                    {c.profilePic ? (
                      <Image
                        source={{ uri: c.profilePic }}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: "rgba(255,255,255,0.6)",
                        }}
                        resizeMode="cover"
                      />
                    ) : (
                      <View
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 20,
                          borderWidth: 2,
                          borderColor: "rgba(255,255,255,0.6)",
                          backgroundColor: "rgba(255,255,255,0.2)",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <Text
                          style={{ color: "white", fontWeight: "700", fontSize: 14 }}
                        >
                          {(c.displayName ?? "?").charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <Text
                      className="text-white text-xs mt-1 text-center"
                      numberOfLines={1}
                      style={{ width: 52 }}
                    >
                      {c.displayName.length > 7
                        ? `${c.displayName.slice(0, 7)}…`
                        : c.displayName}
                    </Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          <View className="mb-2">
            <TouchableOpacity
              className="w-full rounded-xl py-3 px-4"
              style={{backgroundColor: communityData.themeLightColor || Colors.light.tint}}
              activeOpacity={0.85}
              onPress={handleFundCommunityPress}
            >
              <Text className="text-base font-semibold text-center"
              style={{ color: communityData.themeDarkColor || Colors.dark.tint }}>
                Fund Community
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        <NewsfeedList
          posts={posts}
          communityPage={true}
          isUserCommunityAdmin={session?.uid === communityData.adminUserId}
        />
        {(initialLoading || loadingMore) && (
          <Image
            source={require("@/assets/images/logo-inverted.png")}
            alt="Loading..."
            resizeMode="contain"
            className="w-full"
          />
        )}
        <View style={{ height: 24 }} />
      </ScrollView>
      <RNModal
        animationType="fade"
        transparent
        visible={showConnectWalletPrompt}
        onRequestClose={() => setShowConnectWalletPrompt(false)}
      >
        <View className="flex-1 bg-black/40 px-6 items-center justify-center">
          <View className="w-full bg-white rounded-2xl p-5">
            <Text className="text-[#1e3a6e] text-lg font-bold mb-2">
              Connect a wallet first
            </Text>
            <Text className="text-gray-700 text-sm mb-5">
              Please connect a crypto wallet in the Profile tab before funding a
              community.
            </Text>
            <TouchableOpacity
              className="bg-[#1e3a6e] rounded-xl py-3"
              activeOpacity={0.85}
              onPress={() => setShowConnectWalletPrompt(false)}
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>

      <RNModal
        animationType="slide"
        transparent
        visible={showFundModal}
        onRequestClose={() => !isFunding && setShowFundModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={{ flex: 1 }}
        >
          <View className="flex-1 justify-end bg-black/40">
            <TouchableOpacity
              className="flex-1"
              activeOpacity={1}
              onPress={() => !isFunding && setShowFundModal(false)}
            />
            <View className="bg-white rounded-t-3xl px-4 pt-4 pb-6">
            <Text className="text-[#1e3a6e] text-xl font-bold">
              Fund Community
            </Text>
            <Text className="text-gray-600 text-sm mt-1 mb-4">
              Choose token, network, and amount.
            </Text>

            <Text className="text-gray-800 font-semibold mb-2">Token</Text>
            <View className="flex-row gap-2 mb-4">
              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 border ${
                  fundingAsset === "SOL"
                    ? "bg-[#1e3a6e] border-[#1e3a6e]"
                    : "bg-white border-[#d1d5db]"
                }`}
                activeOpacity={0.85}
                onPress={() => setFundingAsset("SOL")}
                disabled={isFunding}
              >
                <Text
                  className={`text-center font-semibold ${
                    fundingAsset === "SOL" ? "text-white" : "text-[#1e3a6e]"
                  }`}
                >
                  SOL
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`flex-1 rounded-xl py-3 border ${
                  fundingAsset === "USDC"
                    ? "bg-[#1e3a6e] border-[#1e3a6e]"
                    : "bg-white border-[#d1d5db]"
                }`}
                activeOpacity={0.85}
                onPress={() => setFundingAsset("USDC")}
                disabled={isFunding}
              >
                <Text
                  className={`text-center font-semibold ${
                    fundingAsset === "USDC" ? "text-white" : "text-[#1e3a6e]"
                  }`}
                >
                  USDC
                </Text>
              </TouchableOpacity>
            </View>

            <Text className="text-gray-800 font-semibold mb-2">Amount</Text>
            <TextInput
              value={fundAmount}
              onChangeText={setFundAmount}
              onEndEditing={handleFundAmountEndEditing}
              keyboardType="decimal-pad"
              placeholder={`Enter ${fundingAsset} amount`}
              placeholderTextColor="#9ca3af"
              editable={!isFunding}
              className="border border-[#d1d5db] rounded-xl px-3 py-3 text-gray-900 mb-4"
            />
            <Text className="text-gray-500 text-xs mb-4">
              {fundingAsset === "USDC"
                ? "Up to 6 decimal places (e.g. 0.01, 0.001)."
                : "Up to 9 decimal places (e.g. 0.01, 0.001)."}
            </Text>

            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-gray-800 font-semibold">Use devnet</Text>
              <Switch
                value={useDevnet}
                onValueChange={handleDevnetToggle}
                disabled={isFunding}
              />
            </View>
            <Text className="text-gray-500 text-xs mb-4">
              Network: {useDevnet ? "Devnet" : "Mainnet-beta"}
            </Text>

            <Text className="text-gray-500 text-xs mb-5">
              Recipient: {resolveCommunityFundingDestination()}
            </Text>

              <View className="flex-row gap-2">
                <TouchableOpacity
                  className="flex-1 rounded-xl py-3 bg-gray-100"
                  activeOpacity={0.85}
                  onPress={() => setShowFundModal(false)}
                  disabled={isFunding}
                >
                  <Text className="text-center text-gray-700 font-semibold">
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  className={`flex-1 rounded-xl py-3 ${
                    canSubmitFunding ? "bg-[#1e3a6e]" : "bg-[#9ca3af]"
                  }`}
                  activeOpacity={0.85}
                  onPress={submitFunding}
                  disabled={!canSubmitFunding}
                >
                  <Text className="text-center text-white font-semibold">
                    {isFunding ? "Submitting..." : "Fund"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </RNModal>

      <RNModal
        animationType="fade"
        transparent
        visible={showFundingValidationPopup}
        onRequestClose={() => setShowFundingValidationPopup(false)}
      >
        <View className="flex-1 bg-black/40 px-6 items-center justify-center">
          <View className="w-full bg-white rounded-2xl p-5">
            <Text className="text-[#1e3a6e] text-lg font-bold mb-2">
              Fix funding amount
            </Text>
            <Text className="text-gray-700 text-sm mb-5">
              {fundingValidationMessage}
            </Text>
            <TouchableOpacity
              className="bg-[#1e3a6e] rounded-xl py-3"
              activeOpacity={0.85}
              onPress={() => setShowFundingValidationPopup(false)}
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>

      <RNModal
        animationType="fade"
        transparent
        visible={showDevnetNoticePopup}
        onRequestClose={() => setShowDevnetNoticePopup(false)}
      >
        <View className="flex-1 bg-black/40 px-6 items-center justify-center">
          <View className="w-full bg-white rounded-2xl p-5">
            <Text className="text-[#1e3a6e] text-lg font-bold mb-2">
              Devnet reminder
            </Text>
            <Text className="text-gray-700 text-sm mb-5">
              Ensure your crypto wallet (for example Phantom) is set and connected
              to Devnet before submitting to ensure a smooth transaction.
            </Text>
            <TouchableOpacity
              className="bg-[#1e3a6e] rounded-xl py-3"
              activeOpacity={0.85}
              onPress={() => setShowDevnetNoticePopup(false)}
            >
              <Text className="text-white text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </RNModal>

      {/* Floating Action Button (same as HomePage) */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: fabBottom,
          right: 12,
          zIndex: 50,
          transform: [{ rotate: rotation }, { scale }],
          opacity: scaleAnim,
        }}
      >
        <TouchableOpacity
          className="p-3 h-16 w-16 bg-secondary-0 shadow-2xl rounded-full items-center justify-center"
          onPress={() => setShowOptions(true)}
        >
          <AddIcon color="white" className="p-5 w-2 h-2" />
        </TouchableOpacity>
      </Animated.View>

      {/* Post Options Modal */}
      <Modal isOpen={showOptions} onClose={() => setShowOptions(false)}>
        <ModalBackdrop style={{ backgroundColor: "black" }} />
        <ModalContent className="w-fit absolute bg-transparent -right-4 bottom-10 border-0">
          <ModalBody className="p-0">
            <VStack className="space-y-2 mr-2">
              {postOptions.map((option, index) => (
                <Box key={index} className="flex-row-reverse items-center pl-2 py-2">
                  <TouchableOpacity onPress={() => handleOptionPress(option.route)}>
                    <View className="w-12 h-12 bg-blue-500 rounded-full justify-center items-center ml-2">
                      {option.icon}
                    </View>
                  </TouchableOpacity>
                  <Text size="sm" className="text-white font-medium">
                    {option.title}
                  </Text>
                </Box>
              ))}
            </VStack>

            <Animated.View style={{ opacity: opacityAnim }}>
              <TouchableOpacity
                className="flex-row-reverse items-center rounded-full pl-2 py-2 mr-1"
                onPress={() => {
                  setShowOptions(false);
                  prepareCommunitySelection();
                  router.push("/(protected)/create-post");
                }}
              >
                <View className="h-16 w-16 bg-secondary-0 rounded-full justify-center items-center ml-2">
                  <MaterialCommunityIcons name="feather" size={24} color="white" />
                </View>
                <Text size="md" className="text-white font-semibold">
                  Create a Post
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
