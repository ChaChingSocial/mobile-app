import useFeaturedPosts from "@/hooks/useSubscribeToPosts";
import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import NewsfeedList from "./NewsfeedList";

export function MainNewsfeed() {
  const { posts, fetchMorePosts, loading, hasMore } = useFeaturedPosts();
  // const [posts, setPosts] = useState<Post[]>([]);
  // const [loading, setLoading] = useState(false);

  // useEffect(() => {
  //   async function fetchInitialPosts() {
  //     setLoading(true);
  //     try {
  //       const allPosts = await newsfeedApi.getPosts();
  //       setPosts(allPosts);
  //       console.log("Fetched initial posts:", allPosts.length);
  //     } catch (error) {
  //       console.error("Error fetching initial posts:", error);
  //     } finally {
  //       setLoading(false);
  //     }
  //   }

  //   fetchInitialPosts();
  // }, []);

  return (
    <Box className="flex-1">
      <Box className="flex-1">
        <NewsfeedList posts={posts} communityPage={false} />
        {loading && (
          <Image
            source={require("@/assets/images/logo-inverted.png")}
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
