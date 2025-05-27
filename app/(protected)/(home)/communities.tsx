import { Community } from "@/_sdk";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { communityApi } from "@/config/backend";
import { useEffect, useState } from "react";
import { StyleSheet } from "react-native";

export default function CommunitiesScreen() {
  const [communityData, setCommunityData] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        const res = await communityApi.communitiesPaged();

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
      {loading && (
        <Center>
          <Spinner color="green" size="large" />
          <Text size="md">Please Wait...</Text>
        </Center>
      )}
      <Box className="flex-1">
        {communityData.length > 0 ? (
          communityData.map((community) => (
            <Box key={community.id} className="p-4 border-b">
              <Text>{community.title}</Text>
            </Box>
          ))
        ) : (
          <Text>No communities found</Text>
        )}
      </Box>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  headerImage: {
    color: "#808080",
    bottom: -90,
    left: -35,
    position: "absolute",
  },
});
