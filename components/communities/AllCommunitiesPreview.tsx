import { Community } from "@/_sdk";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { getAllCommunities } from "@/lib/api/communities";
import { useMemo, useState } from "react";
import { Text } from "@/components/ui/text";
import { FlatList, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import {Colors} from "@/lib/constants/Colors";

export default function AllCommunitiesPreview() {
  const router = useRouter();
  const [communityData, setCommunityData] = useState<Community[]>([]);

  useMemo(() => {
    const fetchCommunityData = async () => {
      try {
        const res = await getAllCommunities();
        if (res) {
          setCommunityData(res);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      }
    };

    fetchCommunityData();
  }, []);

  const renderCommunityItem = ({
    item: { data },
  }: {
    item: { data: Community };
  }) => {
    return (
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/(protected)/communities/[slug]",
            params: { title: data?.title, slug: data?.slug, communityId: data?.id, themeLightColor: data?.themeLightColor, themeDarkColor: data?.themeDarkColor },
          });
        }}
        activeOpacity={0.7}
      >
        <Box className="items-center">
          <Avatar size="xl" className="border-2 border-[#7e22ce]">
            <AvatarFallbackText>{data?.title}</AvatarFallbackText>
            <AvatarImage
              source={{
                uri: data?.image,
              }}
            />
          </Avatar>
          <Text size="sm" bold className="mt-2 color-white" numberOfLines={1}>
            {data?.title?.substring(0, 12)}...
          </Text>
        </Box>
      </TouchableOpacity>
    );
  };

  const keyExtractor = (item: Community) => item.id || Math.random().toString();

  return (
    <Box style={{backgroundColor: Colors.dark.tint}}>
      {communityData.length > 0 && (
        <FlatList
          data={communityData}
          renderItem={renderCommunityItem}
          keyExtractor={keyExtractor}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={{ padding: 16, gap: 12 }}
        />
      )}
    </Box>
  );
}
