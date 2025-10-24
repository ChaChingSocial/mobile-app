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
import { SafeAreaView, TouchableOpacity } from "react-native";
import { FlatList } from "react-native-gesture-handler";
import {Ionicons} from "@expo/vector-icons";
import {Fab, FabIcon} from "@/components/ui/fab";

export default function SearchCommunity() {
    const navigate = useNavigation();
    const router = useRouter();

    const routes = navigate.getState()?.routes;
    const prevRoute = routes[routes.length - 2];
    console.log("previous route", prevRoute);
    console.log("previous route name", prevRoute?.name);
    console.log("all routes", routes.map(r => r.name));

    const setCreatedPostCommunityData = usePostStore(
        (state) => state.setCreatedPostCommunityData
    );

    const [communityData, setCommunityData] = useState<Community[]>([]);
    const [filteredData, setFilteredData] = useState<Community[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchText, setSearchText] = useState("");
    const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();
    const [showSearchBox, setShowSearchBox] = useState(false);

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

    const renderCommunityItem = ({ item }: { item: { data: Community; id: string } }) => {
        const { data, id } = item;
        return (
            <TouchableOpacity
                onPress={() => {
                    // Check if coming from any create-post route by examining all routes
                    const allRouteNames = routes.map(r => r.name);
                    const isFromCreatePost = allRouteNames.some(name =>
                        name?.includes('create-post') ||
                        name === 'index' && allRouteNames.some(n => n?.includes('create-post'))
                    );

                    if (!isFromCreatePost) {
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
                <HStack className="py-4 px-2 gap-4 items-start bg-[#2FAE7F]">
                    <Box className="p-4 rounded-xl bg-white w-full">

                        <Avatar size="md">
                            <AvatarFallbackText>
                                {data.title?.charAt(0).toUpperCase()}
                            </AvatarFallbackText>
                            <AvatarImage
                                source={{
                                    uri: data.image || "",
                                }}
                            />
                        </Avatar>
                        <Box>
                            <Text className="font-bold text-lg text-wrap">
                                {data.title}
                            </Text>

                            <Text>{data.members?.length ?? 0} members</Text>

                            {data.description && (
                                <Box>
                                    <Text className="mt-1 line-clamp-2 leading-6 text-base text-gray-400 text-wrap pr-8">
                                        {data.description
                                            .slice(0, 100)
                                            .replace(/<[^>]+>/g, "")}
                                        ...
                                    </Text>
                                </Box>
                            )}

                            {data.requiresPaidSubscription && (
                                <Text className="text-primary-50 mt-2 text-xs">
                                    💰 paid subscription required
                                </Text>
                            )}
                        </Box>
                    </Box>
                </HStack>
            </TouchableOpacity>
        );
    };

    const keyExtractor = (item: { data: Community; id: string }) => item.id || Math.random().toString();

    const renderEmptyComponent = () => (
        <Center className="py-8">
            <Text>No communities found</Text>
        </Center>
    );

    const renderLoadingComponent = () => (
        <Center>
            <Spinner color="green" size="large" />
            <Text size="md">Loading communities...</Text>
        </Center>
    );

    return (
        <Box className="flex-1 bg-[#077f5f]">
            {/* Search box overlay */}
            {showSearchBox && (
                <Box className="absolute top-16 left-0 right-0 z-[9999] pt-12 pb-2">
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
                </Box>
            )}
            {/* Move FAB here, before SafeAreaView */}
            {!showSearchBox && (
                <Box className="absolute top-20 right-4 z-50">
                    <TouchableOpacity
                        onPress={() => setShowSearchBox(true)}
                        className="bg-white rounded-full p-3 shadow-lg"
                        style={{ elevation: 5 }}
                    >
                        <Ionicons name="search-outline" size={24} color="black" />
                    </TouchableOpacity>
                </Box>
            )}
            <Text>
                HELLO
            </Text>

            <SafeAreaView className="flex-1 py-3 px-4">
                {loading ? renderLoadingComponent() : (
                    <FlatList
                        data={filteredData}
                        renderItem={renderCommunityItem}
                        keyExtractor={keyExtractor}
                        showsVerticalScrollIndicator={false}
                        ListEmptyComponent={renderEmptyComponent}
                        contentContainerStyle={{ flexGrow: 1 }}
                    />
                )}
            </SafeAreaView>
        </Box>
    );
}
