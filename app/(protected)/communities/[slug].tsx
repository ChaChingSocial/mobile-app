import { Community } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import { Text } from "@/components/ui/text";
import { getSingleCommunityBySlug } from "@/lib/api/communities";
import { subscribeToPostsByNewsfeedId } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { stripHtml } from "@/lib/utils/stripHtml";
import { Post } from "@/types/post";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";

export default function SingleCommunity() {
  const params = useLocalSearchParams();
  const { slug, communityId } = params;
  const { session } = useSession();

  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  const fetchCommunityData = async () => {
    try {
      // const res = await communityApi.communityBySlugName({
      //   slugName: Array.isArray(slug) ? slug[0] : slug,
      // });
      const res = await getSingleCommunityBySlug(
        Array.isArray(slug) ? slug[0] : slug
      );
      // console.log("slug comm", res[0]);

      if (res) {
        setCommunityData(res);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  useEffect(() => {
    if (!communityId) {
      console.error("No communityId provided in params");
      return;
    }

    fetchCommunityData();
    subscribeToPostsByNewsfeedId(
      Array.isArray(communityId) ? communityId[0] : communityId,
      setPosts
    );
  }, [communityId]);

  if (!communityData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Center className="flex-1">
          <Spinner color="green" size="large" />
          <Text size="md">Please Wait...</Text>
        </Center>
      </View>
    );
  }

  // const createdAt = communityData.createdAt
  //   ? format(new Date(communityData.createdAt), "MMM d, yyyy")
  //   : "Unknown date";

  return (
    // <SafeAreaView>
      <ScrollView className="bg-[#077f5f] flex-1">
        {communityData.image && (
          <View className="w-full h-60 overflow-hidden">
            <Image
              source={{ uri: communityData.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )}
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold flex-1 mr-2 text-white">
              {communityData.title}
            </Text>
            {/*<View className="bg-green-100 px-2 py-1 rounded-full">*/}
            {/*  <Text className="text-white text-xs font-medium">*/}
            {/*    {communityData.status}*/}
            {/*  </Text>*/}
            {/*</View>*/}
          </View>
          {communityData.featured && (
            <View className="bg-amber-400 self-start px-2 py-1 rounded-full mb-3">
              <Text className="text-green-900 text-xs font-medium">
                Featured Community
              </Text>
            </View>
          )}
          <Text className="text-gray-500 text-sm mb-4">
            {/* Created on {createdAt} */}
          </Text>
            <View className="mb-6">
                <Text className="text-base text-white" numberOfLines={isExpanded ? undefined : 3}>
                    {stripHtml(communityData?.description ?? "")}
                </Text>
                <Text
                    className="text-white mt-2 underline"
                    onPress={() => setIsExpanded(!isExpanded)}
                >
                    {isExpanded ? "Show less" : "Show more"}
                </Text>
            </View>

          {communityData.interests && communityData.interests.length > 0 && (
            <View className="mb-6">
              {/*<Text className="font-bold text-lg mb-2 text-white">*/}
              {/*  Community Interests*/}
              {/*</Text>*/}
              <View className="flex-row flex-wrap">
                {communityData.interests.map((interest, index) => (
                  <View
                    key={index}
                    className="bg-[#a3e4d2] px-3 py-1 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-[#077f5f]">{interest}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        <NewsfeedList
          posts={posts}
          communityPage={true}
          isUserCommunityAdmin={session?.uid === communityData.adminUserId}
        />
      </ScrollView>
    // </SafeAreaView>
  );
}
