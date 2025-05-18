import useFeaturedPosts from "@/hooks/useSubscribeToPosts";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import NewsfeedList from "./NewsfeedList";

export function MainNewsfeed() {
  // const setCommunityId = useCommunityStore((state) => state.setCommunityId);
  // const setInCommunity = useCommunityStore((state) => state.setInCommunity);

  const { posts, fetchMorePosts, loading, hasMore } = useFeaturedPosts();

  // useEffect(() => {
  //   setCommunityId("");
  //   setInCommunity(false);
  // }, []);
  const router = useRouter();

  return (
    <Box className="flex-1">
      <Box className="flex-1">
        <NewsfeedList posts={posts} communityPage={false} />
        {loading && (
          <Image
            source={require("@/assets/images/pig-loading.gif")}
            alt="Loading..."
            resizeMode="contain"
            className="w-full"
          />
        )}
        <TouchableOpacity
          className="bg-[#00bf63] rounded-lg p-2 w-36 mx-auto my-6"
          onPress={() => fetchMorePosts()}
          disabled={loading}
        >
          <Text bold className="text-center text-white">
            Load More
          </Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
}

export default MainNewsfeed;
