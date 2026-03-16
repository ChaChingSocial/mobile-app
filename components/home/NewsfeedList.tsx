import { usePostStore } from "@/lib/store/post";
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
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
  const { blockedUsers } = useBlockedUsers();
  const prevPostsRef = useRef<Post[]>([]);

  // Memoize featured posts to avoid recalculating on every render
  const featuredPosts = useMemo(() => {
    // Filter out posts from blocked users
    const filteredPosts = posts.filter((item) => {
      return item && !blockedUsers.includes(item.posterUserId);
    });

    // On community pages, show all filtered posts, otherwise show only featured
    return communityPage ? filteredPosts : filteredPosts.filter((item) => item.featured);
  }, [posts, communityPage, blockedUsers]);

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
      {featuredPosts.map((item, index) => (
        <PostComponent key={Math.random()} post={item} />
      ))}
    </Box>
  );
});

export default NewsfeedList;
