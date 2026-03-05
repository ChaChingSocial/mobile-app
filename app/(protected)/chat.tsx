import {
  getOrCreateConversation,
  markMessagesAsRead,
  Message,
  sendMessage,
  subscribeToMessages,
  toggleReaction,
} from "@/lib/api/messages";
import { getUserProfile } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Colors } from "@/lib/constants/Colors";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
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

const EMOJIS = ["❤️", "😂", "😮", "😢", "👍", "🔥"];

// ── Emoji picker overlay ──────────────────────────────────────────────────────
function EmojiPicker({
  visible,
  onSelect,
  onClose,
}: {
  visible: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }}
        onPress={onClose}
      >
        <View
          style={{
            position: "absolute",
            bottom: 100,
            alignSelf: "center",
            backgroundColor: "white",
            borderRadius: 32,
            paddingHorizontal: 12,
            paddingVertical: 8,
            flexDirection: "row",
            gap: 4,
            shadowColor: "#000",
            shadowOpacity: 0.15,
            shadowRadius: 12,
            elevation: 8,
          }}
        >
          {EMOJIS.map((emoji) => (
            <TouchableOpacity
              key={emoji}
              onPress={() => onSelect(emoji)}
              style={{ padding: 6 }}
            >
              <Text style={{ fontSize: 26 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { otherUserId, otherUserName, otherUserPic } = useLocalSearchParams<{
    otherUserId: string;
    otherUserName: string;
    otherUserPic: string;
  }>();
  const { session } = useSession();
  const navigation = useNavigation();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<any>(null);

  // Reaction picker state
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const resolvedName = otherUserName || otherProfile?.displayName || "User";
  const resolvedPic = otherUserPic || otherProfile?.photoURL || "";

  useEffect(() => {
    navigation.setOptions?.({ title: resolvedName });
  }, [resolvedName]);

  // Boot
  useEffect(() => {
    if (!session?.uid || !otherUserId) return;
    (async () => {
      setLoading(true);
      const [convId, profile] = await Promise.all([
        getOrCreateConversation(session.uid, otherUserId),
        getUserProfile(otherUserId),
      ]);
      setConversationId(convId);
      setOtherProfile(profile ?? null);
      setLoading(false);
    })();
  }, [session?.uid, otherUserId]);

  // Real-time messages
  useEffect(() => {
    if (!conversationId || !session?.uid) return;
    const unsubscribe = subscribeToMessages(conversationId, (msgs) => {
      setMessages(msgs);
      markMessagesAsRead(conversationId, session.uid!);
    });
    return unsubscribe;
  }, [conversationId, session?.uid]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send ──
  const handleSend = async () => {
    if (!inputText.trim() || !conversationId || !session?.uid) return;
    setSending(true);
    const text = inputText;
    setInputText("");
    try {
      await sendMessage(conversationId, session.uid, text);
    } catch (e) {
      console.error("Error sending message:", e);
      setInputText(text);
    } finally {
      setSending(false);
    }
  };

  // ── Reactions ──
  const openPicker = (messageId: string) => {
    setSelectedMessageId(messageId);
    setPickerVisible(true);
  };

  const handleReaction = async (emoji: string) => {
    setPickerVisible(false);
    if (!conversationId || !selectedMessageId || !session?.uid) return;
    try {
      await toggleReaction(conversationId, selectedMessageId, emoji, session.uid);
    } catch (e) {
      console.error("Error toggling reaction:", e);
    }
    setSelectedMessageId(null);
  };

  // ── Render message ──
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === session?.uid;

    // Flatten reactions: [{ emoji, count, iMine }]
    const reactionSummary = Object.entries(item.reactions ?? {})
      .filter(([, uids]) => uids.length > 0)
      .map(([emoji, uids]) => ({
        emoji,
        count: uids.length,
        iMine: uids.includes(session?.uid ?? ""),
      }));

    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: reactionSummary.length ? 18 : 8,
          paddingHorizontal: 12,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {/* Other user avatar */}
        {!isMe && (
          <Avatar size="sm" className="mr-2 self-end mb-1">
            <AvatarFallbackText>{resolvedName}</AvatarFallbackText>
            <AvatarImage source={{ uri: resolvedPic }} />
          </Avatar>
        )}

        {/* Bubble + reactions wrapper */}
        <View style={{ maxWidth: "72%" }}>
          {/* Bubble */}
          <Pressable
            onLongPress={() => openPicker(item.id)}
            delayLongPress={350}
            style={{
              backgroundColor: isMe ? "#1e3a6e" : "white",
              borderRadius: 18,
              borderBottomRightRadius: isMe ? 4 : 18,
              borderBottomLeftRadius: isMe ? 18 : 4,
              paddingHorizontal: 14,
              paddingVertical: 10,
              borderWidth: isMe ? 0 : 1,
              borderColor: "#e5e7eb",
              elevation: 1,
            }}
          >
            <Text style={{ fontSize: 14, color: isMe ? "white" : "#1f2937" }}>
              {item.text}
            </Text>
            {item.createdAt && (
              <Text
                style={{
                  fontSize: 10,
                  marginTop: 3,
                  color: isMe ? "#93c5fd" : "#9ca3af",
                  textAlign: isMe ? "right" : "left",
                }}
              >
                {item.createdAt.toDate().toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            )}
          </Pressable>

          {/* Reaction pills — sit just below the bubble */}
          {reactionSummary.length > 0 && (
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 4,
                marginTop: 4,
                justifyContent: isMe ? "flex-end" : "flex-start",
              }}
            >
              {reactionSummary.map(({ emoji, count, iMine }) => (
                <TouchableOpacity
                  key={emoji}
                  onPress={() => {
                    if (!conversationId || !session?.uid) return;
                    toggleReaction(conversationId, item.id, emoji, session.uid);
                  }}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    backgroundColor: iMine ? "#dbeafe" : "#f3f4f6",
                    borderRadius: 12,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderWidth: iMine ? 1 : 0,
                    borderColor: iMine ? "#93c5fd" : "transparent",
                  }}
                >
                  <Text style={{ fontSize: 13 }}>{emoji}</Text>
                  {count > 1 && (
                    <Text
                      style={{
                        fontSize: 11,
                        marginLeft: 3,
                        color: iMine ? "#1d4ed8" : "#6b7280",
                        fontWeight: "600",
                      }}
                    >
                      {count}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </View>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color={Colors.dark.tint} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: Colors.light.tint }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 80, paddingBottom: 10 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-3 text-base">No messages yet</Text>
            <Text className="text-gray-300 text-sm mt-1">
              Say hi to {resolvedName}!
            </Text>
          </View>
        }
      />

      {/* Input bar */}
      <View
        className="flex-row items-center px-6 pb-8 pt-4 border-t border-gray-200"
        style={{ backgroundColor: Colors.dark.tint }}
      >
        <TextInput
          className="flex-1 bg-gray-100 rounded-full px-4 text-sm text-gray-800 mr-2 py-4"
          placeholder="Message..."
          placeholderTextColor="#9ca3af"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          onSubmitEditing={handleSend}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || !inputText.trim()}
          className={`w-10 h-10 rounded-full items-center justify-center ${
            inputText.trim() ? "bg-white" : "bg-gray-200"
          }`}
        >
          {sending ? (
            <ActivityIndicator size="small" color={Colors.dark.tint} />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? Colors.dark.tint : "#9ca3af"}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* Emoji picker */}
      <EmojiPicker
        visible={pickerVisible}
        onSelect={handleReaction}
        onClose={() => {
          setPickerVisible(false);
          setSelectedMessageId(null);
        }}
      />
    </KeyboardAvoidingView>
  );
}
