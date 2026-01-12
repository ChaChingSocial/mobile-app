import { useEffect, useState } from "react";
import {
  subscribeToPostsByNewsfeedId,
  subscribeToPosts,
  subscribeToPostsByUserId,
  getFeaturedPosts,
} from "@/lib/api/newsfeed";
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import { DocumentSnapshot } from "firebase/firestore";
import { Post } from "@/types/post";

export function useSubscribeToPostsByNewsfeedId(
  newsfeedId: string,
  onPostsUpdate: (posts: Post[]) => void
) {
  return subscribeToPostsByNewsfeedId(newsfeedId, (posts: Post[]) => {
    onPostsUpdate(posts);
  });
}

export function useSubscribeToPosts(onPostsUpdate: (posts: Post[]) => void) {
  useEffect(() => {
    const unsubscribe = subscribeToPosts((posts: Post[]) => {
      onPostsUpdate(posts);
    });

    return () => unsubscribe();
  }, [onPostsUpdate]);
}

export function useSubscribeToPostsByUserId(
  userId: string,
  onPostsUpdate: (posts: Post[]) => void
) {
  subscribeToPostsByUserId(userId, (posts: Post[]) => {
    onPostsUpdate(posts);
    return posts;
  });
}

export default function useFeaturedPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [lastDoc, setLastDoc] = useState<DocumentSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const { blockedUsers } = useBlockedUsers();

  // Initial fetch
  useEffect(() => {
    const fetchInitialPosts = async () => {
      setLoading(true);
      try {
        const { posts: initialPosts, lastDoc: initialLastDoc } =
          await getFeaturedPosts();
        // Filter out posts from blocked users
        const filteredPosts = (initialPosts as Post[]).filter(
          (post) => !blockedUsers.includes(post.posterUserId)
        );
        setPosts(filteredPosts);
        setLastDoc(initialLastDoc);
      } catch (err) {
        console.error("Error fetching initial posts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialPosts();
  }, [blockedUsers]);

  // Fetch more posts
  const fetchMorePosts = async () => {
    if (loading || !lastDoc) return;

    setLoading(true);
    try {
      const { posts: newPosts, lastDoc: newLastDoc } = await getFeaturedPosts(
        lastDoc
      );

      // Filter out posts from blocked users
      const filteredNewPosts = (newPosts as Post[]).filter(
        (post) => !blockedUsers.includes(post.posterUserId)
      );

      if (filteredNewPosts.length === 0) {
        setLastDoc(null); // Reached end
      } else {
        setPosts((prev) => {
          const seen = new Set(prev.map((p) => p.id));
          return [...prev, ...filteredNewPosts.filter((p) => !seen.has(p.id))];
        });
        setLastDoc(newLastDoc);
      }
    } catch (err) {
      console.error("Error fetching more posts:", err);
    } finally {
      setLoading(false);
    }
  };


  return {
    posts,
    loading,
    hasMore: !!lastDoc,
    fetchMorePosts,
  };
}
