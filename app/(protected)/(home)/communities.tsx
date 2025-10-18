import { Community } from "@/_sdk";
import CommunityCard from "@/components/communities/CommunityCard";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { getAllCommunities } from "@/lib/api/communities";
import { useMemo, useState } from "react";
import { TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { HStack } from "@/components/ui/hstack";

export default function CommunitiesScreen() {
    const [communityData, setCommunityData] = useState<Community[]>([]);
    const [filteredData, setFilteredData] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<unknown>(null);
    const [showSearchBox, setShowSearchBox] = useState(false);
    const [searchText, setSearchText] = useState("");
    const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();
    const router = useRouter();

    useMemo(() => {
        const fetchCommunityData = async () => {
            setLoading(true);
            try {
                const res = await getAllCommunities()
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
                data.tags?.some((tag) =>
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
            {/* Floating search box or search icon - Sticky to top */}
            <Box className="absolute top-0 left-0 right-0 z-50 bg-[#2FAE7F] pt-2 pb-2">
                {showSearchBox ? (
                    <Box className="mx-4 bg-white rounded-lg shadow-lg p-2">
                        <HStack className="items-center gap-2">
                            <TouchableOpacity
                                onPress={() => {
                                    setShowSearchBox(false);
                                    setSearchText("");
                                    setFilteredData(communityData);
                                }}
                            >
                                <Ionicons name="close" size={24} color="black" />
                            </TouchableOpacity>
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
                ) : (
                    <Box className="mr-4 ml-auto bg-white rounded-full p-2 shadow-md" style={{ width: 48 }}>
                        <TouchableOpacity onPressOut={() => setShowSearchBox(true)}>
                            <Ionicons name="search-outline" size={24} color={"black"} />
                        </TouchableOpacity>
                    </Box>
                )}
            </Box>

            <ParallaxScrollView>
                <Box className="bg-[#2FAE7F] flex-1">
                    {loading && (
                        <Center className="flex-1">
                            <Spinner color="green" size="large" />
                            <Text size="md">Please Wait...</Text>
                        </Center>
                    )}
                    <Box className="gap-5 flex p-4 bg-[#2FAE7F] mt-16 mb-24">
                        {filteredData?.length > 0 ? (
                            filteredData.map((community) => (
                                <CommunityCard key={community.id} community={community.data} />
                            ))
                        ) : (
                            <Center>
                                <Text className="text-white">No communities found</Text>
                            </Center>
                        )}
                    </Box>
                </Box>
            </ParallaxScrollView>
        </Box>
    );
}
