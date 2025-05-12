export type UserPreference = {
  language?: string;
  timezone?: string;
  interests?: string[];
  isCertifiedAdvisor?: boolean;
  bio?: string;
  displayName?: string;
  photoURL?: string;
  userId?: string;
};

export type FinfluenceProfile = {
    communities: string[];
    website: string;
    selectedPersonality: string;
    industry: string;
    bio: string;
    phoneNumber: string;
    interests: string[];
    country: string;
    jobTitle: string;
    userId: string;
    photoURL: string;
    finfluencer: boolean;
    subscribePrice: number;
    hasStore: boolean;
    displayName: string;
    isFinfluencer: boolean;
    social: {
        twitter: string;
        website: string;
        linkedin: string;
        instagram: string;
        youtube: string;
    };
    backgroundImage: string;
};
