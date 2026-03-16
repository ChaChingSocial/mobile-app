import CommunityCard from "@/components/communities/CommunityCard";
import UserCard from "@/components/communities/UserCard";
import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import { Text } from "@/components/ui/text";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { communityApi } from "@/config/backend";
import { getAllCommunities } from "@/lib/api/communities";
import { getAllUsers } from "@/lib/api/user";
import { useUserStore } from "@/lib/store/user";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, TouchableOpacity, View } from "react-native";
import { useFocusEffect } from "expo-router";
import { HStack } from "@/components/ui/hstack";
import { Colors } from "@/lib/constants/Colors";
import { Ionicons } from "@expo/vector-icons";

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
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();

  const myMemberships = useUserStore((state) => state.userCommunities) as any[];
  const [selectedCommunityId, setSelectedCommunityId] = useState<string | null>(null);
  const [communityMemberIds, setCommunityMemberIds] = useState<Set<string> | null>(null);
  const [communityFilterLoading, setCommunityFilterLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        setLoading(true);

        // Fetch independently so one failure doesn't block the other
        try {
          const communities = await getAllCommunities();
          if (communities) {
            setCommunityData(communities);
            setFilteredCommunities(communities);
          }
        } catch (err) {
          console.error("Error fetching communities:", err);
        }

        try {
          const users = await getAllUsers();
          if (users) {
            setUserData(users);
            setFilteredUsers(users);
          }
        } catch (err) {
          console.error("Error fetching users:", err);
        }

        setLoading(false);
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

  const filterUsers = (text: string, memberIds: Set<string> | null = communityMemberIds) => {
    let base = memberIds
      ? userData.filter((u: any) => memberIds.has(u.userId))
      : userData;

    if (text !== "") {
      base = base.filter(
        (user: any) =>
          user.displayName?.toLowerCase().includes(text.toLowerCase()) ||
          user.bio?.toLowerCase().includes(text.toLowerCase()) ||
          user.interests?.some((interest: string) =>
            interest.toLowerCase().includes(text.toLowerCase())
          )
      );
    }
    setFilteredUsers(base);
  };

  const handleCommunityFilter = async (communityId: string) => {
    if (selectedCommunityId === communityId) {
      setSelectedCommunityId(null);
      setCommunityMemberIds(null);
      filterUsers(searchText, null);
      return;
    }

    setSelectedCommunityId(communityId);
    setCommunityFilterLoading(true);
    try {
      const members = await communityApi.getCommunityMembers({ communityId });
      const ids = new Set((members as any[]).map((m) => m.userId ?? m.id).filter(Boolean));
      setCommunityMemberIds(ids);
      filterUsers(searchText, ids);
    } catch {
      setSelectedCommunityId(null);
      setCommunityMemberIds(null);
      filterUsers(searchText, null);
    } finally {
      setCommunityFilterLoading(false);
    }
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
    setShowSearchBox(false);
    setSearchText("");
    setFilteredCommunities(communityData);
    setFilteredUsers(userData);
    setSelectedCommunityId(null);
    setCommunityMemberIds(null);
  };

  return (
    <Box className="flex-1" style={{ backgroundColor: Colors.dark.tint }}>
      {/* Floating tabs + optional search */}
      <Box className="absolute top-0 left-0 right-0 z-50 pt-4 pb-2">
        <Box className="mx-4">
          <HStack className="items-center" style={{ gap: 10 }}>
            <TouchableOpacity
              className="flex-1 items-center justify-center"
              style={{
                height: 48,
                borderRadius: 28,
                backgroundColor:
                  activeTab === "communities" ? Colors.light.tint : "rgba(255,255,255,0.14)",
              }}
              onPress={() => switchTab("communities")}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: activeTab === "communities" ? "#111827" : "rgba(255,255,255,0.5)",
                }}
              >
                Communities
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 items-center justify-center"
              style={{
                height: 48,
                borderRadius: 28,
                backgroundColor:
                  activeTab === "users" ? Colors.light.tint : "rgba(255,255,255,0.14)",
              }}
              onPress={() => switchTab("users")}
            >
              <Text
                style={{
                  fontSize: 18,
                  fontWeight: "800",
                  color: activeTab === "users" ? "#111827" : "rgba(255,255,255,0.5)",
                }}
              >
                People
              </Text>
            </TouchableOpacity>
              <TouchableOpacity
                  onPress={() => {
                      if (showSearchBox) {
                          setShowSearchBox(false);
                          handleSearch("");
                      } else {
                          setShowSearchBox(true);
                      }
                  }}
                  style={{
                      width: 48,
                      height: 48,
                      borderRadius: 28,
                      backgroundColor: Colors.light.tint,
                      alignItems: "center",
                      justifyContent: "center",
                  }}
              >
                  <Ionicons name="search" size={24} color="#111827" />
              </TouchableOpacity>
          </HStack>

          {showSearchBox && (
            <HStack className="items-center gap-2 mt-3">
              <Input size="md" className="flex-1 rounded-full bg-white">
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
                  autoFocus
                />
              </Input>
            </HStack>
          )}
        </Box>
      </Box>

      <Box
        className="flex-1 mb-2"
        style={{ backgroundColor: Colors.dark.tint, marginTop: showSearchBox ? 128 : 92 }}
      >
        {activeTab === "communities" ? (
          <FlatList
            data={filteredCommunities}
            refreshing={loading}
            renderItem={({ item }) => (
              <Box className="mb-5">
                <CommunityCard community={{ id: item.id, ...item.data } as any} />
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
            ListHeaderComponent={
              myMemberships.length > 0 ? (
                <View style={{ marginBottom: 12 }}>
                  <HStack className="items-center mb-2 gap-1">
                    <Text className="text-xs text-white font-semibold">
                      Filter by community
                    </Text>
                    {communityFilterLoading && (
                      <ActivityIndicator size="small" color="white" />
                    )}
                  </HStack>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <HStack className="gap-2">
                      {myMemberships.map((c: any) => {
                        const id = c.communityId ?? c.id;
                        const isSelected = selectedCommunityId === id;
                        return (
                          <TouchableOpacity
                            key={id}
                            onPress={() => handleCommunityFilter(id)}
                            style={{
                              paddingHorizontal: 12,
                              paddingVertical: 6,
                              borderRadius: 20,
                              backgroundColor: isSelected ? "white" : "rgba(255,255,255,0.2)",
                              borderWidth: 1,
                              borderColor: isSelected ? "white" : "rgba(255,255,255,0.4)",
                            }}
                          >
                            <Text
                              style={{
                                fontSize: 12,
                                fontWeight: isSelected ? "700" : "400",
                                color: isSelected ? Colors.dark.tint : "white",
                              }}
                            >
                              {c.name ?? c.title}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </HStack>
                  </ScrollView>
                </View>
              ) : null
            }
          />
        )}
      </Box>
    </Box>
  );
}
