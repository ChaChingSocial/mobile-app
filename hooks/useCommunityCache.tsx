import React, { createContext, useContext, useCallback, useRef } from 'react';
import { getSingleCommunityById } from '@/lib/api/communities';

interface CommunityData {
  title: string;
  slug: string;
}

interface CommunityCache {
  [key: string]: CommunityData;
}

interface CommunityCacheContextType {
  getCommunity: (communityId: string) => Promise<CommunityData | null>;
  preloadCommunities: (communityIds: string[]) => Promise<void>;
}

const CommunityCacheContext = createContext<CommunityCacheContextType | null>(null);

export function CommunityCacheProvider({ children }: { children: React.ReactNode }) {
  const cacheRef = useRef<CommunityCache>({});
  const pendingRequestsRef = useRef<{ [key: string]: Promise<CommunityData | null> }>({});

  const getCommunity = useCallback(async (communityId: string): Promise<CommunityData | null> => {
    // Return cached data if available
    if (cacheRef.current[communityId]) {
      return cacheRef.current[communityId];
    }

    // Return pending request if one exists
    if (pendingRequestsRef.current[communityId]) {
      return pendingRequestsRef.current[communityId];
    }

    // Create new request
    const request = fetchCommunityData(communityId);
    pendingRequestsRef.current[communityId] = request;

    try {
      const result = await request;
      if (result) {
        cacheRef.current[communityId] = result;
      }
      return result;
    } finally {
      delete pendingRequestsRef.current[communityId];
    }
  }, []);

  const fetchCommunityData = async (communityId: string): Promise<CommunityData | null> => {
    try {
      const community = await getSingleCommunityById(communityId);
      
      if (community) {
        return {
          title: community.title,
          slug: community.slug,
        };
      }
      return null;
    } catch (error) {
      console.error('Error fetching community data:', error);
      return null;
    }
  };

  const preloadCommunities = useCallback(async (communityIds: string[]): Promise<void> => {
    const promises = communityIds
      .filter(id => !cacheRef.current[id] && !pendingRequestsRef.current[id])
      .map(id => getCommunity(id));
    
    await Promise.all(promises);
  }, [getCommunity]);

  const value: CommunityCacheContextType = {
    getCommunity,
    preloadCommunities,
  };

  return (
    <CommunityCacheContext.Provider value={value}>
      {children}
    </CommunityCacheContext.Provider>
  );
}

export function useCommunityCache() {
  const context = useContext(CommunityCacheContext);
  if (!context) {
    throw new Error('useCommunityCache must be used within a CommunityCacheProvider');
  }
  return context;
}

// Custom hook for individual community data
export function useCommunityData(communityId: string | undefined) {
  const { getCommunity } = useCommunityCache();
  const [community, setCommunity] = React.useState<CommunityData | null>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!communityId) return;

    setLoading(true);
    getCommunity(communityId)
      .then(setCommunity)
      .finally(() => setLoading(false));
  }, [communityId, getCommunity]);

  return { community, loading };
}