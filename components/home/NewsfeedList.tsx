import { usePostStore } from "@/lib/store/post";
import { Post } from "@/types/post";
import { useEffect, useRef } from "react";
import { Box } from "../ui/box";
import { PostComponent } from "./PostComponent";

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
      {posts
        .slice()
        .slice(0, 2)
        .map(
          (item, key) =>
            item && item.featured && <PostComponent key={key} post={item} />
        )}
    </Box>
  );
}

export default NewsfeedList;
