import { User } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import {
    Avatar,
    AvatarFallbackText,
    AvatarImage,
} from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { userApi } from "@/config/backend";
import { getPostsByUser } from "@/lib/api/newsfeed";
import {
    checkIfFinFluencer,
    fetchFollowers,
    fetchFollowing,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import type { Post } from "@/types/post";
import { AntDesign } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useLocalSearchParams, useRouter } from "expo-router";
import { DocumentSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import {
    Image,
    NativeScrollEvent,
    NativeSyntheticEvent,
    RefreshControl,
    ScrollView,
    TouchableOpacity,
} from "react-native";

export default function UserProfile() {
  const { id: UserId } = useLocalSearchParams();
  const { session } = useSession();
  const router = useRouter();
  const currentUserId = Array.isArray(UserId) ? UserId[0] : UserId;

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [showAllInterests, setShowAllInterests] = useState(false);

  const fetchUserInfo = async () => {
    try {
      if (!currentUserId) return;
      const res = await userApi.getUserById({ userId: currentUserId });
      setUserInfo(res);
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
      const followersRes = await fetchFollowers(currentUserId);
      const followingRes = await fetchFollowing(currentUserId);
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

  useEffect(() => {
    fetchFollowersAndFollowing();
    fetchFinfluencerStatus();
  }, [currentUserId]);

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
    const { posts: fresh, lastDoc: freshLastDoc } = await getPostsByUser(
      currentUserId
    );
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
    const paddingToBottom = 200;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - paddingToBottom;
    if (isNearBottom) {
      fetchMorePosts();
    }
  };

  return (
    <ScrollView
      className="bg-[#077f5f] flex-1"
      onScroll={handleScroll}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <VStack space="md" className="pt-6 px-4 justify-center items-center">
        <Avatar
          size="xl"
          className={`border-4 ${
            isFinfluencer ? "border-secondary-0" : "border-white"
          }`}
        >
          <AvatarFallbackText>{userInfo?.username}</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: userInfo?.profilePic,
            }}
          />
        </Avatar>
        <Heading
          size="xl"
          className="text-white text-center items-center gap-4"
        >
          @{userInfo?.username}
        </Heading>
        <Box
          style={{
            width: "100%",
            alignItems: "center",
            justifyContent: "center",
            display: "flex",
          }}
        >
          <HStack
            space="md"
            reversed={false}
            className="justify-center items-center w-full"
            style={{ width: "100%" }}
          >
            <Box className="flex flex-row gap-1 justify-center items-center">
              <Text bold className="text-typography-white">
                {following}
              </Text>
              <Text className="font-extralight text-white">Following</Text>
            </Box>
            <Box className="flex flex-row gap-1 justify-center items-center">
              <Text bold className="text-white">
                {followers}
              </Text>
              <Text className="font-extralight text-white">Followers</Text>
            </Box>
          </HStack>
          {userInfo?.bio && (
            <Text
              size="md"
              className="font-extralight text-typography-white text-center"
            >
              {userInfo?.bio}
            </Text>
          )}
          {userInfo?.socials && (
            <Box
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 16,
                marginVertical: 12,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
              }}
            >
              {userInfo?.socials?.instagram && (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(userInfo.socials.instagram);
                  }}
                  style={{
                    alignSelf: "center",
                    justifyContent: "center",
                    marginHorizontal: 8,
                  }}
                  accessibilityLabel="Instagram"
                >
                  <AntDesign name="instagram" size={32} color="#fff" />
                </TouchableOpacity>
              )}
              {userInfo?.socials?.linkedin && (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(userInfo?.socials?.linkedin);
                  }}
                  style={{
                    alignSelf: "center",
                    justifyContent: "center",
                    marginHorizontal: 4,
                  }}
                  accessibilityLabel="LinkedIn"
                >
                  <AntDesign name="linkedin-square" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {userInfo?.socials?.tiktok && (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(userInfo?.socials?.tiktok);
                  }}
                  style={{
                    alignSelf: "center",
                    justifyContent: "center",
                    marginHorizontal: 4,
                  }}
                  accessibilityLabel="TikTok"
                >
                  <AntDesign name="tiktok" size={24} color="#fff" />
                </TouchableOpacity>
              )}
              {userInfo.socials.website && (
                <TouchableOpacity
                  onPress={() => {
                    Linking.openURL(userInfo.socials.website);
                  }}
                  style={{
                    alignSelf: "center",
                    justifyContent: "center",
                    marginHorizontal: 4,
                  }}
                  accessibilityLabel="Website"
                >
                  <AntDesign name="earth" size={24} color="#fff" />
                </TouchableOpacity>
              )}
            </Box>
          )}
          {userInfo?.interests && (
            <Box
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 8,
                marginVertical: 8,
                justifyContent: "center",
                alignItems: "center",
                width: "100%",
                alignSelf: "center",
              }}
            >
              {userInfo?.interests && userInfo.interests.length > 0 && (
                <>
                  {(showAllInterests
                    ? userInfo.interests
                    : userInfo.interests.slice(0, 5)
                  ).map((interest, index) => (
                    <Badge key={index} variant="solid" className="bg-[#a3e4d2]">
                      <BadgeText>{interest}</BadgeText>
                    </Badge>
                  ))}
                </>
              )}

              {userInfo?.interests && userInfo.interests.length > 5 && (
                <TouchableOpacity
                  onPress={() => setShowAllInterests((prev) => !prev)}
                  style={{ alignSelf: "center", marginLeft: 8 }}
                >
                  <Badge variant="outline" className="bg-white">
                    <BadgeText className="bg-[#a3e4d2]">
                      {showAllInterests
                        ? "Show less"
                        : `+${userInfo.interests.length - 5} more`}
                    </BadgeText>
                  </Badge>
                </TouchableOpacity>
              )}
            </Box>
          )}
        </Box>
      </VStack>

      <NewsfeedList
        posts={posts}
        communityPage={false}
        //   isUserCommunityAdmin={UserId === communityData.adminUserId}
      />

      {loading && (
        <Image
          source={require("@/assets/images/logo-inverted.png")}
          alt="Loading..."
          resizeMode="contain"
          className="w-full"
        />
      )}
    </ScrollView>
  );
}
