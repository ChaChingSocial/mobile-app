import CommunityCard from "@/components/communities/CommunityCard";
import UserCard from "@/components/communities/UserCard";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { getAllCommunities } from "@/lib/api/communities";
import { getAllUsers } from "@/lib/api/user";
import { useCallback, useState } from "react";
import { FlatList, TouchableOpacity } from "react-native";
import { useFocusEffect } from "expo-router";
import { HStack } from "@/components/ui/hstack";
import { Colors } from "@/lib/constants/Colors";

type Tab = "communities" | "users";

function ListEmptyComponent({ tab }: { tab: Tab }) {
  return (
    <Box className="gap-5 flex p-4 bg-[#077f5f] mt-16 mb-24">
      <Center>
        <Text className="text-white font-bold text-lg">
          {tab === "communities" ? "No communities found" : "No users found"}
        </Text>
      </Center>
    </Box>
  );
}

export default function CommunitiesScreen() {
  const [activeTab, setActiveTab] = useState<Tab>("communities");

  const [communityData, setCommunityData] = useState<any[]>([]);
  const [filteredCommunities, setFilteredCommunities] = useState<any[]>([]);

  const [userData, setUserData] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const [searchText, setSearchText] = useState("");
  const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [communities, users] = await Promise.all([
            getAllCommunities(),
            getAllUsers(),
          ]);
          if (communities) {
            setCommunityData(communities);
            setFilteredCommunities(communities);
          }
          if (users) {
            setUserData(users);
            setFilteredUsers(users);
          }
        } catch (err) {
          console.error("Error fetching data:", err);
          setError(err);
        } finally {
          setLoading(false);
        }
      };

      fetchData();

      return () => {
        if (timeoutToClear) clearTimeout(timeoutToClear);
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
      if (timeoutToClear) clearTimeout(timeoutToClear);
      setTimeoutToClear(setTimeout(() => callback(text), delay));
    };
  };

  const filterCommunities = (text: string) => {
    if (text === "") {
      setFilteredCommunities(communityData);
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
    setFilteredCommunities(filtered);
  };

  const filterUsers = (text: string) => {
    if (text === "") {
      setFilteredUsers(userData);
      return;
    }
    const filtered = userData.filter(
      (user: any) =>
        user.displayName?.toLowerCase().includes(text.toLowerCase()) ||
        user.bio?.toLowerCase().includes(text.toLowerCase()) ||
        user.interests?.some((interest: string) =>
          interest.toLowerCase().includes(text.toLowerCase())
        )
    );
    setFilteredUsers(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchText(text);
    if (activeTab === "communities") {
      filterCommunities(text);
    } else {
      filterUsers(text);
    }
  };

  const debouncedSearch = debounce(handleSearch, setSearchText, 300);

  const switchTab = (tab: Tab) => {
    setActiveTab(tab);
    setSearchText("");
    setFilteredCommunities(communityData);
    setFilteredUsers(userData);
  };

  return (
    <Box className="flex-1" style={{ backgroundColor: Colors.dark.tint }}>
      {/* Floating search + tabs */}
      <Box className="absolute top-0 left-0 right-0 z-50 pt-2 pb-2">
        <Box className="mx-4 bg-white rounded-lg shadow-lg p-2">
          <HStack className="items-center gap-2">
            <Input size="md" className="flex-1">
              <InputSlot className="pl-3">
                <InputIcon as={SearchIcon} />
              </InputSlot>
              <InputField
                placeholder={
                  activeTab === "communities"
                    ? "Search communities..."
                    : "Search users..."
                }
                onChangeText={debouncedSearch}
                value={searchText}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </Input>
          </HStack>
        </Box>

        {/* Tab switcher */}
        <HStack className="mx-4 mt-2 bg-white rounded-lg overflow-hidden shadow">
          <TouchableOpacity
            className="flex-1 py-2 items-center"
            style={{
              backgroundColor:
                activeTab === "communities" ? Colors.dark.tint : "white",
            }}
            onPress={() => switchTab("communities")}
          >
            <Text
              className="font-semibold text-sm"
              style={{
                color: activeTab === "communities" ? "white" : Colors.dark.tint,
              }}
            >
              Communities
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 py-2 items-center"
            style={{
              backgroundColor:
                activeTab === "users" ? Colors.dark.tint : "white",
            }}
            onPress={() => switchTab("users")}
          >
            <Text
              className="font-semibold text-sm"
              style={{
                color: activeTab === "users" ? "white" : Colors.dark.tint,
              }}
            >
              Users
            </Text>
          </TouchableOpacity>
        </HStack>
      </Box>

      <Box
        className="flex-1 mt-28 mb-2"
        style={{ backgroundColor: Colors.dark.tint }}
      >
        {activeTab === "communities" ? (
          <FlatList
            data={filteredCommunities}
            refreshing={loading}
            renderItem={({ item }) => (
              <Box className="mb-5">
                <CommunityCard community={item.data} />
              </Box>
            )}
            keyExtractor={(item) => item.id}
            ListEmptyComponent={<ListEmptyComponent tab="communities" />}
            style={{ flex: 1, flexDirection: "column", padding: 16 }}
          />
        ) : (
          <FlatList
            data={filteredUsers}
            refreshing={loading}
            renderItem={({ item }) => (
              <Box className="mb-5">
                <UserCard user={item} />
              </Box>
            )}
            keyExtractor={(item) => item.userId}
            ListEmptyComponent={<ListEmptyComponent tab="users" />}
            style={{ flex: 1, flexDirection: "column", padding: 16 }}
          />
        )}
      </Box>
    </Box>
  );
}
