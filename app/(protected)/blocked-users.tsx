import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import { userApi } from "@/config/backend";
import { User } from "@/_sdk";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Heading } from "@/components/ui/heading";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
} from "react-native";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";

interface BlockedUserInfo extends User {
  id: string;
}

export default function BlockedUsersScreen() {
  const { blockedUsers, unblockUser } = useBlockedUsers();
  const router = useRouter();
  const [blockedUserInfos, setBlockedUserInfos] = useState<BlockedUserInfo[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unblocking, setUnblocking] = useState<string | null>(null);

  const fetchBlockedUsersInfo = async () => {
    try {
      const userInfos = await Promise.all(
        blockedUsers.map(async (userId) => {
          try {
            const userInfo = await userApi.getUserById({ userId });
            return { ...userInfo, id: userId };
          } catch (error) {
            console.error(`Error fetching user ${userId}:`, error);
            return null;
          }
        })
      );
      setBlockedUserInfos(
        userInfos.filter((user) => user !== null) as BlockedUserInfo[]
      );
    } catch (error) {
      console.error("Error fetching blocked users info:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsersInfo();
  }, [blockedUsers]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchBlockedUsersInfo();
  };

  const handleUnblock = async (userId: string) => {
    setUnblocking(userId);
    try {
      const success = await unblockUser(userId);
      if (success) {
        Toast.show({
          type: "success",
          text1: "User unblocked",
          text2: "You can now see their content.",
        });
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to unblock user",
          text2: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error unblocking user:", error);
      Toast.show({
        type: "error",
        text1: "Failed to unblock user",
        text2: "Please try again.",
      });
    } finally {
      setUnblocking(null);
    }
  };

  const renderBlockedUser = ({ item }: { item: BlockedUserInfo }) => (
    <Box className="bg-white rounded-lg p-4 mb-3 shadow-sm">
      <HStack space="md" className="items-center">
        <Avatar size="md">
          <AvatarFallbackText>{item.username}</AvatarFallbackText>
          <AvatarImage source={{ uri: item.profilePic }} />
        </Avatar>
        <VStack className="flex-1">
          <Text bold size="md">
            @{item.username}
          </Text>
          {item.bio && (
            <Text size="sm" className="text-gray-600" numberOfLines={1}>
              {item.bio}
            </Text>
          )}
        </VStack>
        <Button
          size="sm"
          variant="outline"
          onPress={() => handleUnblock(item.id)}
          isDisabled={unblocking === item.id}
        >
          {unblocking === item.id ? (
            <ActivityIndicator size="small" color="#077f5f" />
          ) : (
            <>
              <FontAwesome5
                name="check"
                size={12}
                color="#077f5f"
                style={{ marginRight: 6 }}
              />
              <ButtonText className="text-[#077f5f]">Unblock</ButtonText>
            </>
          )}
        </Button>
      </HStack>
    </Box>
  );

  const renderEmptyState = () => (
    <Box className="items-center justify-center py-16">
      <FontAwesome5 name="ban" size={64} color="#ccc" />
      <Text size="lg" bold className="mt-4 text-gray-600">
        No blocked users
      </Text>
      <Text size="sm" className="mt-2 text-gray-500 text-center px-8">
        When you block users, they will appear here. You won't see their posts
        or comments.
      </Text>
    </Box>
  );

  return (
    <SafeAreaView className="flex-1 bg-[#f5f5f5]">
      <VStack className="flex-1">
        <Box className="bg-[#077f5f] px-4 py-4">
          <HStack space="md" className="items-center">
            <Button
              size="sm"
              variant="link"
              onPress={() => router.back()}
              className="mr-2"
            >
              <FontAwesome5 name="arrow-left" size={20} color="white" />
            </Button>
            <Heading size="xl" className="text-white flex-1">
              Blocked Users
            </Heading>
          </HStack>
          <Text size="sm" className="text-white/80 mt-2">
            {blockedUsers.length}{" "}
            {blockedUsers.length === 1 ? "user" : "users"} blocked
          </Text>
        </Box>

        {loading ? (
          <Box className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#077f5f" />
            <Text className="mt-4 text-gray-600">Loading blocked users...</Text>
          </Box>
        ) : (
          <FlatList
            data={blockedUserInfos}
            renderItem={renderBlockedUser}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ padding: 16 }}
            ListEmptyComponent={renderEmptyState}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
        )}
      </VStack>
    </SafeAreaView>
  );
}
