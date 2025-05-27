import { Post } from "@/types/post";
import { create } from "zustand";
import { Community } from "@/_sdk";

interface PostState {
  createdPost: Post | null;
  deletedPostId: string;
  createdPostCommunityId: string;
  createdPostCommunityData: Community | null;
  posts: Post[];
  pinPost: { id: string; order: number } | null;
  pinnedPosts: Post[];
  setCreatedPost: (createdPost: Post) => void;
  setDeletedPostId: (deletedPostId: string) => void;
  setCreatedPostCommunityId: (createdPostCommunityId: string) => void;
  setCreatedPostCommunityData: (createdPostCommunityData: Community) => void;
  setPosts: (posts: Post[]) => void;
  setPinPost: (pinPost: { id: string; order: number }) => void;
  setPinnedPosts: (pinnedPosts: Post[]) => void;
}

export const usePostStore = create<PostState>((set) => ({
  createdPost: null,
  deletedPostId: "",
  createdPostCommunityId: "",
  createdPostCommunityData: null,
  posts: [],
  pinPost: null, // Avoids undefined issues
  pinnedPosts: [],
  setCreatedPost: (createdPost) => set({ createdPost }),
  setDeletedPostId: (deletedPostId) => set({ deletedPostId }),
  setCreatedPostCommunityId: (createdPostCommunityId) =>
    set({ createdPostCommunityId }),
  setCreatedPostCommunityData: (createdPostCommunityData) =>
    set({ createdPostCommunityData }),
  setPosts: (posts) => set({ posts }),
  setPinPost: (pinPost) => set({ pinPost }),
  setPinnedPosts: (pinnedPosts) => set({ pinnedPosts: pinnedPosts ?? [] }),
}));
