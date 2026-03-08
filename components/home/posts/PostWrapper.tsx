import { PostMenu } from "@/components/menu/PostMenu";
import { ShareMenu } from "@/components/menu/ShareMenu";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Tooltip, TooltipContent, TooltipText } from "@/components/ui/tooltip";
import { deletePost, pinPost, unpinPost } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { useCommunityStore } from "@/lib/store/community";
import { usePostStore } from "@/lib/store/post";
import { Post as PostType } from "@/types/post";
import {
  Entypo,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { TouchableOpacity, Alert, Modal as RNModal, Linking } from "react-native";
import * as Haptics from "expo-haptics";
import { Connection, PublicKey, SystemProgram, Transaction, clusterApiUrl, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { useBackpackDeeplinkWalletConnector, useDeeplinkWalletConnector } from "@privy-io/expo/connectors";
import { usePhantom } from "@/lib/wallet/PhantomContext";
import { getSingleCommunityById, addCommunityPaidContribution } from "@/lib/api/communities";
import { PostInfo } from "./PostInfo";
import { Icon } from "@/components/ui/icon";
import { Image } from "react-native";

type PostWrapperProps = {
  post: PostType;
  children: React.ReactNode;
  onLike: () => void;
  onOink: () => void;
  userLikedPost: boolean;
  userOinkedPost: boolean;
  onEdit: (editing: boolean) => void;
  editing: boolean;
  type: "post" | "comment";
  createdAt: Timestamp;
  userId: string;
  onViewComments?: (showComments: boolean) => void;
  authorName?: string;
  authorId?: string;
  authorPic?: string;
};

export function PostWrapper({
  post,
  children,
  onLike,
  onOink,
  userOinkedPost,
  userLikedPost,
  onEdit,
  editing,
  type,
  createdAt,
  userId,
  onViewComments,
  authorName,
  authorId,
  authorPic,
}: PostWrapperProps) {
  const { session } = useSession();
  const currentUserId = session?.uid;

  const [showComments, setShowComments] = useState(false);
  const setPinPosts = usePostStore((state) => state.setPinPost);
  const communities = useCommunityStore((state) => state.allCommunities);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [communityTitle, setCommunityTitle] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  // Wallet + payments (SOL)
  // Use the single shared Phantom instance from PhantomProvider.  Creating a
  // new hook per PostWrapper would register N Linking listeners (one per post
  // visible on screen), causing all of them to race on Phantom's redirect URL.
  const walletConnectorAppUrl =
    (process.env.EXPO_PUBLIC_PRIVY_CONNECT_APP_URL as string | undefined) ||
    "https://chachingsocial.io";
  const phantomConnector = usePhantom();
  const backpackConnector = useBackpackDeeplinkWalletConnector({ appUrl: walletConnectorAppUrl, redirectUri: "/" });
  const solflareConnector = useDeeplinkWalletConnector({ appUrl: walletConnectorAppUrl, baseUrl: "https://solflare.com", encryptionPublicKeyName: "solflare_encryption_public_key", redirectUri: "/" });

  const connectedWallet =
    phantomConnector.isConnected && phantomConnector.address
      ? { name: "Phantom" as const, address: phantomConnector.address, connector: phantomConnector }
      : backpackConnector.isConnected && backpackConnector.address
        ? { name: "Backpack" as const, address: backpackConnector.address, connector: backpackConnector }
        : solflareConnector.isConnected && solflareConnector.address
          ? { name: "Solflare" as const, address: solflareConnector.address, connector: solflareConnector }
          : null;
  const isConnected = !!connectedWallet;

  const [communityWallet, setCommunityWallet] = useState<string | null>(null);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [isOinking, setIsOinking] = useState(false);
  const USE_DEVNET_DEFAULT = true; // align with other in-app payments default
  const FALLBACK_COMMUNITY_FUND_WALLET = "Dn5eBy45nbnV6LndYbn3ZXXE34UGAu2ZJAP4yF61XD7x";
  const OINK_SOL_AMOUNT = 0.01; // 0.01 SOL contribution

  const router = useRouter();

  useEffect(() => {
    if (post.pinPost?.id === post.id) {
      setPinned(true);
    }
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        if (!post.newsfeedId) {
          setCommunityTitle("General");
          setIsCommunityAdmin(false);
        } else {
          const community = communities.find(
            (community) => community.id === post.newsfeedId
          );
          if (community) {
            setCommunityTitle(community.title);
            if (currentUserId) {
              setIsCommunityAdmin(community.adminUserId === currentUserId);
            }
          } else {
            setCommunityTitle("General");
            setIsCommunityAdmin(false);
          }
        }
      } catch (error) {
        console.error("Error fetching community:", error);
        setCommunityTitle("General");
        setIsCommunityAdmin(false);
      }
    };
    fetchCommunity();
  }, [post, communities, currentUserId]);

  useEffect(() => {
    if (post.title) {
      setShareTitle(post.title);
    } else if (typeof post.post === "string") {
      setShareTitle(post.post.slice(0, 50) + "...");
    } else {
      setShareTitle("Post on ChaChing Social");
    }
  }, []);

  // Resolve community fund wallet for this post's community
  useEffect(() => {
    const fetchWallet = async () => {
      try {
        if (!post.newsfeedId) {
          setCommunityWallet(FALLBACK_COMMUNITY_FUND_WALLET);
          return;
        }
        const res = await getSingleCommunityById(post.newsfeedId);
        const dest = (res as any)?.communityFundingDestination as string | undefined;
        if (dest) {
          try {
            // Validate address
            new PublicKey(dest);
            setCommunityWallet(dest);
            return;
          } catch {}
        }
        setCommunityWallet(FALLBACK_COMMUNITY_FUND_WALLET);
      } catch {
        setCommunityWallet(FALLBACK_COMMUNITY_FUND_WALLET);
      }
    };
    fetchWallet();
  }, [post.newsfeedId]);

  // Only for posts do we define delete/edit handlers inside the container.
  const handleDelete = () => {
    deletePost(post.id);
  };

  const handleEdit = () => {
    onEdit(!editing);
  };

  const handleShare = () => {
    if (typeof post.id === "string") {
      router.push(`/post/${post.id}`);
    } else {
      console.error("Post ID is not a string:", post.id);
    }
  };

  const viewComments = () => {
    if (onViewComments) onViewComments(!showComments);
    setShowComments(!showComments); // Toggle comments visibility
  };

  const pinToCommunity = () => {
    if (pinned) {
      unpinPost(post.id).then(() => {
        setPinned(false);

        console.log("unpinning post", post);
      });
    } else {
      setPinPosts((prevPinnedPosts: PostType[]) => [
        ...prevPinnedPosts,
        { ...post, pinPost: { id: post.id, order: 0 } },
      ]);
      pinPost(post.id, 0).then(() => {
        setPinned(true);
        console.log("pinning post", post);
      });
    }
  };

  // Computes like count based on local toggle
  const serverLiked = (post.likes ?? []).some((l: any) => l?.userId === currentUserId);
  const baseLikes = post.likes ? post.likes.length : 0;
  const displayedLikes = baseLikes + (userLikedPost && !serverLiked ? 1 : 0) - (!userLikedPost && serverLiked ? 1 : 0);

  const handleLikePress = () => {
    if (!userLikedPost) {
      // Medium impact when liking a post
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onLike();
  };

  const promptWalletConnect = () => {
    Alert.alert(
      "Connect a wallet",
      `To oink, connect a Solana wallet to send ${OINK_SOL_AMOUNT} SOL to this community.`,
      [
        { text: "Phantom", onPress: () => phantomConnector.connect() },
        { text: "Backpack", onPress: () => backpackConnector.connect() },
        { text: "Solflare", onPress: () => solflareConnector.connect() },
        { text: "Cancel", style: "cancel" },
      ]
    );
  };

  const handleOinkPress = async () => {
    if (!isConnected) {
      promptWalletConnect();
      return;
    }

    const destination = communityWallet || FALLBACK_COMMUNITY_FUND_WALLET;

    const doSend = async () => {
      setIsOinking(true);
      try {
        const targetCluster = USE_DEVNET_DEFAULT ? "devnet" : ("mainnet-beta" as const);
        // Only switch clusters when sessionCluster is a *known* value that
        // differs from the target. If it is undefined (Phantom doesn't always
        // embed cluster in the session token), skip reconnect — calling
        // connect() in that case opens the "connect" screen instead of signing.
        const phantomCluster = phantomConnector.sessionCluster;
        if (
          connectedWallet?.name === "Phantom" &&
          phantomCluster !== undefined &&
          phantomCluster !== targetCluster
        ) {
          await phantomConnector.connect(targetCluster);
        }
        const connection = new Connection(clusterApiUrl(targetCluster), "confirmed");
        const senderPublicKey = new PublicKey(connectedWallet!.address);
        const destinationPublicKey = new PublicKey(destination);
        const tx = new Transaction();
        const { blockhash } = await connection.getLatestBlockhash("confirmed");
        tx.add(
          SystemProgram.transfer({
            fromPubkey: senderPublicKey,
            toPubkey: destinationPublicKey,
            lamports: Math.round(OINK_SOL_AMOUNT * LAMPORTS_PER_SOL),
          })
        );
        tx.feePayer = senderPublicKey;
        tx.recentBlockhash = blockhash;

        // Phantom's recommended flow is signAndSendTransaction: one deeplink
        // round-trip where Phantom signs AND broadcasts, returning the signature.
        // Using signTransaction + sendRawTransaction causes "User rejected" /
        // "Unexpected error" because Phantom re-simulates on its end, and the
        // manual broadcast step races with Phantom's own broadcast attempt.
        let signature: string;
        if (connectedWallet?.name === "Phantom") {
          const result = await phantomConnector.signAndSendTransaction(tx);
          signature = result.signature;
        } else {
          // Backpack / Solflare: sign then broadcast manually
          const signResponse = await (connectedWallet as any).connector.signTransaction(tx);
          let signedBytes: Uint8Array | null = null;
          try {
            const maybeBytes = (signResponse as any)?.signedTransaction ?? (signResponse as any)?.transaction;
            if (maybeBytes && Array.isArray(maybeBytes)) {
              signedBytes = Uint8Array.from(maybeBytes);
            }
          } catch {}
          if (!signedBytes) {
            try {
              signedBytes = new Uint8Array((signResponse as any).serialize ? (signResponse as any).serialize() : tx.serialize({ requireAllSignatures: false }));
            } catch {}
          }
          if (!signedBytes) throw new Error("Wallet returned an unsupported signed transaction payload");
          signature = await connection.sendRawTransaction(signedBytes, {
            preflightCommitment: "confirmed",
            skipPreflight: false,
            maxRetries: 3,
          });
        }

        setTxSignature(signature);
        setShowTxModal(true);

        // Best-effort persistence of the contribution
        try {
          if (post.newsfeedId) {
            await addCommunityPaidContribution(post.newsfeedId, {
              userId: currentUserId ?? "",
              displayName: (session?.displayName as string) || "Anonymous",
              profilePic: (session?.profilePic as string) || null,
              amount: OINK_SOL_AMOUNT,
              asset: "SOL",
              transactionId: signature,
              network: targetCluster,
              status: "COMPLETED",
              date: new Date().toISOString(),
            });
          }
        } catch {}
        // Toggle local UI state (pigs animation/flag)
        onOink();
      } catch (error) {
        const msg = (error instanceof Error ? error.message : String(error)).toLowerCase();
        if (
          msg.includes("timed out") ||
          msg.includes("not been authorized") ||
          msg.includes("not authorized") ||
          msg.includes("method is not supported") ||
          msg.includes("wallet not connected")
        ) {
          // Reconnect the specific wallet that was already in use, or fall back
          // to the full wallet picker if none was connected.
          const reconnect = () => {
            if (connectedWallet?.name === "Phantom") {
              void phantomConnector.connect();
            } else if (connectedWallet?.name === "Backpack") {
              void backpackConnector.connect();
            } else if (connectedWallet?.name === "Solflare") {
              void solflareConnector.connect();
            } else {
              promptWalletConnect();
            }
          };
          Alert.alert(
            "Session expired",
            "Your wallet session expired. Reconnect and try again.",
            [
              { text: "Reconnect", onPress: reconnect },
              { text: "Cancel", style: "cancel" },
            ]
          );
        } else {
          Alert.alert("Oink failed", "Could not process the SOL contribution. Please try again.");
        }
      } finally {
        setIsOinking(false);
      }
    };

    const communityName = (communityTitle && communityTitle.length > 0) ? communityTitle : "this community";
    Alert.alert(
      "Confirm oink",
      `Send ${OINK_SOL_AMOUNT} SOL to ${communityName}?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Confirm", onPress: () => void doSend() },
      ]
    );
  };

  return (
    <Box
      className="relative align-middle rounded-lg bg-white">
      <PostInfo
        post={post}
        createdAt={createdAt}
        authorName={authorName}
        authorId={authorId}
        authorPic={authorPic}
        hideAvatar={type === "comment"}
      />

      <Box className={`${type === "comment" ? "border-purple-950 border-l-2 pl-1 ml-1" : ""}`}>
        {children}
      </Box>

      {type !== "comment" && (
        <Box className="mt-4 flex flex-row gap-5 mx-2 mb-2">
          <Box className="flex flex-row items-center gap-2">
            <TouchableOpacity
              onPress={handleLikePress}
              className="flex flex-row items-center"
            >
              <FontAwesome
                name={userLikedPost ? "heart" : "heart-o"}
                size={20}
                color="red"
              />
            </TouchableOpacity>
            <Text>{displayedLikes}</Text>
          </Box>
          {currentUserId !== post.posterUserId && (
            <Tooltip
              placement="top"
              trigger={(triggerProps) => {
                return (
                  <TouchableOpacity
                    onPress={handleOinkPress}
                    disabled={isOinking}
                    className="flex flex-row items-center"
                  >
                      <Image
                        source={userOinkedPost ? require("@/assets/images/oink-birthday.png") : require("@/assets/images/oink.png")}
                        style={{ width: 48, height: 48 }}
                      />

                    {/*<MaterialCommunityIcons*/}
                    {/*  name={*/}
                    {/*    userOinkedPost ? "piggy-bank" : "piggy-bank-outline"*/}
                    {/*  }*/}
                    {/*  size={24}*/}
                    {/*  color="purple"*/}
                    {/*/>*/}

                  </TouchableOpacity>
                );
              }}
            >
              <TooltipContent>
                <TooltipText>
                  Oinking a post means you're giving the author your points!
                </TooltipText>
              </TooltipContent>
            </Tooltip>
          )}

          <Box className="flex flex-row items-center gap-2">
            <TouchableOpacity
              onPress={viewComments}
              className="flex flex-row items-center"
            >
              <MaterialCommunityIcons
                name={
                  showComments
                    ? "comment-processing-outline"
                    : "comment-processing"
                }
                size={24}
                color="blue"
              />
            </TouchableOpacity>
            <Text>{post.comments ? post.comments.length : 0}</Text>
          </Box>
          {isCommunityAdmin && (
            // <Icon
            //   variant="transparent"
            //   //size="lg"
            //   aria-label="PinToCommunity"
            //   onClick={pinToCommunity}
            // >
            //   <IconPin
            //     style={{ width: rem(20), color: "gold", cursor: "pointer" }}
            //     stroke={1.5}
            //     //size="lg"
            //     fill={pinned ? "gold" : "transparent"}
            //   />
            // </Icon>
            <TouchableOpacity
              onPress={pinToCommunity}
              className="flex flex-row items-center"
            >
              <Entypo name="pin" size={20} color="gold" />
            </TouchableOpacity>
          )}
          {/* <ShareMenu
            url={`/post/${post.id}`}
            title={shareTitle}
            communityTitle={communityTitle}
          /> */}
          <Box className="ml-auto">
            <PostMenu
              post={post}
              type="post"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              userId={userId}
              editing={editing}
            />
          </Box>
        </Box>
      )}

      {post.advert && (
        <Text className="mt-4 text-sm text-gray-500 px-2 pb-4" bold>
          This is a sponsored advertisement. We may receive a commission for
          purchases made through this link.
        </Text>
      )}
      {/* Post-oink transaction modal */}
      <RNModal
        animationType="fade"
        transparent
        visible={showTxModal}
        onRequestClose={() => setShowTxModal(false)}
      >
        <Box className="flex-1 bg-black/40 px-6 items-center justify-center">
          <Box className="w-full bg-white rounded-2xl p-5">
            <Text className="text-[#1e3a6e] text-lg font-bold mb-2">
              Contribution sent
            </Text>
            {txSignature && (
              <Text className="text-gray-700 text-sm mb-4">
                Transaction: {txSignature}
              </Text>
            )}
            <TouchableOpacity
              className="bg-[#1e3a6e] rounded-xl py-3 mb-2"
              activeOpacity={0.85}
              onPress={() => {
                if (!txSignature) return;
                const url = `https://solscan.io/tx/${txSignature}${
                  USE_DEVNET_DEFAULT ? "?cluster=devnet" : ""
                }`;
                Linking.openURL(url).catch(() => {});
              }}
            >
              <Text className="text-white text-center font-semibold">View on Solscan</Text>
            </TouchableOpacity>
            <TouchableOpacity
              className="bg-gray-100 rounded-xl py-3"
              activeOpacity={0.85}
              onPress={() => setShowTxModal(false)}
            >
              <Text className="text-gray-700 text-center font-semibold">Close</Text>
            </TouchableOpacity>
          </Box>
        </Box>
      </RNModal>
    </Box>
  );
}
