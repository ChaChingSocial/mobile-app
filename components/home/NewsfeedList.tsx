import { usePostStore } from "@/lib/store/post";
import { Post } from "@/types/post";
import React, { useEffect, useRef, useMemo } from "react";
import { Box } from "../ui/box";
import { PostComponent } from "./PostComponent";

interface NewsfeedListProps {
  posts: Post[];
  communityPage?: boolean;
  isUserCommunityAdmin?: boolean;
}

export const NewsfeedList = React.memo<NewsfeedListProps>(function NewsfeedList({
  posts,
  communityPage,
  isUserCommunityAdmin,
}) {
  const { pinnedPosts, setPinnedPosts } = usePostStore();
  const prevPostsRef = useRef<Post[]>([]);

  // Memoize featured posts to avoid recalculating on every render
  const featuredPosts = useMemo(() => {
    // On community pages, show all provided posts instead of only featured
    return communityPage ? posts : posts.filter((item) => item && item.featured);
  }, [posts, communityPage]);

  useEffect(() => {
    // Skip if posts haven't changed
    if (JSON.stringify(prevPostsRef.current) === JSON.stringify(posts)) return;

    prevPostsRef.current = posts;

    const pinned = posts
      .filter((post) => post.pinPost)
      .sort((a, b) => (a.pinPost?.order || 0) - (b.pinPost?.order || 0));

    setPinnedPosts(pinned);
  }, [posts, setPinnedPosts]);

  return (
    <Box className="p-2">
      {featuredPosts.map((item) => (
        <PostComponent key={item.id || Math.random()} post={item} />
      ))}
    </Box>
  );
});

export default NewsfeedList;
