import { Community } from "@/_sdk";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { getSingleCommunityBySlug } from "@/lib/api/communities";
import { stripHtml } from "@/lib/utils/stripHtml";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { Image, ScrollView, View } from "react-native";
import WebView from "react-native-webview";

export default function AboutSingleCommunity() {
  const params = useLocalSearchParams();
  const { slug, communityId } = params;
  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!communityId) {
      console.error("No communityId provided in params");
      setLoading(false);
      return;
    }

    const fetchCommunityData = async () => {
      try {
        // const res = await communityApi.communityBySlugName({
        //   slugName: Array.isArray(slug) ? slug[0] : slug,
        // });
        const res = await getSingleCommunityBySlug(
          Array.isArray(slug) ? slug[0] : slug
        );
        if (res) {
          setCommunityData(res);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCommunityData();
  }, [communityId]);

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center">
        <Center className="flex-1">
          <Spinner color="green" size="large" />
          <Text size="md">Please Wait...</Text>
        </Center>
      </View>
    );
  }

  // if (!communityData) {
  //   return (
  //     <View className="flex-1 items-center justify-center bg-white">
  //       <Text className="text-lg text-red-500">Community not found</Text>
  //     </View>
  //   );
  // }

  // const createdAt = communityData.createdAt
  //   ? format(new Date(communityData.createdAt), "MMM d, yyyy")
  //   : "Unknown date";

  return (
    <ScrollView className="bg-white">
      <View className="w-full h-60 overflow-hidden">
        <Image
          source={{ uri: communityData?.image }}
          className="w-full h-full"
          resizeMode="cover"
        />
      </View>
      <View className="p-4">
        <View className="flex-row justify-between items-start mb-2">
          <Text className="text-2xl font-bold flex-1 mr-2">
            {communityData?.title}
          </Text>
          <View className="bg-green-100 px-2 py-1 rounded-full">
            <Text className="text-green-800 text-xs font-medium">
              {communityData?.status}
            </Text>
          </View>
        </View>
        {communityData?.featured && (
          <View className="bg-amber-100 self-start px-2 py-1 rounded-full mb-3">
            <Text className="text-amber-800 text-xs font-medium">
              Featured Community
            </Text>
          </View>
        )}
        {/* <Text className="text-gray-500 text-sm mb-4">
          Created on {createdAt}
        </Text> */}
        <View className="mb-6">
          <Text className="text-base">
            {stripHtml(communityData?.description ?? "")}
          </Text>
        </View>
        {communityData?.interests && communityData.interests.length > 0 && (
          <View className="mb-6">
            <Text className="font-bold text-lg mb-2">Community Interests</Text>
            <View className="flex-row flex-wrap">
              {communityData.interests.map((interest, index) => (
                <View
                  key={index}
                  className="bg-purple-100 px-3 py-1 rounded-full mr-2 mb-2"
                >
                  <Text className="text-purple-800">{interest}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {communityData?.rules && (
          <View className="mb-6">
            <Text className="font-bold text-lg mb-2">Community Rules</Text>
            <WebView
              originWhitelist={["*"]}
              source={{ html: communityData.rules }}
              style={{ height: 200, width: "100%" }}
              scrollEnabled={true}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={true}
              scalesPageToFit={true}
              mixedContentMode="always"
              bounces={false}
              overScrollMode="always"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}
      </View>
    </ScrollView>
  );
}
