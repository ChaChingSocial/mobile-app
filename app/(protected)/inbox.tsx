import { Conversation, createGroupConversation, subscribeToConversations } from "@/lib/api/messages";
import { getAllUsers, getUserProfile } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Colors } from "@/lib/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  SafeAreaView,
  ScrollView,
  Text,
  TextInput,
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

interface UserOption {
  userId: string;
  displayName: string;
  photoURL?: string;
  bio?: string;
}

// ── New Chat Modal ─────────────────────────────────────────────────────────────
function NewChatModal({
  visible,
  currentUserId,
  onClose,
  onCreated,
}: {
  visible: boolean;
  currentUserId: string;
  onClose: () => void;
  onCreated: (conversationId: string) => void;
}) {
  const [chatName, setChatName] = useState("");
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<UserOption[]>([]);
  const [selected, setSelected] = useState<UserOption[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [creating, setCreating] = useState(false);

  // Reset and fetch when opened
  useEffect(() => {
    if (!visible) {
      setChatName("");
      setQuery("");
      setSelected([]);
      return;
    }
    setLoadingUsers(true);
    getAllUsers()
      .then((users) =>
        setAllUsers(
          (users as UserOption[]).filter((u) => u.userId !== currentUserId)
        )
      )
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, [visible, currentUserId]);

  const filtered = allUsers.filter((u) => {
    const name = (u.displayName || "").toLowerCase();
    return !query || name.includes(query.toLowerCase());
  });

  const isSelected = (userId: string) =>
    selected.some((u) => u.userId === userId);

  const toggleUser = (user: UserOption) => {
    setSelected((prev) =>
      isSelected(user.userId)
        ? prev.filter((u) => u.userId !== user.userId)
        : [...prev, user]
    );
  };

  const handleCreate = async () => {
    if (selected.length === 0 || !currentUserId) return;
    setCreating(true);
    try {
      const participantIds = selected.map((u) => u.userId);
      const title =
        chatName.trim() ||
        selected.map((u) => u.displayName).join(", ");
      const convId = await createGroupConversation(
        currentUserId,
        participantIds,
        title
      );
      onCreated(convId);
    } catch (e) {
      console.error("Error creating group chat:", e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.45)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
            paddingBottom: 40,
            maxHeight: "85%",
          }}
        >
          {/* Drag handle */}
          <View
            style={{
              width: 40,
              height: 4,
              backgroundColor: "#e5e7eb",
              borderRadius: 2,
              alignSelf: "center",
              marginTop: 12,
              marginBottom: 4,
            }}
          />

          {/* Header */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderBottomWidth: 1,
              borderBottomColor: "#f3f4f6",
            }}
          >
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={{ fontSize: 15, color: "#6b7280" }}>Cancel</Text>
            </TouchableOpacity>
            <Text style={{ fontSize: 17, fontWeight: "700", color: "#1f2937" }}>
              New Chat
            </Text>
            <TouchableOpacity
              onPress={handleCreate}
              disabled={selected.length === 0 || creating}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              {creating ? (
                <ActivityIndicator size="small" color={Colors.dark.tint} />
              ) : (
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color: selected.length === 0 ? "#d1d5db" : Colors.dark.tint,
                  }}
                >
                  Create
                </Text>
              )}
            </TouchableOpacity>
          </View>

          {/* Chat name input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              marginTop: 14,
              backgroundColor: "#f9fafb",
              borderRadius: 12,
              borderWidth: 1,
              borderColor: "#e5e7eb",
              paddingHorizontal: 14,
              paddingVertical: 2,
            }}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={18} color="#9ca3af" />
            <TextInput
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 10, fontSize: 14, color: "#1f2937" }}
              placeholder="Chat name (optional)"
              placeholderTextColor="#9ca3af"
              value={chatName}
              onChangeText={setChatName}
              returnKeyType="done"
            />
            {chatName.length > 0 && (
              <TouchableOpacity onPress={() => setChatName("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selected user chips */}
          {selected.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginTop: 12 }}
              contentContainerStyle={{ paddingHorizontal: 16, gap: 8, flexDirection: "row" }}
            >
              {selected.map((u) => (
                <TouchableOpacity
                  key={u.userId}
                  onPress={() => toggleUser(u)}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: Colors.dark.tint + "18",
                    borderRadius: 20,
                    paddingVertical: 5,
                    paddingLeft: 10,
                    paddingRight: 8,
                    gap: 4,
                  }}
                >
                  <Text style={{ fontSize: 13, color: Colors.dark.tint, fontWeight: "500" }}>
                    {u.displayName}
                  </Text>
                  <Ionicons name="close-circle" size={16} color={Colors.dark.tint} />
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}

          {/* Search bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              marginTop: 12,
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 4,
            }}
          >
            <Ionicons name="search-outline" size={18} color="#9ca3af" />
            <TextInput
              style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 8, fontSize: 14, color: "#1f2937" }}
              placeholder="Search users..."
              placeholderTextColor="#9ca3af"
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery("")}>
                <Ionicons name="close-circle" size={18} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* User list */}
          {loadingUsers ? (
            <ActivityIndicator style={{ marginTop: 32 }} color={Colors.dark.tint} />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.userId}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const checked = isSelected(item.userId);
                return (
                  <TouchableOpacity
                    onPress={() => toggleUser(item)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 11,
                      gap: 12,
                    }}
                  >
                    <Avatar size="sm">
                      <AvatarFallbackText>{item.displayName || "U"}</AvatarFallbackText>
                      <AvatarImage source={{ uri: item.photoURL || "" }} />
                    </Avatar>
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontSize: 14, fontWeight: "600", color: "#1f2937" }}>
                        {item.displayName || "Unknown"}
                      </Text>
                      {item.bio ? (
                        <Text style={{ fontSize: 12, color: "#6b7280" }} numberOfLines={1}>
                          {item.bio}
                        </Text>
                      ) : null}
                    </View>
                    <View
                      style={{
                        width: 22,
                        height: 22,
                        borderRadius: 11,
                        borderWidth: 2,
                        borderColor: checked ? Colors.dark.tint : "#d1d5db",
                        backgroundColor: checked ? Colors.dark.tint : "transparent",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {checked && (
                        <Ionicons name="checkmark" size={13} color="white" />
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 32 }}>
                  <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                    {query ? "No matching users" : "No users found"}
                  </Text>
                </View>
              }
            />
          )}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

