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
  setCreatedPost: (createdPost: Post) => void;
  setDeletedPostId: (deletedPostId: string) => void;
  setCreatedPostCommunityId: (createdPostCommunityId: string) => void;
  setCreatedPostCommunityData: (createdPostCommunityData: Community) => void;
  setCreatedPostImage: (createdPostImage: Picture[]) => void;
  setCreatedPostVideo: (createdPostVideo: LinkPreview) => void;
  setPosts: (posts: Post[]) => void;
  setPinPost: (pinPost: { id: string; order: number }) => void;
  setPinnedPosts: (pinnedPosts: Post[]) => void;
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
}));
