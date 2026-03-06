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

interface ParticipantProfile {
  userId: string;
  name: string;
  pic: string;
}

interface ConversationWithProfile extends Conversation {
  otherUserId: string;
  otherUserName: string;
  otherUserPic: string;
  participantProfiles: ParticipantProfile[];
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
      // For each conversation, fetch profiles for ALL non-self participants
      const enriched = await Promise.all(
        convs.map(async (conv) => {
          const otherParticipants = conv.participants.filter((p) => p !== session.uid);

          const participantProfiles: ParticipantProfile[] = await Promise.all(
            otherParticipants.map(async (userId) => {
              try {
                const profile = await getUserProfile(userId);
                return {
                  userId,
                  name: profile?.displayName ?? "User",
                  pic: profile?.photoURL ?? "",
                };
              } catch {
                return { userId, name: "User", pic: "" };
              }
            })
          );

          return {
            ...conv,
            otherUserId: otherParticipants[0] ?? "",
            otherUserName: participantProfiles[0]?.name ?? "User",
            otherUserPic: participantProfiles[0]?.pic ?? "",
            participantProfiles,
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

  const AVATAR_SIZE = 34;
  const OVERLAP = 22; // how far each avatar shifts right

  const renderItem = ({ item }: { item: ConversationWithProfile }) => {
    const shown = item.participantProfiles.slice(0, 3);
    const extra = item.participantProfiles.length - 3;
    // total width: first avatar full width + each additional offset + extra badge offset
    const stackWidth =
      AVATAR_SIZE + (shown.length - 1) * OVERLAP + (extra > 0 ? OVERLAP : 0) + 4;

    const displayTitle =
      item.title ||
      (item.participantProfiles.length === 1
        ? item.participantProfiles[0].name
        : item.participantProfiles.map((p) => p.name).join(", "));

    return (
      <TouchableOpacity
        className="flex-row items-center px-4 py-4 border-b border-gray-500"
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
        {/* ── Avatar stack ── */}
        <View
          style={{
            width: stackWidth,
            height: AVATAR_SIZE,
            marginRight: 12,
            position: "relative",
          }}
        >
          {shown.map((p, i) => (
            <View
              key={p.userId}
              style={{
                position: "absolute",
                left: i * OVERLAP,
                top: 0,
                zIndex: shown.length - i,
                borderRadius: AVATAR_SIZE / 2,
                borderWidth: 2,
                borderColor: Colors.light.tint,
              }}
            >
              <Avatar size="sm">
                <AvatarFallbackText>{p.name}</AvatarFallbackText>
                <AvatarImage source={{ uri: p.pic }} />
              </Avatar>
            </View>
          ))}

          {extra > 0 && (
            <View
              style={{
                position: "absolute",
                left: shown.length * OVERLAP,
                top: 0,
                zIndex: 0,
                width: AVATAR_SIZE,
                height: AVATAR_SIZE,
                borderRadius: AVATAR_SIZE / 2,
                backgroundColor: "#d1d5db",
                alignItems: "center",
                justifyContent: "center",
                borderWidth: 2,
                borderColor: Colors.light.tint,
              }}
            >
              <Text style={{ fontSize: 11, fontWeight: "700", color: "#374151" }}>
                +{extra}
              </Text>
            </View>
          )}
        </View>

        {/* ── Text content ── */}
        <View className="flex-1">
          <View className="flex-row justify-between items-center">
            <Text
              className="font-semibold text-gray-900 text-sm"
              numberOfLines={1}
              style={{ flex: 1, marginRight: 8 }}
            >
              {displayTitle}
            </Text>
            <Text className="text-black text-xs">
              {formatTime(item.lastMessageAt)}
            </Text>
          </View>
          <Text className="text-gray-500 text-xs mt-0.5" numberOfLines={1}>
            {item.lastMessageBy === session?.uid ? "You: " : ""}
            {item.lastMessage || "No messages yet"}
          </Text>
        </View>

        <Ionicons name="chevron-forward" size={16} color="#d1d5db" className="ml-2" />
      </TouchableOpacity>
    );
  };

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
    <SafeAreaView className="flex-1 py-16" style={{ backgroundColor: Colors.dark.tint }}>
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
