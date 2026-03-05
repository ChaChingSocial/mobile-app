import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { fetchFollowers, fetchFollowing, getUserProfile } from "@/lib/api/user";
import { userApi } from "@/config/backend";
import { useRouter } from "expo-router";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";

interface UserItem {
  userId: string;
  displayName?: string;
  photoURL?: string;
  username?: string;
  profilePic?: string;
}

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  initialTab?: "friends" | "following" | "followers";
}

export default function FollowersModal({
  isOpen,
  onClose,
  userId,
  initialTab = "friends",
}: FollowersModalProps) {
  const [activeTab, setActiveTab] = useState<"friends" | "following" | "followers">(initialTab);
  const [loading, setLoading] = useState(false);
  const [friends, setFriends] = useState<UserItem[]>([]);
  const [following, setFollowing] = useState<UserItem[]>([]);
  const [followers, setFollowers] = useState<UserItem[]>([]);
  const router = useRouter();

  useEffect(() => {
    if (isOpen && userId) {
      fetchAllData();
    }
  }, [isOpen, userId]);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [followersRes, followingRes] = await Promise.all([
        fetchFollowers(userId),
        fetchFollowing(userId),
      ]);

      const followerIds = followersRes.docs.map(doc => doc.id);
      const followingIds = followingRes.docs.map(doc => doc.id);

      // Calculate mutual friends
      const mutualIds = followerIds.filter(id => followingIds.includes(id));

      // Fetch user details for all
      const [friendsData, followingData, followersData] = await Promise.all([
        fetchUserDetails(mutualIds),
        fetchUserDetails(followingIds),
        fetchUserDetails(followerIds),
      ]);

      setFriends(friendsData);
      setFollowing(followingData);
      setFollowers(followersData);
    } catch (error) {
      console.error("Error fetching follow data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userIds: string[]): Promise<UserItem[]> => {
    const userDetails = await Promise.all(
      userIds.map(async (id) => {
        try {
          // Try API first
          const apiUser = await userApi.getUserById({ userId: id });
          if (apiUser) {
            return {
              userId: id,
              displayName: apiUser.username,
              photoURL: apiUser.profilePic,
              username: apiUser.username,
              profilePic: apiUser.profilePic,
            };
          }
        } catch (error) {
          console.error(`Error fetching API user ${id}:`, error);
        }

        // Fallback to Firestore
        try {
          const fsProfile = await getUserProfile(id);
          if (fsProfile) {
            return {
              userId: id,
              displayName: fsProfile.displayName,
              photoURL: fsProfile.photoURL,
            };
          }
        } catch (error) {
          console.error(`Error fetching Firestore user ${id}:`, error);
        }

        // Return minimal data if both fail
        return {
          userId: id,
          displayName: "Unknown User",
        };
      })
    );

    return userDetails.filter(user => user !== null) as UserItem[];
  };

  const handleUserPress = (user: UserItem) => {
    onClose();
    router.push({
      pathname: "/(protected)/user-profile",
      params: {
        id: user.userId,
        displayName: user.displayName || user.username,
        photoURL: user.photoURL || user.profilePic,
      },
    });
  };

  const renderUserItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      onPress={() => handleUserPress(item)}
      className="flex-row items-center px-4 py-3 border-b border-gray-100"
    >
      <Avatar size="md" className="mr-3">
        <AvatarFallbackText>{item.displayName || item.username}</AvatarFallbackText>
        <AvatarImage source={{ uri: item.photoURL || item.profilePic }} />
      </Avatar>
      <Text className="text-gray-800 font-semibold text-base flex-1">
        {item.displayName || item.username || "Unknown User"}
      </Text>
      <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
  );

  const getCurrentData = () => {
    switch (activeTab) {
      case "friends":
        return friends;
      case "following":
        return following;
      case "followers":
        return followers;
      default:
        return [];
    }
  };

  const getEmptyMessage = () => {
    switch (activeTab) {
      case "friends":
        return "No mutual friends yet";
      case "following":
        return "Not following anyone yet";
      case "followers":
        return "No followers yet";
      default:
        return "";
    }
  };

  return (
    <Modal
      visible={isOpen}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl h-[80%]">
          {/* Header */}
          <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-200">
            <Text className="text-xl font-bold text-gray-800">Connections</Text>
            <TouchableOpacity onPress={onClose} className="p-2">
              <Ionicons name="close" size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Tabs */}
          <View className="flex-row border-b border-gray-200">
            <TouchableOpacity
              onPress={() => setActiveTab("friends")}
              className={`flex-1 py-4 ${
                activeTab === "friends" ? "border-b-2 border-[#1e3a6e]" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "friends" ? "text-[#1e3a6e]" : "text-gray-500"
                }`}
              >
                Friends ({friends.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("following")}
              className={`flex-1 py-4 ${
                activeTab === "following" ? "border-b-2 border-[#1e3a6e]" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "following" ? "text-[#1e3a6e]" : "text-gray-500"
                }`}
              >
                Following ({following.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => setActiveTab("followers")}
              className={`flex-1 py-4 ${
                activeTab === "followers" ? "border-b-2 border-[#1e3a6e]" : ""
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  activeTab === "followers" ? "text-[#1e3a6e]" : "text-gray-500"
                }`}
              >
                Followers ({followers.length})
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#1e3a6e" />
            </View>
          ) : (
            <FlatList
              data={getCurrentData()}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.userId}
              contentContainerStyle={{ flexGrow: 1 }}
              ListEmptyComponent={
                <View className="flex-1 items-center justify-center py-8">
                  <Text className="text-gray-400 text-base">
                    {getEmptyMessage()}
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
}

