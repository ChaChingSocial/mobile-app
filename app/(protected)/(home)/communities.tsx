import { Community } from "@/_sdk";
import CommunityCard from "@/components/communities/CommunityCard";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getAllCommunities } from "@/lib/api/communities";
import { useMemo, useState } from "react";

export default function CommunitiesScreen() {
  const [communityData, setCommunityData] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useMemo(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        // const res = await communityApi.communitiesPaged();
        const res = await getAllCommunities()
        if (res) {
          setCommunityData(res);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching community data:", error);
        setError(error);
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, []);

  return (
    <ParallaxScrollView>
     
      <Box className="bg-[#E6F8F1] flex-1">
        {loading && (
          <Center className="flex-1">
            <Spinner color="green" size="large" />
            <Text size="md">Please Wait...</Text>
          </Center>
        )}
        <Box className="gap-5 flex mt-4 p-4">
          {communityData?.length > 0 ? (
            communityData.map((community) => (
              <CommunityCard key={community.id} community={community.data} />
            ))
          ) : (
            <Text>No communities found</Text>
          )}
        </Box>
      </Box>
    </ParallaxScrollView>
  );
}
