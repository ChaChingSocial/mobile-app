import { Post } from "@/types/post";
import { usePostStore } from "@/lib/store/post";
import { useEffect, useRef, useState } from "react";
import { Box } from "../ui/box";
import { PostComponent } from "./PostComponent";
import { Text } from "../ui/text";

interface NewsfeedListProps {
  posts: Post[];
  communityPage?: boolean;
  isUserCommunityAdmin?: boolean;
}

export function NewsfeedList({
  posts,
  communityPage,
  isUserCommunityAdmin,
}: NewsfeedListProps) {
  // const [newsfeedPosts, setNewsfeedPosts] = useState<Post[]>(posts);
  // const { pinnedPosts, setPinnedPosts } = usePostStore((state) => ({
  //   pinnedPosts: state.pinPost || [], // Ensure pinnedPosts is always an array
  //   setPinnedPosts: state.setPinPost,
  // }));

  // useEffect(() => {
  //   if (posts && posts.length > 0) {
  //     setNewsfeedPosts(posts);
  //     const pinned = posts
  //       .filter((post) => post.pinPost)
  //       .sort((a, b) => a.pinPost!.order - b.pinPost!.order);
  //     setPinnedPosts(pinned);
  //   }
  // }, [posts]);

  // const handleNewPost = (newPost: Post) => {
  //   setNewsfeedPosts((prevPosts) => [newPost, ...prevPosts]);
  // };

  const { pinnedPosts, setPinnedPosts } = usePostStore();
  const prevPostsRef = useRef<Post[]>();

  useEffect(() => {
    // Skip if posts haven't changed
    if (JSON.stringify(prevPostsRef.current) === JSON.stringify(posts)) return;

    prevPostsRef.current = posts;

    const pinned = posts
      .filter((post) => post.pinPost)
      .sort((a, b) => (a.pinPost?.order || 0) - (b.pinPost?.order || 0));

    setPinnedPosts(pinned);
  }, [posts]);

  return (
    <Box className="p-2 sm:p-8">
      {/* <CreatePost onLogin={handleOpenAuthModal} onPost={handleNewPost} /> */}
      {posts.map(
        (item, key) =>
          item && item.featured && <PostComponent key={key} post={item} />
      )}
    </Box>
  );
}

export default NewsfeedList;
