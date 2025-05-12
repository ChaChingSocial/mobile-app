import useFeaturedPosts from "@/hooks/useSubscribeToPosts";
import { useCommunityStore } from "@/lib/store/community";
import { FontAwesome5 } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Image, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { Fab } from "../ui/fab";
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

  return (
    <Box>
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

      <Fab
        size="lg"
        placement="bottom right"
        isHovered={true}
        isDisabled={false}
        isPressed={true}
      >
        {/* <FabIcon
          as={FontAwesome5}
          name="plus"
          size="sm"
          color="white"
          className="text-white"
        /> */}
        <FontAwesome5
          name="plus"
          size={16}
          color="white"
          className="text-white"
        />
      </Fab>
    </Box>
  );
}

export default MainNewsfeed;
