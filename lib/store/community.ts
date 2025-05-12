import { create } from "zustand";
import { Community, UserInfo } from "@/_sdk";

interface CommunityState {
  communityId: string;
  communityUrlId: string;
  communitiesUserCanPost: string[];
  usersInCommunity: string[];
  inCommunity: boolean;
  isCommunityAdmin: boolean;
  communityAdminProfile: UserInfo | null;
  community: Community | null;
  communitySlug: string | null;
  allCommunities: Community[];
  communitiesOwnedByUserProfile: Community[];
  setCommunityId: (communityId: string) => void;
  setCommunityUrlId: (communityUrlId: string) => void;
  setCommunitiesUserCanPost: (communitiesUserCanPost: string[]) => void;
  setUsersInCommunity: (usersInCommunity: string[]) => void;
  setInCommunity: (inCommunity: boolean) => void;
  setIsCommunityAdmin: (isCommunityAdmin: boolean) => void;
  setCommunity: (community: Community) => void;
  setCommunitySlug: (communitySlug: string | null) => void;
  setCommunityAdminProfile: (communityAdminProfile: UserInfo | null) => void;
  setAllCommunities: (allCommunities: Community[]) => void;
  setCommunitiesOwnedByUserProfile: (
    communitiesOwnedByUserProfile: Community[]
  ) => void;
}

export const useCommunityStore = create<CommunityState>((set) => ({
  communityId: "",
  communityUrlId: "",
  communitiesUserCanPost: [],
  usersInCommunity: [],
  inCommunity: false,
  isCommunityAdmin: false,
  communitySlug: null,
  community: null,
  communityAdminProfile: null,
  allCommunities: [],
  communitiesOwnedByUserProfile: [],
  setCommunityId: (communityId: string) => set({ communityId }),
  setCommunityUrlId: (communityUrlId: string) => set({ communityUrlId }),
  setCommunitiesUserCanPost: (communitiesUserCanPost: string[]) =>
    set({ communitiesUserCanPost }),
  setUsersInCommunity: (usersInCommunity: string[]) =>
    set({ usersInCommunity }),
  setInCommunity: (inCommunity: boolean) => set({ inCommunity }),
  setIsCommunityAdmin: (isCommunityAdmin: boolean) => set({ isCommunityAdmin }),
  setCommunitySlug: (communitySlug: string | null) => set({ communitySlug }),
  setCommunity: (community: Community) => set({ community }),
  setCommunityAdminProfile: (communityAdminProfile: UserInfo | null) =>
    set({ communityAdminProfile }),
  setAllCommunities: (allCommunities: Community[]) => set({ allCommunities }),
  setCommunitiesOwnedByUserProfile: (
    communitiesOwnedByUserProfile: Community[]
  ) => set({ communitiesOwnedByUserProfile }),
}));
