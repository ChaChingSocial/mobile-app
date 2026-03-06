import {
  addParticipantToConversation,
  getOrCreateConversation,
  markMessagesAsRead,
  Message,
  removeParticipantFromConversation,
  sendMessage,
  subscribeToMessages,
  toggleReaction,
  Conversation,
  updateConversationTitle,
  deleteConversation,
} from "@/lib/api/messages";
import { getAllUsers, getUserProfile } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Colors } from "@/lib/constants/Colors";
import { app } from "@/config/firebase";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";
import { doc, getFirestore, getDoc } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
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

// ── Upload helper ─────────────────────────────────────────────────────────────
async function uploadChatMedia(
  localUri: string,
  conversationId: string,
  senderId: string,
  mediaType: "image" | "video"
): Promise<string> {
  const ext = mediaType === "video" ? "mp4" : "jpg";
  const path = `chat-media/${conversationId}/${senderId}_${Date.now()}.${ext}`;
  const storage = getStorage(app);
  const storageRef = ref(storage, path);

  const response = await fetch(localUri);
  const blob = await response.blob();
  await uploadBytes(storageRef, blob);
  return getDownloadURL(storageRef);
}

// ── Media picker action sheet ─────────────────────────────────────────────────
function MediaPickerSheet({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (uri: string, type: "image" | "video") => void;
}) {
  const requestAndPick = async (
    source: "library" | "camera",
    mediaTypes: ImagePicker.MediaType
  ) => {
    onClose();

    const permFn =
      source === "camera"
        ? ImagePicker.requestCameraPermissionsAsync
        : ImagePicker.requestMediaLibraryPermissionsAsync;
    const { status } = await permFn();
    if (status !== "granted") return;

    const pickerFn =
      source === "camera"
        ? ImagePicker.launchCameraAsync
        : ImagePicker.launchImageLibraryAsync;

    const result = await pickerFn({
      mediaTypes,
      quality: 0.85,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets.length > 0) {
      const asset = result.assets[0];
      const isVideo = asset.type === "video";
      onPick(asset.uri, isVideo ? "video" : "image");
    }
  };

  if (!visible) return null;
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        <View style={{ backgroundColor: "white", borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingBottom: 36 }}>
          <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginVertical: 12 }} />
          {[
            { label: "Photo from Library", icon: "image-outline" as const, action: () => requestAndPick("library", "images") },
            { label: "Video from Library", icon: "videocam-outline" as const, action: () => requestAndPick("library", "videos") },
            { label: "Take Photo", icon: "camera-outline" as const, action: () => requestAndPick("camera", "images") },
            { label: "Record Video", icon: "radio-button-on-outline" as const, action: () => requestAndPick("camera", "videos") },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              onPress={item.action}
              style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 24, paddingVertical: 16, gap: 16 }}
            >
              <Ionicons name={item.icon} size={24} color="#1e3a6e" />
              <Text style={{ fontSize: 16, color: "#1f2937" }}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Emoji picker ──────────────────────────────────────────────────────────────
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
      <Pressable style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.25)" }} onPress={onClose}>
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
            <TouchableOpacity key={emoji} onPress={() => onSelect(emoji)} style={{ padding: 6 }}>
              <Text style={{ fontSize: 26 }}>{emoji}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </Pressable>
    </Modal>
  );
}

// ── Full-screen image viewer ──────────────────────────────────────────────────
function ImageViewer({ uri, onClose }: { uri: string; onClose: () => void }) {
  return (
    <Modal transparent animationType="fade" visible onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: "black", justifyContent: "center" }} onPress={onClose}>
        <Image source={{ uri }} style={{ width: "100%", height: "80%" }} resizeMode="contain" />
        <TouchableOpacity
          onPress={onClose}
          style={{ position: "absolute", top: 56, right: 20, backgroundColor: "rgba(0,0,0,0.5)", borderRadius: 20, padding: 8 }}
        >
          <Ionicons name="close" size={22} color="white" />
        </TouchableOpacity>
      </Pressable>
    </Modal>
  );
}

