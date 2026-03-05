import { Conversation, subscribeToConversations } from "@/lib/api/messages";
import { getUserProfile } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Colors } from "@/lib/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  SafeAreaView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";

interface ConversationWithProfile extends Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserPic: string;
}

export default function InboxScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const currentUserId = session?.uid || "";

  useEffect(() => {
    if (!session?.uid) return;

    const unsubscribe = subscribeToConversations(session.uid, async (convs) => {
      // For each conversation, look up the other participant's profile
      const enriched = await Promise.all(
        convs.map(async (conv) => {
          const otherUserId = conv.participants.find((p) => p !== session.uid) ?? "";
          let otherUserName = "User";
          let otherUserPic = "";

          try {
            const profile = await getUserProfile(otherUserId);
            otherUserName = profile?.displayName ?? "User";
            otherUserPic = profile?.photoURL ?? "";
          } catch (_) {}

          return {
            ...conv,
            otherUserId,
            otherUserName,
            otherUserPic,
          };
        })
      );

      setConversations(enriched);
      setLoading(false);
    });

    return unsubscribe;
  }, [session?.uid]);

  const formatTime = (timestamp: any) => {
    if (!timestamp) return "";
    try {
      const date = timestamp.toDate();
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);

      if (diffMins < 1) return "now";
      if (diffMins < 60) return `${diffMins}m`;
      if (diffHours < 24) return `${diffHours}h`;
      if (diffDays < 7) return `${diffDays}d`;
      return date.toLocaleDateString();
    } catch {
      return "";
    }
  };

  const renderItem = ({ item }: { item: ConversationWithProfile }) => (
    <TouchableOpacity
      className="flex-row items-center px-4 py-3 border-b border-gray-500"
      style={{ backgroundColor: Colors.light.tint }}
      onPress={() =>
        router.push({
          pathname: "/(protected)/chat",
          params: {
            otherUserId: item.otherUserId,
            otherUserName: item.otherUserName,
            otherUserPic: item.otherUserPic,
          },
        })
      }
      activeOpacity={0.7}
    >
      <Avatar size="md" className="mr-3">
        <AvatarFallbackText>{item.otherUserName}</AvatarFallbackText>
        <AvatarImage source={{ uri: item.otherUserPic }} />
      </Avatar>

      <View className="flex-1">
        <View className="flex-row justify-between items-center">
          <Text className="font-semibold text-gray-900 text-sm">
            {item.title || item.otherUserName}
          </Text>
          <Text className="text-black text-xs">
            {formatTime(item.lastMessageAt)}
          </Text>
        </View>
        <Text
          className="text-gray-500 text-xs mt-0.5"
          numberOfLines={1}
        >
          {item.lastMessageBy === session?.uid ? "You: " : ""}
          {item.lastMessage || "No messages yet"}
        </Text>
      </View>

      <Ionicons name="chevron-forward" size={16} color="#d1d5db" className="ml-2" />
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-200">
        <TouchableOpacity
          onPress={() => router.push({
            pathname: "/(protected)/(home)/profile",
            params: { id: currentUserId }
          })}
          className="flex-row items-center"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.dark.tint} />
        </TouchableOpacity>
          <Text className="text-lg font-bold text-gray-900">Inbox</Text>
          <View style={{ width: 24 }} />
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: Colors.dark.tint }}>
      <View className="flex-row items-center justify-between px-4 py-3 border-b border-gray-500">
        <TouchableOpacity
          onPress={() => router.push({
            pathname: "/(protected)/(home)/profile",
            params: { id: currentUserId }
          })}
          className="flex-row items-center"
        >
          <Ionicons name="chevron-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-lg font-bold text-white">Inbox</Text>
        <View style={{ width: 24 }} />
      </View>
      <FlatList
        data={conversations}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center mt-32">
            <Ionicons name="chatbubbles-outline" size={56} color="#d1d5db" />
            <Text className="text-gray-400 mt-4 text-base font-medium">
              No messages yet
            </Text>
            <Text className="text-gray-300 text-sm mt-1 text-center px-8">
              Visit someone's profile and tap "Message" to start a conversation
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}
