import { User } from "@/_sdk";
import type { Post } from "@/types/post";
import NewsfeedList from "@/components/home/NewsfeedList";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
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
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";
import { Image, RefreshControl, TouchableOpacity } from "react-native";
import { DocumentSnapshot } from "firebase/firestore";

export default function Profile() {
  const { id: UserId } = useLocalSearchParams();
  const { session } = useSession();
  const currentUserId = (Array.isArray(UserId) ? UserId[0] : UserId) || session?.uid || "";

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  console.log("UserInfo from params:", userInfo);
  console.log("followers", followers)

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
        const { posts: initial, lastDoc: initialLastDoc } = await getPostsByUser(
          currentUserId
        );
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
      const normalized = (more as Post[]).map((p: any) => ({ ...p, featured: true }));
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
    const normalized = (fresh as Post[]).map((p: any) => ({ ...p, featured: true }));
    setPosts(normalized as Post[]);
    setLastDoc(freshLastDoc);
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="bg-[#E6F8F1] flex-1"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <VStack space="md" className="px-4 pt-6 justify-center items-center">
        <Avatar
          size="2xl"
          className={`border-4 ${
            isFinfluencer ? "border-secondary-0" : "border-white"
          }`}
        >
          <AvatarFallbackText>
            {userInfo?.username || session?.displayName}
          </AvatarFallbackText>
          <AvatarImage
            source={{
              uri: userInfo?.profilePic || session?.profilePic,
            }}
          />
        </Avatar>

        <Box>
          <Heading size="xl">
            @{userInfo?.username || session?.displayName}
          </Heading>
          {session?.uid === userInfo?.id && (
            <Text
              size="md"
              className="font-extralight text-typography-black text-center"
            >
              {session?.email}
            </Text>
          )}
        </Box>
        <HStack space="md" reversed={false}>
          <Box className="flex flex-row gap-1">
            <Text bold className="text-typography-black">
              {following}
            </Text>
            <Text className="font-extralight">Following</Text>
          </Box>
          <Box className="flex flex-row gap-1">
            <Text bold className="text-black">
              {followers}
            </Text>
            <Text className="font-extralight">Followers</Text>
          </Box>
        </HStack>
      </VStack>

      <NewsfeedList
        posts={posts}
        communityPage={false}
        //   isUserCommunityAdmin={UserId === communityData.adminUserId}
      />

      {loading && (
        <Image
          source={require("@/assets/images/pig-loading.gif")}
          alt="Loading..."
          resizeMode="contain"
          className="w-full"
        />
      )}
      {lastDoc && (
        <TouchableOpacity
          className="bg-[#00bf63] rounded-lg p-2 w-36 mx-auto my-6"
          onPress={fetchMorePosts}
          disabled={loading}
        >
          <Text bold className="text-center text-white">Load More</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );
}
