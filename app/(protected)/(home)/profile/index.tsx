import { User } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import { LinkTree } from "@/components/profile/LinkTree";
import FollowersModal from "@/components/profile/FollowersModal";
import FriendMeModal from "@/components/profile/FriendMeModal";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { scoreApi, userApi, communityApi } from "@/config/backend";
import { getPostsByUser } from "@/lib/api/newsfeed";
import { getUserAllCommunityContributions } from "@/lib/api/communities";
import {
  checkIfFinFluencer,
  fetchFollowers,
  fetchFollowing,
  isFollowing,
  followUser,
  unfollowUser,
  getUserMessagePricing,
  getUserProfile,
  setMessagePricing,
  saveWalletAddress,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { useScoreStore } from "@/lib/store/score";
import { useUserStore } from "@/lib/store/user";
import type { Post } from "@/types/post";
import {
    useBackpackDeeplinkWalletConnector,
    useDeeplinkWalletConnector,
} from "@privy-io/expo/connectors";
import { usePhantomClusterConnector } from "@/lib/wallet/usePhantomClusterConnector";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { DocumentSnapshot } from "firebase/firestore";
import { getDownloadURL, getStorage, ref as storageRef } from "firebase/storage";
import { resolveLocalBgImage } from "@/lib/constants/bgImages";
import { ImageSourcePropType } from "react-native";
import React, { useEffect, useState, useCallback } from "react";
import {
  Alert,
  Image,
  Modal,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import {Colors} from "@/lib/constants/Colors";
import BackgroundImageModal from "@/components/profile/BackgroundImageModal";
import EarningsTab from "@/components/profile/EarningsTab";
import NftDetailModal from "@/components/profile/NftDetailModal";
import { Connection, PublicKey, clusterApiUrl } from "@solana/web3.js";
import { fetchNftMetadata, NftMetadata } from "@/lib/wallet/fetchNftMetadata";

// ── Collapsible section row ──────────────────────────────────────────────────
function CollapsibleSection({
  title,
  children,
}: {
  title: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  return (
    <View>
      <TouchableOpacity
        className="flex-row justify-between items-center px-4 py-4"
        onPress={() => setOpen((v) => !v)}
        activeOpacity={0.7}
      >
        <Text className="text-gray-800 font-semibold text-base">{title}</Text>
        <Ionicons
          name={open ? "chevron-up" : "chevron-down"}
          size={20}
          color="#9ca3af"
        />
      </TouchableOpacity>
      {open && children}
      <View className="h-px bg-gray-100 mx-4" />
    </View>
  );
}

type WalletNftPreview = {
  mint: string;
  name?: string;
  imageUri?: string;
  cluster?: "mainnet-beta" | "devnet";
};

const SOLANA_TOKEN_PROGRAM_ID = new PublicKey(
  "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA"
);
const SOLANA_TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);

const extractNftMints = (accounts: any[]) => {
  const mints = new Set<string>();

  for (const account of accounts) {
    const info = account?.account?.data?.parsed?.info;
    const tokenAmount = info?.tokenAmount;
    const mint = info?.mint;

    if (!mint || typeof mint !== "string") continue;

    const decimals = Number(tokenAmount?.decimals ?? -1);
    if (decimals !== 0) continue;

    // Primary check: raw amount string (standard SPL token accounts)
    const rawAmount = String(tokenAmount?.amount ?? "");
    if (rawAmount === "1") {
      mints.add(mint);
      continue;
    }

    // Fallback: uiAmount / uiAmountString (Token-2022 accounts with certain
    // extensions may omit the raw `amount` field in the parsed response)
    const uiAmount = tokenAmount?.uiAmount ?? Number(tokenAmount?.uiAmountString);
    if (uiAmount === 1) {
      mints.add(mint);
    }
  }

  return mints;
};

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Profile() {
  const { id: UserId } = useLocalSearchParams();
  const { session } = useSession();
  const router = useRouter();
  const currentUserId =
    (Array.isArray(UserId) ? UserId[0] : UserId) || session?.uid || "";

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [userFollowing, setUserFollowing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [showFriendMeModal, setShowFriendMeModal] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"posts" | "links" | "earnings">("posts");
  const [showWalletPicker, setShowWalletPicker] = useState(false);
  const [walletDisconnectedLocally, setWalletDisconnectedLocally] =
      useState(false);
  const [walletNfts, setWalletNfts] = useState<WalletNftPreview[]>([]);
  const [walletNftsLoading, setWalletNftsLoading] = useState(false);
  const [selectedNft, setSelectedNft] = useState<WalletNftPreview | null>(null);
  // The wallet address used for NFT display — own profile uses live connector,
  // other profiles use the address stored in their Firestore profile.
  const [profileWalletAddress, setProfileWalletAddress] = useState<string | null>(null);
  const isOwnProfile = currentUserId === session?.uid;

  // ── Message Pricing state ──────────────────────────────────────────────────
  const [messagePriceEnabled, setMessagePriceEnabled] = useState(false);
  const [messagePriceInput, setMessagePriceInput] = useState("0.10");
  const [savingMsgPrice, setSavingMsgPrice] = useState(false);
    const [bannerOverride, setBannerOverride] = useState<ImageSourcePropType | undefined>();
    const [firestoreBannerUri, setFirestoreBannerUri] = useState<ImageSourcePropType | undefined>();
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
  const setCurrentUserScore = useScoreStore(
    (state) => state.setCurrentUserScore
  );

  const communityMemberships = useUserStore((state) => state.userCommunities);
  const setCommunityMemberships = useUserStore((state) => state.setUserCommunities);
  const [communityContributions, setCommunityContributions] = useState<Record<string, { totalAmount: number; asset: string }>>({});

  // Filter communities by meeting type
  const digitalCommunities = communityMemberships.filter((c: any) => {
    const meetingType = String(c.meetingType ?? '').trim().toUpperCase();
    return meetingType === 'VIRTUAL';
  });

  const irlCommunities = communityMemberships.filter((c: any) => {
    const meetingType = String(c.meetingType ?? '').trim().toUpperCase();
    return meetingType === 'IRL';
  });

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchUserInfo = async () => {
    try {
      if (!currentUserId) return;
      // Fetch SDK user + Firestore profile in parallel so we get backgroundImage
      const [res, profile] = await Promise.all([
        userApi.getUserById({ userId: currentUserId }),
        getUserProfile(currentUserId),
      ]);
      setUserInfo(res);
      if (profile?.backgroundImage) {
        const raw = profile.backgroundImage as string;
        if (raw.startsWith("http")) {
          // Already a full Firebase Storage download URL
          setFirestoreBannerUri({ uri: raw });
        } else {
          // Check the local bundle first (e.g. "/bg-images/bg3.jpg")
          const local = resolveLocalBgImage(raw);
          if (local !== null) {
            setFirestoreBannerUri(local);
          } else {
            // Fall back to resolving via Firebase Storage
            try {
              const url = await getDownloadURL(storageRef(getStorage(), raw));
              setFirestoreBannerUri({ uri: url });
            } catch (e) {
              console.warn("Could not resolve banner path:", raw, e);
            }
          }
        }
      }
      // For other users' profiles, read their persisted wallet address so we
      // can display their NFTs without them needing a live wallet connection.
      if (currentUserId !== session?.uid && profile?.walletAddress) {
        setProfileWalletAddress(profile.walletAddress as string);
      }
      if (currentUserId === session?.uid) {
        const scoreRes = await scoreApi.getScore({ userId: currentUserId });
        setCurrentUserScore(scoreRes);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchCommunityMemberships = async () => {
    if (!currentUserId) return;
    try {
      const [response, contributions] = await Promise.all([
        communityApi.getUserCommunityMembership({ userId: currentUserId }),
        getUserAllCommunityContributions(currentUserId),
      ]);
      if (response) setCommunityMemberships(response);
      setCommunityContributions(contributions);
    } catch (error) {
      console.error('Failed to fetch community memberships:', error);
    }
  };

  const fetchFinfluencerStatus = async () => {
    if (currentUserId) {
      const res = await checkIfFinFluencer(currentUserId);
      setIsFinfluencer(res);
    }
  };

  const fetchFollowersAndFollowing = async () => {
    if (currentUserId) {
      const [followersRes, followingRes] = await Promise.all([
        fetchFollowers(currentUserId),
        fetchFollowing(currentUserId),
      ]);

      // Get the IDs of followers and following
      const followerIds = followersRes.docs.map(doc => doc.id);
      const followingIds = followingRes.docs.map(doc => doc.id);

      // Calculate mutual follows (people who follow each other)
      const mutualFollows = followerIds.filter(id => followingIds.includes(id));

      setFollowers(mutualFollows.length); // This is mutual friends count
    }
  };

  const fetchFollowStatus = async () => {
    if (session?.uid && currentUserId) {
      const following = await isFollowing(currentUserId, session.uid);
      setUserFollowing(following);
    }
  };

  // ── Follow / Unfollow ────────────────────────────────────────────────────
  const handleFollowToggle = async () => {
    if (!session?.uid || !currentUserId) return;
    setFollowLoading(true);
    try {
      if (userFollowing) {
        await unfollowUser(currentUserId, session.uid);
        setUserFollowing(false);
      } else {
        await followUser(currentUserId, session.uid);
        setUserFollowing(true);
      }
      // Recalculate mutual friends after the action
      await fetchFollowersAndFollowing();
    } catch (error) {
      console.error("Error toggling follow:", error);
    } finally {
      setFollowLoading(false);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUserInfo();
      fetchCommunityMemberships();
      (async () => {
        setLoading(true);
        const { posts: initial, lastDoc: initialLastDoc } =
          await getPostsByUser(currentUserId);
        const normalized = (initial as Post[]).map((p: any) => ({
          ...p,
          featured: true,
        }));
        setPosts(normalized as Post[]);
        setLastDoc(initialLastDoc);
        setLoading(false);
      })();
    }
  }, [currentUserId]);

  // Refreshes user info when returning to this screen
  useFocusEffect(
    useCallback(() => {
      if (currentUserId) fetchUserInfo();
      return () => {};
    }, [currentUserId, session?.displayName, session?.profilePic, session?.bio])
  );

  useEffect(() => {
    fetchFollowersAndFollowing();
    fetchFinfluencerStatus();
    fetchFollowStatus();
  }, [currentUserId]);

  // ── Pagination / scroll ──────────────────────────────────────────────────
  const fetchMorePosts = async () => {
    if (loading || !lastDoc || !currentUserId) return;
    setLoading(true);
    const { posts: more, lastDoc: newLastDoc } = await getPostsByUser(
      currentUserId,
      lastDoc
    );
    if ((more as Post[]).length === 0) {
      setLastDoc(null);
    } else {
      const normalized = (more as Post[]).map((p: any) => ({
        ...p,
        featured: true,
      }));
      setPosts((prev) => [...prev, ...normalized]);
      setLastDoc(newLastDoc);
    }
    setLoading(false);
  };

  const onRefresh = async () => {
    if (!currentUserId) return;
    setRefreshing(true);
    const { posts: fresh, lastDoc: freshLastDoc } =
      await getPostsByUser(currentUserId);
    const normalized = (fresh as Post[]).map((p: any) => ({
      ...p,
      featured: true,
    }));
    setPosts(normalized as Post[]);
    setLastDoc(freshLastDoc);
    setRefreshing(false);
  };

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { layoutMeasurement, contentSize, contentOffset } = e.nativeEvent;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - 200;
    if (isNearBottom) fetchMorePosts();
  };

  const connectWithWallet = async (
    wallet: "phantom" | "backpack" | "solflare"
  ) => {
    const connector =
      wallet === "phantom"
        ? phantomWalletConnector
        : wallet === "backpack"
          ? backpackWalletConnector
          : solflareWalletConnector;
    const walletName =
      wallet === "phantom"
        ? "Phantom"
        : wallet === "backpack"
          ? "Backpack"
          : "Solflare";

    setShowWalletPicker(false);
    try {
      await connector.connect();
      setWalletDisconnectedLocally(false);
    } catch (error) {
      console.error(`Error connecting ${walletName} wallet:`, error);
      Alert.alert(
        "Wallet connection failed",
        `Could not connect ${walletName}. Make sure the wallet app is installed and try again.`
      );
    }
  };

  const handleConnectWallet = () => {
    if (walletDisconnectedLocally) {
      setShowWalletPicker(true);
      return;
    }
    const activeWallet =
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

    if (!activeWallet) {
      setShowWalletPicker(true);
      return;
    }

    Alert.alert(
      "Disconnect wallet?",
      `Disconnect ${activeWallet.name} (${activeWallet.address.slice(0, 4)}...${activeWallet.address.slice(-4)}) from your profile?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Disconnect",
          style: "destructive",
          onPress: async () => {
            setWalletDisconnectedLocally(true);
            try {
              await activeWallet.connector.disconnect();
            } catch (error) {
              const errorMessage =
                error instanceof Error ? error.message : String(error);
              const normalized = errorMessage.toLowerCase();
              if (
                normalized.includes("not been authorized") ||
                normalized.includes("timed out")
              ) {
                return;
              }
              console.error("Error disconnecting wallet:", error);
              Alert.alert(
                "Disconnect failed",
                "Could not disconnect wallet. Please try again."
              );
            }
          },
        },
      ]
    );
  };

  // ── Message Pricing ───────────────────────────────────────────────────────
  // Load the user's existing pricing settings when viewing own profile
  useEffect(() => {
    if (!session?.uid || currentUserId !== session.uid) return;
    getUserMessagePricing(session.uid).then((pricing) => {
      if (pricing && pricing.messagePrice > 0) {
        setMessagePriceEnabled(true);
        setMessagePriceInput(String(pricing.messagePrice));
      }
    });
  }, [session?.uid, currentUserId]);

  const handleSaveMessagePricing = async () => {
    if (!session?.uid) return;
    if (!connectedWallet?.address) {
      Alert.alert(
        "Wallet required",
        "Connect a wallet first so people know where to send USDC payments."
      );
      return;
    }
    const price = messagePriceEnabled ? parseFloat(messagePriceInput) : 0;
    if (messagePriceEnabled && (isNaN(price) || price <= 0)) {
      Alert.alert("Invalid price", "Enter a valid USDC amount (e.g. 0.10).");
      return;
    }
    setSavingMsgPrice(true);
    try {
      await setMessagePricing(session.uid, price, connectedWallet.address);
      Alert.alert(
        "Saved",
        messagePriceEnabled
          ? `Message pricing set to $${price.toFixed(2)} USDC per message. Your connected wallet will receive payments.`
          : "Message pricing disabled. Anyone can message you for free."
      );
    } catch {
      Alert.alert("Error", "Failed to save pricing. Please try again.");
    } finally {
      setSavingMsgPrice(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const bannerSource: ImageSourcePropType | undefined = bannerOverride ?? firestoreBannerUri;
  const displayName =
    currentUserId === session?.uid
      ? session?.displayName || userInfo?.username
      : userInfo?.username;
  const displayBio =
    currentUserId === session?.uid
      ? session?.bio || userInfo?.bio
      : userInfo?.bio;
  const displayPic =
    currentUserId === session?.uid && session?.profilePic
      ? session.profilePic
      : userInfo?.profilePic;
  const connectedWalletRaw =
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
  const connectedWallet = walletDisconnectedLocally ? null : connectedWalletRaw;
  const isWalletConnected = !!connectedWallet;
  const walletButtonLabel = connectedWallet
    ? `${connectedWallet.address.slice(0, 4)}...${connectedWallet.address.slice(-4)}`
    : "Connect Wallet";

  // Keep profileWalletAddress in sync with the live wallet for own profile,
  // and persist it to Firestore so other users can see this profile's NFTs.
  useEffect(() => {
    if (!isOwnProfile) return;
    const addr = connectedWallet?.address ?? null;
    setProfileWalletAddress(addr);
    if (addr && session?.uid) {
      saveWalletAddress(session.uid, addr).catch(console.error);
    }
  }, [connectedWallet?.address, isOwnProfile, session?.uid]);

  useEffect(() => {
    let isCancelled = false;

    const fetchWalletNfts = async () => {
      if (!profileWalletAddress) {
        setWalletNfts([]);
        setWalletNftsLoading(false);
        return;
      }

      setWalletNftsLoading(true);
      try {
        const ownerPublicKey = new PublicKey(profileWalletAddress);
        const clusters: Array<"mainnet-beta" | "devnet"> = [
          "mainnet-beta",
          "devnet",
        ];
        const mintsByCluster: Record<"mainnet-beta" | "devnet", string[]> = {
          "mainnet-beta": [],
          devnet: [],
        };

        for (const cluster of clusters) {
          try {
            const connection = new Connection(clusterApiUrl(cluster), "confirmed");
            const [tokenAccounts, token2022Accounts] = await Promise.all([
              connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
                programId: SOLANA_TOKEN_PROGRAM_ID,
              }),
              connection.getParsedTokenAccountsByOwner(ownerPublicKey, {
                programId: SOLANA_TOKEN_2022_PROGRAM_ID,
              }),
            ]);

            const clusterNfts = extractNftMints([
              ...tokenAccounts.value,
              ...token2022Accounts.value,
            ]);
            mintsByCluster[cluster] = Array.from(clusterNfts).slice(0, 24);
          } catch (clusterError) {
            console.warn(`[NFT] token account fetch failed for ${cluster}:`, clusterError);
            // Leave mintsByCluster[cluster] as [] and continue with the other cluster
          }
        }

        const [mainnetMeta, devnetMeta] = await Promise.all([
          fetchNftMetadata(mintsByCluster["mainnet-beta"], "mainnet-beta").catch((e) => {
            console.warn("[NFT] mainnet metadata fetch failed:", e);
            return [] as NftMetadata[];
          }),
          fetchNftMetadata(mintsByCluster["devnet"], "devnet").catch((e) => {
            console.warn("[NFT] devnet metadata fetch failed:", e);
            return [] as NftMetadata[];
          }),
        ]);

        // Mints that had no on-chain metadata — show as fallback entries
        const enrichedMints = new Set([
          ...mainnetMeta.map((n) => n.mint),
          ...devnetMeta.map((n) => n.mint),
        ]);
        const fallbackMints: WalletNftPreview[] = [
          ...mintsByCluster["mainnet-beta"],
          ...mintsByCluster["devnet"],
        ]
          .filter((m) => !enrichedMints.has(m))
          .map((mint) => ({ mint }));

        if (!isCancelled) {
          setWalletNfts([
            ...mainnetMeta.map((n) => ({ ...n, cluster: "mainnet-beta" as const })),
            ...devnetMeta.map((n) => ({ ...n, cluster: "devnet" as const })),
            ...fallbackMints,
          ]);
        }
      } catch (error) {
        console.error("Error fetching connected wallet NFTs:", error);
        if (!isCancelled) {
          setWalletNfts([]);
        }
      } finally {
        if (!isCancelled) {
          setWalletNftsLoading(false);
        }
      }
    };

    fetchWalletNfts();

    return () => {
      isCancelled = true;
    };
  }, [profileWalletAddress]);

  return (
    <ScrollView
      className="flex-1"
      style={{backgroundColor: Colors.dark.tint}}
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* ── Profile card ── */}
      <View className="bg-white shadow-sm">

        {/* Banner */}
        <View className="w-full h-44 relative">
          {bannerSource ? (
            <Image
              source={bannerSource}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-[#1e3a6e]" />
          )}

          {/* Top-right actions: Edit Profile + Change Banner */}
          <View className="absolute top-3 right-3 flex-row gap-2">
            {/* Change banner photo */}
            <TouchableOpacity
              className="bg-black/30 rounded-xl p-2"
              onPress={() => setShowBgModal(true)}
            >
              <Ionicons name="camera-outline" size={20} color="white" />
            </TouchableOpacity>

            {/* Edit Profile */}
            <TouchableOpacity
              className="bg-white/20 rounded-xl px-3 py-2 flex-row items-center gap-2"
              onPress={() =>
                router.push({
                  pathname: "/(protected)/(home)/profile/edit-profile",
                  params: { userInfo: JSON.stringify(userInfo) },
                })
              }
            >
              <Ionicons name="pencil-outline" size={16} color="white" />
              <Text className="text-white font-semibold text-sm">Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Profile info */}
        <View className="px-4 pb-5">
          {/* Avatar + bio row */}
          <View className="flex-row items-start gap-4 -mt-12">
            {/* Avatar + username pill */}
            <View className="items-center">
              <Avatar
                size="xl"
                className={`border-4 ${isFinfluencer ? "border-yellow-400" : "border-white"}`}
              >
                <AvatarFallbackText>{displayName}</AvatarFallbackText>
                <AvatarImage source={{ uri: displayPic }} />
              </Avatar>
              <View className="bg-[#1e3a6e] rounded-lg px-3 py-1">
                <Text
                  className="text-white font-bold text-sm"
                  numberOfLines={1}
                >
                  {displayName}
                </Text>
              </View>
            </View>

            {/* Bio */}
            {displayBio ? (
              <View className="flex-1 mt-14">
                <Text className="text-gray-800 text-lg font-medium leading-6">
                  {displayBio}
                </Text>
              </View>
            ) : null}
          </View>

            {/* Followers + Following + Follow button row */}
            <View className="flex-row gap-3 mt-4 flex-wrap items-center">
                <TouchableOpacity
                    onPress={() => setShowFollowersModal(true)}
                    className="bg-[#1e3a6e] rounded-full px-4 py-3 flex-row items-center gap-2"
                >
                    <View className="bg-white rounded-full w-7 h-7 items-center justify-center">
                        <Text className="text-[#1e3a6e] font-bold text-xs">
                            {followers}
                        </Text>
                    </View>
                    <Text className="text-white font-semibold">Friends</Text>
                </TouchableOpacity>

                {/* Friend Me QR Code button - show if viewing own profile */}
                {session?.uid && currentUserId && session.uid === currentUserId && (
                    <TouchableOpacity
                        onPress={() => setShowFriendMeModal(true)}
                        className="bg-[#1e3a6e] rounded-full px-4 py-3 flex-row items-center gap-2"
                    >
                        <Ionicons name="qr-code" size={20} color="white" />
                        <Text className="text-white font-semibold">Friend Me</Text>
                    </TouchableOpacity>
                )}

                {/* Inbox / Messages button - own profile */}
                {session?.uid && currentUserId && session.uid === currentUserId && (
                    <TouchableOpacity
                        onPress={() => router.push("/(protected)/inbox")}
                        className="bg-[#1e3a6e] rounded-full px-4 py-3 flex-row items-center gap-2"
                    >
                        <Ionicons name="chatbubbles-outline" size={18} color="white" />
                        <Text className="text-white font-semibold">Messages</Text>
                    </TouchableOpacity>
                )}

                {/* Follow / Unfollow button */}
                {session?.uid && currentUserId && session.uid !== currentUserId && (
                    <TouchableOpacity
                        disabled={followLoading}
                        onPress={handleFollowToggle}
                        className="bg-[#1e3a6e] rounded-full px-4 py-3.5 flex-row items-center gap-2"
                    >
                        <Text className="text-white font-semibold">
                            {followLoading
                                ? "..."
                                : userFollowing
                                    ? "Pending"
                                    : "Friend Me"}
                        </Text>
                    </TouchableOpacity>
                )}
                {currentUserId === session?.uid && (
                    <TouchableOpacity
                        className="bg-white border border-[#1e3a6e] rounded-full px-4 py-2.5 flex-row items-center gap-2"
                        onPress={handleConnectWallet}
                        activeOpacity={0.8}
                        style={
                            isWalletConnected
                                ? {
                                    backgroundColor: "#1e3a6e",
                                    borderColor: "#1e3a6e",
                                }
                                : undefined
                        }
                    >
                        <Text
                            className="font-semibold"
                            style={{ color: isWalletConnected ? "#ffffff" : "#1e3a6e" }}
                        >
                            {walletButtonLabel}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

          {/* Social links */}
          {userInfo?.socials && (
            <View className="flex-row gap-5 mt-4">
              {userInfo.socials.instagram && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(userInfo!.socials!.instagram!)}
                  accessibilityLabel="Instagram"
                >
                  <AntDesign name="instagram" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
              {userInfo.socials.linkedin && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(userInfo!.socials!.linkedin!)}
                  accessibilityLabel="LinkedIn"
                >
                  <AntDesign name="linkedin-square" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
              {userInfo.socials.tiktok && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(userInfo!.socials!.tiktok!)}
                  accessibilityLabel="TikTok"
                >
                  <AntDesign name="tiktok" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
              {(userInfo.socials as any).website && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL((userInfo!.socials as any).website)
                  }
                  accessibilityLabel="Website"
                >
                  <AntDesign name="earth" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Collapsible sections ── */}
        <View className="h-px bg-gray-100" />

        {/* Interests */}
        <CollapsibleSection title="Interests">
          {userInfo?.interests && userInfo.interests.length > 0 ? (
            <View className="px-4 pb-4 flex-row flex-wrap gap-2">
              {(showAllInterests
                ? userInfo.interests
                : userInfo.interests.slice(0, 5)
              ).map((interest, i) => (
                <Badge key={i} variant="solid" className="bg-[#a3e4d2]">
                  <BadgeText>{interest}</BadgeText>
                </Badge>
              ))}
              {userInfo.interests.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowAllInterests((v) => !v)}
                >
                  <Badge variant="outline" className="bg-white">
                    <BadgeText>
                      {showAllInterests
                        ? "Show less"
                        : `+${userInfo.interests.length - 5} more`}
                    </BadgeText>
                  </Badge>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              No interests listed.
            </Text>
          )}
        </CollapsibleSection>

        {/* Virtual Communities */}
        <CollapsibleSection title="Virtual Communities">
          {digitalCommunities.length > 0 ? (
            <View className="px-4 pb-4 flex-row flex-wrap gap-4">
              {digitalCommunities.map((community: any, index: number) => {
                const contrib = communityContributions[community.communityId];
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => router.push({
                      pathname: `/(protected)/communities/${community.slug}` as any,
                      params: { title: community.title, slug: community.slug, communityId: community.id, themeLightColor: community.themeLightColor, themeDarkColor: community.themeDarkColor }
                    })}
                    className="items-center"
                  >
                    <Image
                      source={{ uri: community.image }}
                      className="w-20 h-20 rounded-full mb-1"
                    />
                    <Text className="text-gray-700 text-xs text-center max-w-[80px]">
                      {community.name}
                    </Text>
                    {contrib && (
                      <Text style={{ color: "#16a34a", fontSize: 11, textAlign: "center", maxWidth: 80, fontWeight: "600" }}>
                        {contrib.totalAmount % 1 === 0
                          ? `${contrib.totalAmount} ${contrib.asset}`
                          : `${contrib.totalAmount.toFixed(contrib.asset === "USDC" ? 2 : 4)} ${contrib.asset}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              No virtual communities yet.
            </Text>
          )}
        </CollapsibleSection>

        {/* IRL Communities */}
        <CollapsibleSection title="IRL Communities">
          {irlCommunities.length > 0 ? (
            <View className="px-4 pb-4 flex-row flex-wrap gap-4">
              {irlCommunities.map((community: any, index: number) => {
                const contrib = communityContributions[community.communityId];
                return (
                  <TouchableOpacity
                    key={index}
                    onPress={() => router.push({
                      pathname: `/(protected)/communities/${community.slug}` as any,
                      params: { title: community.title, slug: community.slug, communityId: community.id, themeLightColor: community.themeLightColor, themeDarkColor: community.themeDarkColor }
                    })}
                    className="items-center"
                  >
                    <Image
                      source={{ uri: community.image }}
                      className="w-20 h-20 rounded-full mb-1"
                    />
                    <Text className="text-gray-700 text-xs text-center max-w-[80px]">
                      {community.name}
                    </Text>
                    {contrib && (
                      <Text style={{ color: "#16a34a", fontSize: 11, textAlign: "center", maxWidth: 80, fontWeight: "600" }}>
                        {contrib.totalAmount % 1 === 0
                          ? `${contrib.totalAmount} ${contrib.asset}`
                          : `${contrib.totalAmount.toFixed(contrib.asset === "USDC" ? 2 : 4)} ${contrib.asset}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              No IRL communities yet.
            </Text>
          )}
        </CollapsibleSection>

        {/* Badges */}
        <CollapsibleSection title="NFTs">
          {!profileWalletAddress ? (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              {isOwnProfile
                ? "Connect your wallet above to showcase your NFTs."
                : "This user hasn't connected a wallet yet."}
            </Text>
          ) : walletNftsLoading ? (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              Loading connected wallet NFTs...
            </Text>
          ) : walletNfts.length === 0 ? (
            <Text className="px-4 pb-4 text-gray-400 text-sm">
              No NFTs are owned or connected with this wallet.
            </Text>
          ) : (
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6, paddingHorizontal: 16, paddingBottom: 16 }}>
              {walletNfts.map((nft, index) => (
                <TouchableOpacity
                  key={`${nft.mint}-${index}`}
                  activeOpacity={0.85}
                  onPress={() => setSelectedNft(nft)}
                  style={{
                    width: "31.5%",
                    aspectRatio: 1,
                    borderRadius: 10,
                    overflow: "hidden",
                    backgroundColor: "#f3f4f6",
                  }}
                >
                  {nft.imageUri ? (
                    <Image
                      source={{ uri: nft.imageUri }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 4 }}>
                      <Text style={{ fontSize: 9, color: "#9ca3af", textAlign: "center" }}>
                        {nft.mint.slice(0, 6)}...{nft.mint.slice(-4)}
                      </Text>
                    </View>
                  )}
                  {nft.name ? (
                    <View
                      style={{
                        position: "absolute",
                        bottom: 0,
                        left: 0,
                        right: 0,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        paddingVertical: 3,
                        paddingHorizontal: 4,
                      }}
                    >
                      <Text
                        style={{ color: "white", fontSize: 9, fontWeight: "600" }}
                        numberOfLines={1}
                      >
                        {nft.name}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </CollapsibleSection>

        {/* Message Pricing – own profile only */}
        {currentUserId === session?.uid && (
          <CollapsibleSection title="Message Pricing">
            {!isWalletConnected ? (
              <Text className="px-4 pb-4 text-gray-400 text-sm">
                Connect your wallet above to enable message pricing.
              </Text>
            ) : (
              <View style={{ paddingHorizontal: 16, paddingBottom: 20, gap: 16 }}>
                {/* Toggle row */}
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 14, fontWeight: "600", color: "#374151" }}>
                      Charge per message
                    </Text>
                    <Text style={{ fontSize: 12, color: "#9ca3af", marginTop: 2 }}>
                      People pay USDC to send you messages
                    </Text>
                  </View>
                  <Switch
                    value={messagePriceEnabled}
                    onValueChange={setMessagePriceEnabled}
                    trackColor={{ false: "#e5e7eb", true: "#1e3a6e" }}
                    thumbColor="white"
                  />
                </View>

                {/* Price input */}
                {messagePriceEnabled && (
                  <View style={{ gap: 6 }}>
                    <Text style={{ fontSize: 13, fontWeight: "600", color: "#374151" }}>
                      Price per message (USDC)
                    </Text>
                    <TextInput
                      value={messagePriceInput}
                      onChangeText={setMessagePriceInput}
                      keyboardType="decimal-pad"
                      placeholder="0.10"
                      placeholderTextColor="#9ca3af"
                      style={{
                        borderWidth: 1,
                        borderColor: "#e5e7eb",
                        borderRadius: 10,
                        paddingHorizontal: 14,
                        paddingVertical: 11,
                        fontSize: 15,
                        color: "#1f2937",
                        backgroundColor: "#f9fafb",
                      }}
                    />
                    <Text style={{ fontSize: 11, color: "#9ca3af" }}>
                      Payments go to your connected wallet:{" "}
                      {connectedWallet?.address.slice(0, 4)}…
                      {connectedWallet?.address.slice(-4)}
                    </Text>
                  </View>
                )}

                {/* Save button */}
                <TouchableOpacity
                  onPress={handleSaveMessagePricing}
                  disabled={savingMsgPrice}
                  style={{
                    backgroundColor: savingMsgPrice ? "#9ca3af" : "#1e3a6e",
                    borderRadius: 12,
                    paddingVertical: 13,
                    alignItems: "center",
                  }}
                >
                  <Text style={{ color: "white", fontWeight: "700", fontSize: 14 }}>
                    {savingMsgPrice ? "Saving…" : "Save Pricing"}
                  </Text>
                </TouchableOpacity>

                {messagePriceEnabled && (
                  <Text style={{ fontSize: 11, color: "#9ca3af", textAlign: "center" }}>
                    Replies you send are always free for others.
                  </Text>
                )}
              </View>
            )}
          </CollapsibleSection>
        )}
      </View>

      {/* ── Tab bar ── */}
      <View
        style={{
          flexDirection: "row",
          backgroundColor: "white",
          borderBottomWidth: 1,
          borderBottomColor: "#e5e7eb",
        }}
      >
        {(
          [
            { key: "posts", label: "Posts" },
            { key: "links", label: "Links" },
            ...(currentUserId === session?.uid
              ? [{ key: "earnings", label: "Earnings" }]
              : []),
          ] as { key: "posts" | "links" | "earnings"; label: string }[]
        ).map(({ key, label }) => (
          <TouchableOpacity
            key={key}
            onPress={() => setActiveTab(key)}
            style={{
              flex: 1,
              paddingVertical: 14,
              alignItems: "center",
              borderBottomWidth: 2,
              borderBottomColor: activeTab === key ? "#1e3a6e" : "transparent",
            }}
          >
            <Text
              style={{
                color: activeTab === key ? "#1e3a6e" : "#9ca3af",
                fontWeight: "600",
                fontSize: 14,
              }}
            >
              {label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeTab === "posts" ? (
        <>
          <NewsfeedList posts={posts} communityPage={false} />
          {loading && (
            <Image
              source={require("@/assets/images/logo-inverted.png")}
              alt="Loading..."
              resizeMode="contain"
              className="w-full"
            />
          )}
        </>
      ) : activeTab === "links" && currentUserId ? (
        <LinkTree
          userId={currentUserId}
          isOwnProfile={session?.uid === currentUserId}
        />
      ) : activeTab === "earnings" && currentUserId ? (
        <EarningsTab userId={currentUserId} />
      ) : null}
      <Modal
        animationType="slide"
        transparent
        visible={showWalletPicker}
        onRequestClose={() => setShowWalletPicker(false)}
      >
        <View className="flex-1 justify-end bg-black/40">
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={() => setShowWalletPicker(false)}
          />
          <View className="bg-white rounded-t-3xl px-4 pt-4 pb-6">
            <Text className="text-[#1e3a6e] font-bold text-lg">
              Connect Wallet
            </Text>
            <Text className="text-gray-600 text-sm mt-1 mb-4">
              Choose a wallet to connect to your profile.
            </Text>

            <TouchableOpacity
              className="border border-[#1e3a6e] rounded-xl px-4 py-3 mb-2"
              activeOpacity={0.8}
              onPress={() => connectWithWallet("phantom")}
            >
              <Text className="text-[#1e3a6e] font-semibold">Phantom</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-[#1e3a6e] rounded-xl px-4 py-3 mb-2"
              activeOpacity={0.8}
              onPress={() => connectWithWallet("backpack")}
            >
              <Text className="text-[#1e3a6e] font-semibold">Backpack</Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="border border-[#1e3a6e] rounded-xl px-4 py-3"
              activeOpacity={0.8}
              onPress={() => connectWithWallet("solflare")}
            >
              <Text className="text-[#1e3a6e] font-semibold">Solflare</Text>
            </TouchableOpacity>

            <Text className="text-gray-500 text-xs mt-4">
              Existing wallets require approving the connection in the wallet
              app.
            </Text>

            <TouchableOpacity
              className="mt-4 rounded-xl px-4 py-3 bg-gray-100"
              activeOpacity={0.8}
              onPress={() => setShowWalletPicker(false)}
            >
              <Text className="text-center text-gray-700 font-semibold">
                Cancel
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Background image picker modal */}
      <BackgroundImageModal
        visible={showBgModal}
        userId={currentUserId}
        currentBanner={bannerSource}
        onClose={() => setShowBgModal(false)}
        onSaved={(url) => {
          setBannerOverride({ uri: url });
          setShowBgModal(false);
        }}
      />

      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={currentUserId || ""}
        initialTab="friends"
      />

      <FriendMeModal
        isOpen={showFriendMeModal}
        onClose={() => setShowFriendMeModal(false)}
        userId={currentUserId || ""}
        username={displayName}
      />

      <NftDetailModal
        nft={selectedNft}
        visible={!!selectedNft}
        onClose={() => setSelectedNft(null)}
      />
    </ScrollView>
  );
}