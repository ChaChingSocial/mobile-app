import { User } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { scoreApi, userApi } from "@/config/backend";
import { getPostsByUser } from "@/lib/api/newsfeed";
import {
  checkIfFinFluencer,
  fetchFollowers,
  fetchFollowing,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { useScoreStore } from "@/lib/store/score";
import type { Post } from "@/types/post";
import { AntDesign } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useFocusEffect } from "@react-navigation/native";
import { DocumentSnapshot } from "firebase/firestore";
import React, { useEffect, useState, useCallback } from "react";
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
import { Ionicons } from "@expo/vector-icons";
import {Colors} from "@/lib/constants/Colors";
import BackgroundImageModal from "@/components/profile/BackgroundImageModal";

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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function Profile() {
  const { id: UserId } = useLocalSearchParams();
  const { session } = useSession();
  const router = useRouter();
  const currentUserId =
    (Array.isArray(UserId) ? UserId[0] : UserId) || session?.uid || "";

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);
  const [showBgModal, setShowBgModal] = useState(false);
  const [bannerOverride, setBannerOverride] = useState<string | undefined>();

  const setCurrentUserScore = useScoreStore(
    (state) => state.setCurrentUserScore
  );

  // ── Data fetching ────────────────────────────────────────────────────────
  const fetchUserInfo = async () => {
    try {
      if (!currentUserId) return;
      const res = await userApi.getUserById({ userId: currentUserId });
      setUserInfo(res);
      if (currentUserId === session?.uid) {
        const scoreRes = await scoreApi.getScore({ userId: currentUserId });
        setCurrentUserScore(scoreRes);
      }
    } catch (error) {
      console.error("Error fetching user info:", error);
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
      setFollowers(followersRes.size);
      setFollowing(followingRes.size);
    }
  };

  useEffect(() => {
    if (currentUserId) {
      fetchUserInfo();
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

  // ── Render ───────────────────────────────────────────────────────────────
  const bannerUri = bannerOverride ?? (userInfo as any)?.backgroundPic ?? (userInfo as any)?.backgroundImage;
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
          {bannerUri ? (
            <Image
              source={{ uri: bannerUri }}
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
              <View className="bg-[#1e3a6e] rounded-lg px-3 py-1 mt-2">
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

          {/* Followers + Following row */}
          <View className="flex-row gap-3 mt-5 flex-wrap">
            <View className="bg-[#1e3a6e] rounded-full px-4 py-2.5 flex-row items-center gap-2">
              <View className="bg-white rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-[#1e3a6e] font-bold text-xs">
                  {followers}
                </Text>
              </View>
              <Text className="text-white font-semibold">Friends</Text>
            </View>

            <View className="bg-white border border-[#1e3a6e] rounded-full px-4 py-2.5 flex-row items-center gap-2">
              <View className="bg-[#1e3a6e] rounded-full w-7 h-7 items-center justify-center">
                <Text className="text-white font-bold text-xs">
                  {following}
                </Text>
              </View>
              <Text className="text-[#1e3a6e] font-semibold">Following</Text>
            </View>
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

      {/* Background image picker modal */}
      <BackgroundImageModal
        visible={showBgModal}
        userId={currentUserId}
        currentBanner={bannerUri}
        onClose={() => setShowBgModal(false)}
        onSaved={(url) => {
          setBannerOverride(url);
          setShowBgModal(false);
        }}
      />
    </ScrollView>
  );
}