// ── Add user bottom sheet ─────────────────────────────────────────────────────
function AddUserSheet({
  visible,
  onClose,
  onAdd,
  existingParticipantIds,
  currentUserId,
  addingUserId,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (user: any) => void;
  existingParticipantIds: string[];
  currentUserId: string;
  addingUserId: string | null;
}) {
  const [query, setQuery] = useState("");
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      return;
    }
    setLoadingUsers(true);
    getAllUsers()
      .then(setAllUsers)
      .catch(console.error)
      .finally(() => setLoadingUsers(false));
  }, [visible]);

  const filtered = allUsers.filter((u) => {
    const id = u.userId || u.id;
    if (!id || id === currentUserId) return false;
    if (existingParticipantIds.includes(id)) return false;
    const name = (u.displayName || "").toLowerCase();
    return !query || name.includes(query.toLowerCase());
  });

  if (!visible) return null;

  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
        onPress={onClose}
      >
        {/* Inner container — Pressable with no-op to block backdrop close */}
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: "white",
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            paddingBottom: 36,
            maxHeight: "75%",
          }}
        >
          {/* Drag handle */}
          <View style={{ width: 40, height: 4, backgroundColor: "#e5e7eb", borderRadius: 2, alignSelf: "center", marginVertical: 12 }} />

          <Text style={{ fontSize: 17, fontWeight: "700", color: "#1f2937", paddingHorizontal: 20, marginBottom: 12 }}>
            Add People
          </Text>

          {/* Search bar */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginHorizontal: 16,
              backgroundColor: "#f3f4f6",
              borderRadius: 12,
              paddingHorizontal: 12,
              marginBottom: 8,
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
            <ActivityIndicator style={{ marginTop: 32, marginBottom: 32 }} color="#1e3a6e" />
          ) : (
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.userId || item.id || Math.random().toString()}
              keyboardShouldPersistTaps="handled"
              renderItem={({ item }) => {
                const userId = item.userId || item.id;
                const isAdding = addingUserId === userId;
                return (
                  <TouchableOpacity
                    onPress={() => onAdd(item)}
                    disabled={!!addingUserId}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingHorizontal: 20,
                      paddingVertical: 12,
                      gap: 12,
                      opacity: addingUserId && !isAdding ? 0.5 : 1,
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
                    {isAdding ? (
                      <ActivityIndicator size="small" color="#1e3a6e" />
                    ) : (
                      <Ionicons name="add-circle-outline" size={24} color="#1e3a6e" />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={{ alignItems: "center", paddingTop: 32, paddingBottom: 16 }}>
                  <Text style={{ color: "#9ca3af", fontSize: 14 }}>
                    {query ? "No matching users" : "No users to add"}
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

// ── Main screen ───────────────────────────────────────────────────────────────
export default function ChatScreen() {
  const { otherUserId, otherUserName, otherUserPic } = useLocalSearchParams<{
    otherUserId: string;
    otherUserName: string;
    otherUserPic: string;
  }>();
  const { session } = useSession();
  const navigation = useNavigation();
  const router = useRouter();

  const [conversationId, setConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [loading, setLoading] = useState(true);
  const [otherProfile, setOtherProfile] = useState<any>(null);
  const [allParticipants, setAllParticipants] = useState<any[]>([]);
  const [customTitle, setCustomTitle] = useState<string | null>(null);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [addingUserId, setAddingUserId] = useState<string | null>(null);

  // Pending media (picked but not yet sent)
  const [pendingMedia, setPendingMedia] = useState<{
    uri: string;
    type: "image" | "video";
  } | null>(null);

  // UI toggles
  const [mediaSheetVisible, setMediaSheetVisible] = useState(false);
  const [addUserSheetVisible, setAddUserSheetVisible] = useState(false);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [selectedMessageId, setSelectedMessageId] = useState<string | null>(null);
  const [expandedImage, setExpandedImage] = useState<string | null>(null);

  const flatListRef = useRef<FlatList>(null);

  const resolvedName = otherUserName || otherProfile?.displayName || "User";
  const resolvedPic = otherUserPic || otherProfile?.photoURL || "";

  // Build header title from custom title or participant names
  const headerTitle = customTitle || (allParticipants.length > 0
    ? allParticipants.map((p) => p.displayName || p.username || "Unknown").join(", ")
    : resolvedName);

  useEffect(() => {
    navigation.setOptions?.({
      title: headerTitle,
      headerLeft: () => (
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 8, marginLeft: 16 }}
        >
          <Ionicons name="chevron-back" size={24} color="#1e3a6e" />
          <Text style={{ fontSize: 16, color: "#1e3a6e", fontWeight: "500" }}>
            Inbox
          </Text>
        </TouchableOpacity>
      ),
    });
  }, [headerTitle, navigation]);

  // Boot
  useEffect(() => {
    if (!session?.uid || !otherUserId) return;
    (async () => {
      setLoading(true);
      try {
        const [convId, profile] = await Promise.all([
          getOrCreateConversation(session.uid, otherUserId),
          getUserProfile(otherUserId),
        ]);
        setConversationId(convId);
        setOtherProfile(profile ?? null);

        // Fetch the conversation document to get all participants and title
        const db = getFirestore(app);
        const conversationRef = doc(db, "conversations", convId);
        const conversationSnap = await getDoc(conversationRef);

        if (conversationSnap.exists()) {
          const convData = conversationSnap.data() as Conversation;
          setCustomTitle(convData.title ?? null);

          // Fetch profiles for all participants
          const participantProfiles = await Promise.all(
            convData.participants.map(async (participantId) => {
              try {
                const participantProfile = await getUserProfile(participantId);
                return participantProfile
                  ? { ...participantProfile, userId: participantId }
                  : { userId: participantId, displayName: "Unknown" };
              } catch (e) {
                console.error(`Error fetching profile for participant ${participantId}:`, e);
                return { userId: participantId, displayName: "Unknown" };
              }
            })
          );
          setAllParticipants(participantProfiles);
        }
      } catch (e) {
        console.error("Error in chat boot:", e);
      } finally {
        setLoading(false);
      }
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

  // Auto-scroll
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  // ── Send ──────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if ((!inputText.trim() && !pendingMedia) || !conversationId || !session?.uid) return;

    setSending(true);
    const text = inputText;
    const media = pendingMedia;
    setInputText("");
    setPendingMedia(null);

    try {
      let uploadedMedia: { mediaUrl: string; mediaType: "image" | "video" } | undefined;

      if (media) {
        setUploading(true);
        let tick = 0;
        const timer = setInterval(() => {
          tick = Math.min(tick + 12, 90);
          setUploadProgress(tick);
        }, 200);

        try {
          const url = await uploadChatMedia(media.uri, conversationId, session.uid, media.type);
          uploadedMedia = { mediaUrl: url, mediaType: media.type };
        } finally {
          clearInterval(timer);
          setUploadProgress(100);
          setTimeout(() => { setUploading(false); setUploadProgress(0); }, 300);
        }
      }

      await sendMessage(conversationId, session.uid, text, uploadedMedia);
    } catch (e) {
      console.error("Error sending message:", e);
      setInputText(text);
      setPendingMedia(media);
    } finally {
      setSending(false);
    }
  };

  // ── Reactions ─────────────────────────────────────────────────────────────
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

  // ── Title management ──────────────────────────────────────────────────────
  const handleSaveTitle = async () => {
    if (!conversationId || !editingTitle.trim()) return;
    try {
      await updateConversationTitle(conversationId, editingTitle);
      setCustomTitle(editingTitle);
      setIsEditingTitle(false);
      setEditingTitle("");
    } catch (e) {
      console.error("Error updating title:", e);
    }
  };

  const handleDeleteConversation = async () => {
    if (!conversationId) return;
    try {
      setDeleting(true);
      await deleteConversation(conversationId);
      navigation.goBack();
    } catch (e) {
      console.error("Error deleting conversation:", e);
      setDeleting(false);
    }
  };

  // ── Participant management ─────────────────────────────────────────────────
  const navigateToUserProfile = (participant: any) => {
    const participantId = participant.userId || participant.id || "";
    if (!participantId || participantId === session?.uid) return;
    router.push({
      pathname: "/(protected)/user-profile",
      params: {
        id: participantId,
        displayName: participant.displayName || participant.username || "User",
        photoURL: participant.photoURL || participant.profilePic || "",
        bio: participant.bio || "",
        interests: JSON.stringify(participant.interests || []),
      },
    });
  };

  const handleRemoveUser = (participantId: string, displayName: string) => {
    if (!conversationId) return;
    Alert.alert(
      "Remove User",
      `Remove ${displayName} from this conversation?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              await removeParticipantFromConversation(conversationId, participantId);
              setAllParticipants((prev) =>
                prev.filter((p) => (p.userId || p.id) !== participantId)
              );
            } catch (e) {
              console.error("Error removing participant:", e);
              Alert.alert("Error", "Failed to remove user. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleAddUser = async (user: any) => {
    if (!conversationId || addingUserId) return;
    const userId = user.userId || user.id;
    setAddingUserId(userId);
    try {
      await addParticipantToConversation(conversationId, userId);
      // Fetch their profile to enrich the local state
      const profile = await getUserProfile(userId);
      const newParticipant = profile
        ? { ...profile, userId }
        : { userId, displayName: user.displayName, photoURL: user.photoURL || "" };
      setAllParticipants((prev) => [...prev, newParticipant]);
      setAddUserSheetVisible(false);
    } catch (e) {
      console.error("Error adding participant:", e);
      Alert.alert("Error", "Failed to add user. Please try again.");
    } finally {
      setAddingUserId(null);
    }
  };

  // ── Render message ────────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderId === session?.uid;
    const reactionSummary = Object.entries(item.reactions ?? {})
      .filter(([, uids]) => uids.length > 0)
      .map(([emoji, uids]) => ({
        emoji,
        count: uids.length,
        iMine: uids.includes(session?.uid ?? ""),
      }));

    const hasText = !!item.text;
    const hasMedia = !!item.mediaUrl;

    return (
      <View
        style={{
          flexDirection: "row",
          marginBottom: reactionSummary.length ? 18 : 8,
          paddingHorizontal: 12,
          justifyContent: isMe ? "flex-end" : "flex-start",
        }}
      >
        {!isMe && (
          <Avatar size="sm" className="mr-2 self-end mb-1">
            <AvatarFallbackText>{resolvedName}</AvatarFallbackText>
            <AvatarImage source={{ uri: resolvedPic }} />
          </Avatar>
        )}

        <View style={{ maxWidth: "72%" }}>
          <Pressable
            onLongPress={() => openPicker(item.id)}
            delayLongPress={350}
            style={{
              backgroundColor: isMe ? "#1e3a6e" : "white",
              borderRadius: 18,
              borderBottomRightRadius: isMe ? 4 : 18,
              borderBottomLeftRadius: isMe ? 18 : 4,
              overflow: "hidden",
              borderWidth: isMe ? 0 : 1,
              borderColor: "#e5e7eb",
              elevation: 1,
            }}
          >
            {/* Media */}
            {hasMedia && item.mediaType === "image" && (
              <TouchableOpacity onPress={() => setExpandedImage(item.mediaUrl!)}>
                <Image
                  source={{ uri: item.mediaUrl }}
                  style={{ width: 220, height: 180 }}
                  resizeMode="cover"
                />
              </TouchableOpacity>
            )}
            {hasMedia && item.mediaType === "video" && (
              <View
                style={{
                  width: 220,
                  height: 150,
                  backgroundColor: "#111827",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Ionicons name="play-circle" size={52} color="rgba(255,255,255,0.85)" />
                <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 12, marginTop: 6 }}>
                  Video
                </Text>
              </View>
            )}

            {/* Text */}
            {hasText && (
              <View style={{ paddingHorizontal: 14, paddingTop: hasMedia ? 8 : 10, paddingBottom: 10 }}>
                <Text style={{ fontSize: 14, color: isMe ? "white" : "#1f2937" }}>
                  {item.text}
                </Text>
              </View>
            )}

            {/* Timestamp */}
            {item.createdAt && (
              <View style={{ paddingHorizontal: 14, paddingBottom: 8, alignItems: isMe ? "flex-end" : "flex-start" }}>
                <Text style={{ fontSize: 10, color: isMe ? "#93c5fd" : "#9ca3af" }}>
                  {item.createdAt.toDate().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </Text>
              </View>
            )}
          </Pressable>

          {/* Reaction pills */}
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
                    <Text style={{ fontSize: 11, marginLeft: 3, color: iMine ? "#1d4ed8" : "#6b7280", fontWeight: "600" }}>
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
      {/* ── Custom header ── */}
      <View
        style={{
          backgroundColor: Colors.dark.tint,
          paddingHorizontal: 16,
          paddingTop: 55,
          paddingBottom: 12,
          flexDirection: "row",
          alignItems: "center",
          gap: 12,
          borderBottomWidth: 1,
          borderBottomColor: "rgba(255,255,255,0.15)",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{ flexDirection: "row", alignItems: "center", gap: 6 }}
        >
          <Ionicons name="chevron-back" size={24} color={Colors.light.tint} />
          <Text style={{ fontSize: 14, color: Colors.light.tint, fontWeight: "600" }}>
            Inbox
          </Text>
        </TouchableOpacity>

        <View style={{ flex: 1 }} />

        {/* Edit title / delete controls */}
        {isEditingTitle ? (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4, maxWidth: 200 }}>
            <TextInput
              style={{
                flex: 1,
                backgroundColor: "white",
                borderRadius: 6,
                paddingHorizontal: 10,
                paddingVertical: 6,
                fontSize: 13,
                color: "#1f2937",
                maxHeight: 40,
              }}
              placeholder="Enter title..."
              placeholderTextColor="#9ca3af"
              value={editingTitle}
              onChangeText={setEditingTitle}
              maxLength={50}
            />
            <TouchableOpacity
              onPress={handleSaveTitle}
              style={{ backgroundColor: "#10b981", borderRadius: 4, padding: 6 }}
            >
              <Ionicons name="checkmark" size={16} color="white" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => { setIsEditingTitle(false); setEditingTitle(""); }}
              style={{ backgroundColor: "#ef4444", borderRadius: 4, padding: 6 }}
            >
              <Ionicons name="close" size={16} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <>
            {/* Title */}
            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: Colors.light.tint,
                textAlign: "center",
                maxWidth: "40%",
              }}
              numberOfLines={1}
            >
              {headerTitle}
            </Text>

            <TouchableOpacity
              onPress={() => { setEditingTitle(customTitle || ""); setIsEditingTitle(true); }}
              style={{ padding: 6 }}
            >
              <Ionicons name="pencil" size={18} color={Colors.light.tint} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() =>
                Alert.alert(
                  "Delete Chat",
                  "Are you sure you want to delete this conversation? This action cannot be undone.",
                  [
                    { text: "Cancel", style: "cancel" },
                    { text: "Delete", style: "destructive", onPress: handleDeleteConversation },
                  ]
                )
              }
              disabled={deleting}
              style={{ padding: 6, opacity: deleting ? 0.5 : 1 }}
            >
              <Ionicons name="trash" size={18} color={deleting ? "#9ca3af" : Colors.light.tint} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {/* ── Participants row ── */}
      {conversationId && (
        <View
          style={{
            backgroundColor: Colors.dark.tint,
            paddingHorizontal: 16,
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: "rgba(255,255,255,0.12)",
          }}
        >
          <FlatList
            data={allParticipants}
            horizontal
            showsHorizontalScrollIndicator={false}
            keyExtractor={(item) => item.userId || item.id || "unknown"}
            renderItem={({ item }) => {
              const participantId = item.userId || item.id || "";
              const isSelf = participantId === session?.uid;
              const displayName = item.displayName || item.username || "User";

              return (
                <View style={{ position: "relative", alignItems: "center", marginRight: 16 }}>
                  {/* Tap avatar/name to view profile */}
                  <TouchableOpacity
                    onPress={() => navigateToUserProfile(item)}
                    activeOpacity={isSelf ? 1 : 0.7}
                    style={{ alignItems: "center" }}
                  >
                    <Avatar size="md" style={{ marginBottom: 4 }}>
                      <AvatarFallbackText>{displayName}</AvatarFallbackText>
                      <AvatarImage source={{ uri: item.photoURL || "" }} />
                    </Avatar>
                    <Text
                      style={{
                        fontSize: 11,
                        color: Colors.light.tint,
                        fontWeight: "500",
                        maxWidth: 60,
                        textAlign: "center",
                      }}
                      numberOfLines={1}
                    >
                      {isSelf ? "You" : displayName}
                    </Text>
                  </TouchableOpacity>

                  {/* Remove badge — absolutely positioned sibling (not nested) */}
                  {!isSelf && (
                    <TouchableOpacity
                      onPress={() => handleRemoveUser(participantId, displayName)}
                      style={{
                        position: "absolute",
                        top: -4,
                        right: 6,
                        backgroundColor: "#ef4444",
                        borderRadius: 9,
                        width: 18,
                        height: 18,
                        alignItems: "center",
                        justifyContent: "center",
                        borderWidth: 1.5,
                        borderColor: Colors.dark.tint,
                        zIndex: 10,
                      }}
                    >
                      <Ionicons name="close" size={10} color="white" />
                    </TouchableOpacity>
                  )}
                </View>
              );
            }}
            ListFooterComponent={
              <View style={{ alignItems: "center" }}>
                <TouchableOpacity
                  onPress={() => setAddUserSheetVisible(true)}
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 22,
                    backgroundColor: "rgba(255,255,255,0.15)",
                    alignItems: "center",
                    justifyContent: "center",
                    borderWidth: 1.5,
                    borderColor: "rgba(255,255,255,0.4)",
                    marginBottom: 4,
                  }}
                >
                  <Ionicons name="person-add-outline" size={18} color={Colors.light.tint} />
                </TouchableOpacity>
                <Text style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Add</Text>
              </View>
            }
          />
        </View>
      )}

      {/* ── Messages ── */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderMessage}
        contentContainerStyle={{ flexGrow: 1, paddingTop: 16, paddingBottom: 10 }}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
            <Ionicons name="chatbubble-outline" size={48} color="#d1d5db" />
            <Text className="text-gray-400 mt-3 text-base">No messages yet</Text>
            <Text className="text-gray-300 text-sm mt-1">Say hi to {resolvedName}!</Text>
          </View>
        }
      />

      {/* Upload progress bar */}
      {uploading && (
        <View style={{ height: 3, backgroundColor: "#e5e7eb" }}>
          <View
            style={{
              height: 3,
              width: `${uploadProgress}%`,
              backgroundColor: "#3b82f6",
            }}
          />
        </View>
      )}

      {/* Pending media preview */}
      {pendingMedia && (
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: "#1e3a6e",
            gap: 10,
          }}
        >
          {pendingMedia.type === "image" ? (
            <Image
              source={{ uri: pendingMedia.uri }}
              style={{ width: 56, height: 56, borderRadius: 8 }}
              resizeMode="cover"
            />
          ) : (
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 8,
                backgroundColor: "#111827",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Ionicons name="videocam" size={24} color="white" />
            </View>
          )}
          <Text style={{ color: "white", fontSize: 13, flex: 1 }} numberOfLines={1}>
            {pendingMedia.type === "image" ? "Photo ready to send" : "Video ready to send"}
          </Text>
          <TouchableOpacity onPress={() => setPendingMedia(null)}>
            <Ionicons name="close-circle" size={22} color={Colors.light.tint} />
          </TouchableOpacity>
        </View>
      )}

      {/* Input bar */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          paddingBottom: Platform.OS === "ios" ? 20 : 15,
          paddingTop: 12,
          backgroundColor: Colors.dark.tint,
          borderTopWidth: 1,
          borderTopColor: "rgba(255,255,255,0.1)",
          gap: 10,
        }}
      >
        {/* Attachment button */}
        <TouchableOpacity
          onPress={() => setMediaSheetVisible(true)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            alignItems: "center",
            justifyContent: "center",
            backgroundColor: Colors.light.tint,
          }}
        >
          <Ionicons name="add" size={22} color="black" />
        </TouchableOpacity>

        <TextInput
          style={{
            flex: 1,
            backgroundColor: Colors.light.tint,
            borderRadius: 22,
            paddingHorizontal: 16,
            paddingVertical: 10,
            fontSize: 14,
            color: "black",
            maxHeight: 100,
          }}
          placeholder="Message..."
          placeholderTextColor="black"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={1000}
          returnKeyType="default"
        />

        {/* Send button */}
        <TouchableOpacity
          onPress={handleSend}
          disabled={sending || uploading || (!inputText.trim() && !pendingMedia)}
          style={{
            width: 38,
            height: 38,
            borderRadius: 19,
            backgroundColor:
              inputText.trim() || pendingMedia ? "white" : Colors.light.tint,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {sending || uploading ? (
            <ActivityIndicator size="small" color={Colors.dark.tint} />
          ) : (
            <Ionicons
              name="send"
              size={17}
              color={Colors.dark.tint}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* ── Modals ── */}
      <MediaPickerSheet
        visible={mediaSheetVisible}
        onClose={() => setMediaSheetVisible(false)}
        onPick={(uri, type) => setPendingMedia({ uri, type })}
      />
      <EmojiPicker
        visible={pickerVisible}
        onSelect={handleReaction}
        onClose={() => { setPickerVisible(false); setSelectedMessageId(null); }}
      />
      <AddUserSheet
        visible={addUserSheetVisible}
        onClose={() => setAddUserSheetVisible(false)}
        onAdd={handleAddUser}
        existingParticipantIds={allParticipants.map((p) => p.userId || p.id || "")}
        currentUserId={session?.uid ?? ""}
        addingUserId={addingUserId}
      />
      {expandedImage && (
        <ImageViewer uri={expandedImage} onClose={() => setExpandedImage(null)} />
      )}
    </KeyboardAvoidingView>
  );
}