// ── Inbox screen ──────────────────────────────────────────────────────────────
export default function InboxScreen() {
  const { session } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [newChatVisible, setNewChatVisible] = useState(false);
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

  const handleChatCreated = (conversationId: string) => {
    setNewChatVisible(false);
    router.push({
      pathname: "/(protected)/chat",
      params: { conversationId },
    });
  };

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
  const OVERLAP = 22;

  const renderItem = ({ item }: { item: ConversationWithProfile }) => {
    const shown = item.participantProfiles.slice(0, 3);
    const extra = item.participantProfiles.length - 3;
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

  const Header = ({ light = false }: { light?: boolean }) => (
    <View
      className="flex-row items-center justify-between px-4 py-3"
      style={{
        borderBottomWidth: 1,
        borderBottomColor: light ? "#e5e7eb" : "rgba(255,255,255,0.2)",
      }}
    >
      <TouchableOpacity
        onPress={() =>
          router.push({
            pathname: "/(protected)/(home)/profile",
            params: { id: currentUserId },
          })
        }
        className="flex-row items-center"
      >
        <Ionicons
          name="chevron-back"
          size={24}
          color={light ? Colors.dark.tint : "white"}
        />
      </TouchableOpacity>
      <Text
        className="text-lg font-bold"
        style={{ color: light ? "#111827" : "white" }}
      >
        Inbox
      </Text>
      <TouchableOpacity
        onPress={() => setNewChatVisible(true)}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Ionicons
          name="create-outline"
          size={24}
          color={light ? Colors.dark.tint : "white"}
        />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-white">
        <Header light />
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator size="large" color={Colors.dark.tint} />
        </View>
        <NewChatModal
          visible={newChatVisible}
          currentUserId={currentUserId}
          onClose={() => setNewChatVisible(false)}
          onCreated={handleChatCreated}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 py-16" style={{ backgroundColor: Colors.dark.tint }}>
      <Header />
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
              Tap the compose icon to start a new conversation
            </Text>
          </View>
        }
      />
      <NewChatModal
        visible={newChatVisible}
        currentUserId={currentUserId}
        onClose={() => setNewChatVisible(false)}
        onCreated={handleChatCreated}
      />
    </SafeAreaView>
  );
}
