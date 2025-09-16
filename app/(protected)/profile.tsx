import { Post, User } from "@/_sdk";
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
import { useSubscribeToPostsByUserId } from "@/hooks/useSubscribeToPosts";
import {
  checkIfFinFluencer,
  fetchFollowers,
  fetchFollowing,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { ScrollView } from "react-native-gesture-handler";

export default function Profile() {
  const { id: UserId } = useLocalSearchParams();
  const { session } = useSession();

  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [posts, setPosts] = useState<Post[]>([]);
  const [userInfo, setUserInfo] = useState<User | null>(null);

  const fetchUserInfo = async () => {
    try {
      const res = await userApi.getUserById({ userId: UserId });
      setUserInfo(res);
    } catch (error) {
      console.error("Error fetching user info:", error);
    }
  };

  const fetchFinfluencerStatus = async () => {
    if (UserId) {
      const res = await checkIfFinFluencer(UserId);
      setIsFinfluencer(res);
    }
  };

  const fetchFollowersAndFollowing = async () => {
    if (UserId) {
      const followersRes = await fetchFollowers(UserId);
      const followingRes = await fetchFollowing(UserId);
      setFollowers(followersRes.size);
      setFollowing(followingRes.size);
    }
  };

  useEffect(() => {
    if (UserId) {
      fetchUserInfo();
      useSubscribeToPostsByUserId(UserId, setPosts);
    }
  }, [UserId]);

  useEffect(() => {
    fetchFollowersAndFollowing();
    fetchFinfluencerStatus();
  }, [UserId]);

  return (
    <ScrollView className="bg-[#E6F8F1] flex-1">
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
    </ScrollView>
  );
}
