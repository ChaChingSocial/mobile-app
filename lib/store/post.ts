import { Post } from "@/types/post";
import { create } from "zustand";

interface PostState {
  createdPost: Post | null;
  deletedPostId: string;
  createdPostCommunityId: string;
  posts: Post[];
  pinPost: { id: string; order: number } | null;
  pinnedPosts: Post[];
  setCreatedPost: (createdPost: Post) => void;
  setDeletedPostId: (deletedPostId: string) => void;
  setCreatedPostCommunityId: (createdPostCommunityId: string) => void;
  setPosts: (posts: Post[]) => void;
  setPinPost: (pinPost: { id: string; order: number }) => void;
  setPinnedPosts: (pinnedPosts: Post[]) => void;
}

export const usePostStore = create<PostState>((set) => ({
  createdPost: null, // Ensuring it's initialized safely
  deletedPostId: "",
  createdPostCommunityId: "",
  posts: [],
  pinPost: null, // Avoids undefined issues
  pinnedPosts: [],
  setCreatedPost: (createdPost) => set({ createdPost }),
  setDeletedPostId: (deletedPostId) => set({ deletedPostId }),
  setCreatedPostCommunityId: (createdPostCommunityId) =>
    set({ createdPostCommunityId }),
  setPosts: (posts) => set({ posts }),
  setPinPost: (pinPost) => set({ pinPost }),
  setPinnedPosts: (pinnedPosts) => set({ pinnedPosts: pinnedPosts ?? [] }), // Ensures it's always an array
}));
