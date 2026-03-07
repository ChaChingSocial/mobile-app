import useFeaturedPosts from "@/hooks/useSubscribeToPosts";
import React, { forwardRef, useImperativeHandle } from "react";
import {ActivityIndicator, Image, TouchableOpacity} from "react-native";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import NewsfeedList from "./NewsfeedList";

export const MainNewsfeed = forwardRef(function MainNewsfeed(_props, ref: any) {
  const { posts, fetchMorePosts, loading } = useFeaturedPosts();
  useImperativeHandle(ref, () => ({ fetchMore: fetchMorePosts }));

  return (
    <Box className="flex-1">
      <Box className="flex-1">
        <NewsfeedList posts={posts} communityPage={false} />
        {loading && (
            <ActivityIndicator size="small" color="#ffffff" />
        )}
        {/*
        <TouchableOpacity
          className="bg-[#00bf63] rounded-lg p-2 w-36 mx-auto my-6"
          onPress={() => fetchMorePosts()}
          disabled={loading}
        >
          <Text bold className="text-center text-white">
            Load More
          </Text>
        </TouchableOpacity>
        */}
      </Box>
    </Box>
  );
});

export default MainNewsfeed;
