import { Community } from "@/_sdk";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { HStack } from "@/components/ui/hstack";
import { SearchIcon } from "@/components/ui/icon";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { communityApi } from "@/config/backend";
import { getAllCommunities } from "@/lib/api/communities";
import { usePostStore } from "@/lib/store/post";
import { useNavigation, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, TouchableOpacity } from "react-native";

export default function SearchCommunity() {
  const navigate = useNavigation();
  const router = useRouter();

  const routes = navigate.getState()?.routes;
  const prevRoute = routes[routes.length - 2];
  console.log("previous route", prevRoute);

  const setCreatedPostCommunityData = usePostStore(
    (state) => state.setCreatedPostCommunityData
  );

  const [communityData, setCommunityData] = useState<Community[]>([]);
  const [filteredData, setFilteredData] = useState<Community[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [timeoutToClear, setTimeoutToClear] =
    useState<ReturnType<typeof setTimeout>>();

  // console.log("search data", communityData[0]);

  useEffect(() => {
    const fetchCommunityData = async () => {
      setLoading(true);
      try {
        const res = await getAllCommunities();
        if (res) {
          setCommunityData(res);
          setFilteredData(res);
        }
        setLoading(false);
      } catch (error) {
        console.error("Error fetching community data:", error);
        setLoading(false);
      }
    };

    fetchCommunityData();

    return () => {
      if (timeoutToClear) {
        clearTimeout(timeoutToClear);
      }
    };
  }, []);

  const debounce = (
    callback: (text: string) => void,
    alwaysCall: (text: string) => void,
    delay: number
  ) => {
    return (text: string) => {
      alwaysCall(text);
      if (timeoutToClear) {
        clearTimeout(timeoutToClear);
      }
      setTimeoutToClear(
        setTimeout(() => {
          callback(text);
        }, delay)
      );
    };
  };

  const setSearchTextAlways = (text: string) => {
    setSearchText(text);
  };

  const filterCommunities = (text: string) => {
    if (text === "") {
      setFilteredData(communityData);
      return;
    }

    const filtered = communityData.filter(
      ({ data }: { data: Community }) =>
        data.title.toLowerCase().includes(text.toLowerCase()) ||
        (data.description &&
          data.description.toLowerCase().includes(text.toLowerCase()))
    );
    setFilteredData(filtered);
  };

  const debouncedFilterCommunities = debounce(
    filterCommunities,
    setSearchTextAlways,
    300
  );

  return (
    <SafeAreaView className="flex-1 bg-[#2FAE7F] py-3 px-4">
      <Input size="xl" className="mb-4">
        <InputSlot className="pl-3">
          <InputIcon as={SearchIcon} />
        </InputSlot>
        <InputField
          placeholder="Search for a community..."
          onChangeText={debouncedFilterCommunities}
          value={searchText}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </Input>
      <ScrollView className="flex-1">
        <Box className="flex-1">
          {loading ? (
            <Center>
              <Spinner color="green" size="large" />
              <Text size="md">Loading communities...</Text>
            </Center>
          ) : filteredData.length > 0 ? (
            filteredData.map(
              ({ data, id }: { data: Community; id: string }) => (
                <TouchableOpacity
                  key={id}
                  onPress={() => {
                    if (
                      ![
                        "/(protected)/create-post/index",
                        "/(protected)/create-post/new-event-post",
                        "/(protected)/create-post/new-image-post",
                        "/(protected)/create-post/new-link-post",
                        "/(protected)/create-post/new-podcast-post",
                      ].includes(prevRoute?.name)
                    ) {
                      router.push({
                        pathname: "/(protected)/communities/[slug]",
                        params: { slug: data.slug, communityId: id },
                      });
                    } else {
                      setCreatedPostCommunityData(data);
                      navigate.goBack();
                    }
                  }}
                >
                  <HStack className="py-4 px-4 border-b border-gray-300 gap-4">
                    <Avatar size="md">
                      <AvatarFallbackText>
                        {data.title?.charAt(0).toUpperCase()}
                      </AvatarFallbackText>
                      <AvatarImage
                        source={{
                          uri: data.image || "",
                        }}
                        className="object-contain"
                      />
                    </Avatar>
                      <Box className="flex-1">
                      <Text className="font-bold text-lg text-wrap">
                        {data.title}
                      </Text>

                      <Text>{data.members?.length ?? 0} members</Text>

                      {data.description && (
                        <Text className="mt-1 line-clamp-2 leading-6 text-base text-gray-400 text-wrap">
                          {data.description
                            .slice(0, 100)
                            .replace(/<[^>]+>/g, "")}
                          ...
                        </Text>
                      )}

                      {data.requiresPaidSubscription && (
                        <Text className="text-primary-50 mt-2 text-xs">
                          💰 paid subscription required
                        </Text>
                      )}
                    </Box>
                  </HStack>
                </TouchableOpacity>
              )
            )
          ) : (
            <Center className="py-8">
              <Text>No communities found</Text>
            </Center>
          )}
        </Box>
      </ScrollView>
    </SafeAreaView>
  );
}
