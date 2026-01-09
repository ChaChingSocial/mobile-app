import { LinkPreview, Picture, Post } from "@/types/post";
import { create } from "zustand";
import { Community } from "@/_sdk";
import { Asset } from "expo-media-library";

interface PostState {
  createdPost: Post | null;
  deletedPostId: string;
  createdPostCommunityId: string;
  createdPostCommunityData: Community | null;
  createdPostImage: Picture[] | null;
  createdPostVideo: LinkPreview | null;
  posts: Post[];
  pinPost: { id: string; order: number } | null;
  pinnedPosts: Post[];
  // When true, the create-post screens should not allow changing community
  lockCommunitySelection: boolean;
  setCreatedPost: (createdPost: Post) => void;
  setDeletedPostId: (deletedPostId: string) => void;
  setCreatedPostCommunityId: (createdPostCommunityId: string) => void;
  setCreatedPostCommunityData: (createdPostCommunityData: Community | null) => void;
  setCreatedPostImage: (createdPostImage: Picture[]) => void;
  setCreatedPostVideo: (createdPostVideo: LinkPreview) => void;
  setPosts: (posts: Post[]) => void;
  setPinPost: (pinPost: { id: string; order: number }) => void;
  setPinnedPosts: (pinnedPosts: Post[]) => void;
  setLockCommunitySelection: (lock: boolean) => void;
}

export const usePostStore = create<PostState>((set) => ({
  createdPost: null,
  deletedPostId: "",
  createdPostCommunityId: "",
  createdPostCommunityData: null,
  createdPostImage: [],
  createdPostVideo: null,
  posts: [],
  pinPost: null,
  pinnedPosts: [],
  lockCommunitySelection: false,
  setCreatedPost: (createdPost) => set({ createdPost }),
  setDeletedPostId: (deletedPostId) => set({ deletedPostId }),
  setCreatedPostCommunityId: (createdPostCommunityId) =>
    set({ createdPostCommunityId }),
  setCreatedPostCommunityData: (createdPostCommunityData) =>
    set({ createdPostCommunityData }),
  setCreatedPostImage: (createdPostImage) => set({ createdPostImage }),
  setCreatedPostVideo: (createdPostVideo) => set({ createdPostVideo }),
  setPosts: (posts) => set({ posts }),
  setPinPost: (pinPost) => set({ pinPost }),
  setPinnedPosts: (pinnedPosts) => set({ pinnedPosts: pinnedPosts ?? [] }),
  setLockCommunitySelection: (lock: boolean) => set({ lockCommunitySelection: lock }),
}));
