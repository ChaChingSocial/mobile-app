import { User } from "@/_sdk";
import {
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import BlockUserModal from "@/components/BlockUserModal";
import FollowersModal from "@/components/profile/FollowersModal";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { userApi } from "@/config/backend";
import { getPostsByUser } from "@/lib/api/newsfeed";
import { sendNotificationEmail } from "@/lib/api/notifications";
import {
  checkIfFinFluencer,
  createAbuseReport,
  fetchFollowers,
  fetchFollowing,
  followUser,
  getUserProfile,
  isFollowing,
  unfollowUser,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import { Colors } from "@/lib/constants/Colors";
import type { Post } from "@/types/post";
import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import {
  useLocalSearchParams,
  useNavigation,
  useRouter,
} from "expo-router";
import { DocumentSnapshot } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import {
  Image,
  NativeScrollEvent,
  NativeSyntheticEvent,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Toast from "react-native-toast-message";

// ── Collapsible section (matches profile/index.tsx) ──────────────────────────
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

// ── Main screen ───────────────────────────────────────────────────────────────
interface UserProfileProps {
  userId?: string;
  displayName?: string;
  photoURL?: string;
  bio?: string;
  interests?: string[];
}

export default function UserProfile({
  userId: propUserId,
  displayName: propDisplayName,
  photoURL: propPhotoURL,
  bio: propBio,
  interests: propInterests,
}: UserProfileProps = {}) {
  const { id: UserId, displayName: paramDisplayName, photoURL: paramPhotoURL, bio: paramBio, interests: paramInterests } = useLocalSearchParams();
  const { session } = useSession();
  const router = useRouter();
  const navigation = useNavigation();

  // Use prop userId if provided, otherwise fall back to route parameter
  const currentUserId = propUserId || (Array.isArray(UserId) ? UserId[0] : UserId);

  // Parse route params (they come as strings)
  const routeDisplayName = Array.isArray(paramDisplayName) ? paramDisplayName[0] : paramDisplayName;
  const routePhotoURL = Array.isArray(paramPhotoURL) ? paramPhotoURL[0] : paramPhotoURL;
  const routeBio = Array.isArray(paramBio) ? paramBio[0] : paramBio;
  const routeInterestsStr = Array.isArray(paramInterests) ? paramInterests[0] : paramInterests;
  let routeInterests: string[] | undefined;
  try {
    routeInterests = routeInterestsStr ? JSON.parse(routeInterestsStr as string) : undefined;
  } catch (error) {
    console.error("Error parsing interests from route params:", error);
    routeInterests = undefined;
  }

  // Merge props and route params (props take precedence)
  const finalDisplayName = propDisplayName || routeDisplayName;
  const finalPhotoURL = propPhotoURL || routePhotoURL;
  const finalBio = propBio || routeBio;
  const finalInterests = propInterests || routeInterests;

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [userFollowing, setUserFollowing] = useState(false);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [firestoreProfile, setFirestoreProfile] = useState<any>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [blocking, setBlocking] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const { blockUser, unblockUser, isBlocked } = useBlockedUsers();
  const userIsBlocked = currentUserId ? isBlocked(currentUserId) : false;


  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchUserInfo = async () => {
    if (!currentUserId) return;

    // If we have complete data from props, we can skip the initial fetch
    // but still allow refresh to update data
    const hasCompletePropsData = finalDisplayName && finalPhotoURL;

    if (hasCompletePropsData && userInfo === null && firestoreProfile === null) {
      console.log("Using props data, skipping initial fetch for:", currentUserId);
      // Set firestore profile from props to avoid fetching
      setFirestoreProfile({
        displayName: finalDisplayName,
        photoURL: finalPhotoURL,
        bio: finalBio,
        interests: finalInterests || [],
      });
      return;
    }

    console.log("Fetching user info for ID:", currentUserId);

    // Fetch independently — if the backend API fails, Firestore still loads
    try {
      const res = await userApi.getUserById({ userId: currentUserId });
      if (res && res.username) {
        setUserInfo(res);
      } else {
        console.warn("API response missing username:", res);
        setUserInfo(res);
      }
    } catch (error) {
      console.error("Error fetching user from API:", error);
    }

    try {
      const fsProfile = await getUserProfile(currentUserId);
      if (fsProfile) {
        setFirestoreProfile(fsProfile);
      }
    } catch (error) {
      console.error("Error fetching Firestore profile:", error);
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

  const fetchFinfluencerStatus = async () => {
    if (currentUserId) {
      const res = await checkIfFinFluencer(currentUserId);
      setIsFinfluencer(res);
    }
  };

  // ── Calculate display variables ────────────────────────────────────────────
  // Prioritize: props/params > API > Firestore
  const displayName =
    finalDisplayName || userInfo?.username || firestoreProfile?.displayName;
  const displayPic =
    finalPhotoURL || userInfo?.profilePic || firestoreProfile?.photoURL;
  const displayBio =
    finalBio || userInfo?.bio || firestoreProfile?.bio;
  const displayInterests: string[] =
    finalInterests ||
    (userInfo?.interests?.length
      ? userInfo.interests
      : firestoreProfile?.interests ?? []);

  const bannerUri =
    (userInfo as any)?.backgroundPic ??
    (userInfo as any)?.backgroundImage ??
    firestoreProfile?.backgroundImage;

  useEffect(() => {
    if (currentUserId) {
      fetchUserInfo();
      fetchFollowersAndFollowing();
      fetchFinfluencerStatus();
      fetchFollowStatus();
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

  // Update header title
  useEffect(() => {
    const title = displayName ? `@${displayName}` : "";
    navigation.setOptions?.({ title });
  }, [displayName, navigation]);

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

  // ── Block / Unblock ──────────────────────────────────────────────────────
  const handleBlockUser = async (reason?: string, alsoReport?: boolean) => {
    if (!session?.uid || !currentUserId) return;
    setBlocking(true);
    try {
      let abuseReportId: string | undefined;

      if (alsoReport && reason) {
        abuseReportId = await createAbuseReport(
          session.uid,
          currentUserId,
          reason
        );
        const reporterName =
          session?.displayName || session?.email || "Unknown User";
        const message = `User Block & Report\n\nReporter: ${reporterName} (${session.uid})\nReported User: ${userInfo?.username} (${currentUserId})\nReason: ${reason}\nReport ID: ${abuseReportId}`;
        await sendNotificationEmail(
          NotificationNotificationTypeEnum.Reported,
          "",
          "User Blocked & Reported",
          "",
          message,
          NotificationEntityTypeEnum.Community,
          [
            "rushikesh.joshi@chachingsocial.io",
            "sonia.lomo@fatfiresocial.com",
            "mabel.oza@chachingsocial.io",
          ],
          session.uid
        );
      }

      const success = await blockUser(currentUserId, reason, abuseReportId);
      if (success) {
        Toast.show({
          type: "success",
          text1: "User blocked successfully",
          text2: "You won't see their content anymore.",
        });
        setShowBlockModal(false);
        router.back();
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to block user",
          text2: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      Toast.show({
        type: "error",
        text1: "Failed to block user",
        text2: "Please try again.",
      });
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockUser = async () => {
    if (!session?.uid || !currentUserId) return;
    try {
      const success = await unblockUser(currentUserId);
      if (success) {
        Toast.show({
          type: "success",
          text1: "User unblocked",
          text2: "You can now see their content.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to unblock user",
          text2: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <ScrollView
      className="flex-1"
      style={{ backgroundColor: Colors.dark.tint }}
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
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
              className="w-full h-full"
              resizeMode="cover"
            />
          ) : (
            <View className="w-full h-full bg-[#1e3a6e]" />
          )}

          {/* Block / Unblock — top-right corner */}
          {session?.uid && currentUserId && session.uid !== currentUserId && (
            <View className="absolute top-3 right-3">
              {userIsBlocked ? (
                <TouchableOpacity
                  className="bg-white/90 rounded-xl px-3 py-2 flex-row items-center gap-2"
                  onPress={handleUnblockUser}
                >
                  <FontAwesome5 name="check" size={14} color="#077f5f" />
                  <Text className="text-[#077f5f] font-semibold text-sm">
                    Unblock
                  </Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  className="bg-red-500/90 rounded-xl px-3 py-2 flex-row items-center gap-2"
                  onPress={() => setShowBlockModal(true)}
                >
                  <FontAwesome5 name="ban" size={14} color="white" />
                  <Text className="text-white font-semibold text-sm">
                    Block
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Profile info */}
        <View className="px-4 pb-5">
          {/* Avatar + bio row */}
          <View className="flex-row items-start gap-4 -mt-12">
            {/* Avatar + username pill */}
            <View className="items-center">
              <Avatar
                size="xl"
                className={`border-4 ${
                  isFinfluencer ? "border-yellow-400" : "border-white"
                }`}
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
          </View>

          {/* Social links */}
          {userInfo?.socials && (
            <View className="flex-row gap-5 mt-4">
              {userInfo.socials.instagram && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(userInfo!.socials!.instagram!)
                  }
                  accessibilityLabel="Instagram"
                >
                  <AntDesign name="instagram" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
              {userInfo.socials.linkedin && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(userInfo!.socials!.linkedin!)
                  }
                  accessibilityLabel="LinkedIn"
                >
                  <AntDesign
                    name="linkedin"
                    size={26}
                    color="#6b7280"
                  />
                </TouchableOpacity>
              )}
              {userInfo.socials.tiktok && (
                <TouchableOpacity
                  onPress={() => Linking.openURL(userInfo!.socials!.tiktok!)}
                  accessibilityLabel="TikTok"
                >
                  <AntDesign name="video-camera" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
              {(userInfo.socials as any).website && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL((userInfo!.socials as any).website)
                  }
                  accessibilityLabel="Website"
                >
                  <AntDesign name="link" size={26} color="#6b7280" />
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* ── Collapsible sections ── */}
        <View className="h-px bg-gray-100" />

        {/* Interests */}
        <CollapsibleSection title="Interests">
          {displayInterests.length > 0 ? (
            <View className="px-4 pb-4 flex-row flex-wrap gap-2">
              {(showAllInterests
                ? displayInterests
                : displayInterests.slice(0, 5)
              ).map((interest, i) => (
                <Badge key={i} variant="solid" className="bg-[#a3e4d2]">
                  <BadgeText>{interest}</BadgeText>
                </Badge>
              ))}
              {displayInterests.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowAllInterests((v) => !v)}
                >
                  <Badge variant="outline" className="bg-white">
                    <BadgeText>
                      {showAllInterests
                        ? "Show less"
                        : `+${displayInterests.length - 5} more`}
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
          <Text className="px-4 pb-4 text-gray-400 text-sm">
            No virtual communities yet.
          </Text>
        </CollapsibleSection>

        {/* IRL Communities */}
        <CollapsibleSection title="IRL Communities">
          <Text className="px-4 pb-4 text-gray-400 text-sm">
            No IRL communities yet.
          </Text>
        </CollapsibleSection>

        {/* Badges */}
        <CollapsibleSection title="Badges">
          <Text className="px-4 pb-4 text-gray-400 text-sm">
            No badges earned yet.
          </Text>
        </CollapsibleSection>
      </View>

      {/* ── Posts ── */}
      <NewsfeedList posts={posts} communityPage={false} />

      {loading && (
        <Image
          source={require("@/assets/images/logo-inverted.png")}
          alt="Loading..."
          resizeMode="contain"
          className="w-full"
        />
      )}

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockUser}
        userName={displayName}
        loading={blocking}
      />

      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={currentUserId || ""}
        initialTab="friends"
      />
    </ScrollView>
  );
}
