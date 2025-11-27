import CommunityCard from "@/components/communities/CommunityCard";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { getAllCommunities } from "@/lib/api/communities";
import { useCallback, useState } from "react";
import { FlatList } from "react-native";
import { useFocusEffect } from "expo-router";
import { HStack } from "@/components/ui/hstack";

function ListEmptyComponent() {
  return (
    <Box className="gap-5 flex p-4 bg-[#077f5f] mt-16 mb-24">
      <Center>
        <Text className="text-white font-bold text-lg">No communities found</Text>
      </Center>
    </Box>
  );
}


export default function CommunitiesScreen() {
    const [communityData, setCommunityData] = useState<any[]>([]);
    const [filteredData, setFilteredData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const [searchText, setSearchText] = useState("");
    const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();

    useFocusEffect(
      useCallback(() => {
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
            setError(error);
            setLoading(false);
          }
        };

        fetchCommunityData();

        return () => {
          if (timeoutToClear) {
            clearTimeout(timeoutToClear);
          }
        };
      }, [])
    );

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
            ({ data }: { data: any }) =>
                data.title.toLowerCase().includes(text.toLowerCase()) ||
                data.tags?.some((tag: string) =>
                    tag.toLowerCase().includes(text.toLowerCase())
                ) ||
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
      <Box className="flex-1 bg-[#077f5f]">
        {/* Floating search box - Sticky to top */}
          <Box className="absolute top-0 left-0 right-0 z-50 pt-2 pb-2">
            <Box className="mx-4 bg-white rounded-lg shadow-lg p-2">
              <HStack className="items-center gap-2">
                <Input size="md" className="flex-1">
                  <InputSlot className="pl-3">
                    <InputIcon as={SearchIcon} />
                  </InputSlot>
                  <InputField
                    placeholder="Search communities..."
                    onChangeText={debouncedFilterCommunities}
                    value={searchText}
                    autoCapitalize="none"
                    autoCorrect={false}
                    autoFocus
                  />
                </Input>
              </HStack>
            </Box>
          </Box>

        <Box className="bg-[#077f5f] flex-1 mt-16 mb-2">
          <FlatList
            data={filteredData}
            refreshing={loading}
            renderItem={({ item }) => (
              <Box className="mb-5">
                <CommunityCard community={item.data} />
              </Box>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={ListEmptyComponent}
            style={{
              flex: 1,
              flexDirection: "column",
              padding: 16,
            }}
          />
        </Box>
      </Box>
    );
}
