import React, { useEffect, useState } from "react";
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
import { Ionicons } from "@expo/vector-icons";

import { getAllUsers } from "@/lib/api/user";
import { Avatar, AvatarFallbackText, AvatarImage } from "@/components/ui/avatar";

type AddUserSheetProps = {
    visible: boolean;
    onClose: () => void;
    onAdd: (user: any) => void;
    existingParticipantIds: string[];
    currentUserId: string;
    addingUserId: string | null;
};

export default function AddUserSheet({
                                         visible,
                                         onClose,
                                         onAdd,
                                         existingParticipantIds,
                                         currentUserId,
                                         addingUserId,
                                     }: AddUserSheetProps) {
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

    const useKeyboardAvoiding = filtered.length < 10;

    if (!visible) return null;

    const sheetContent = (
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
            <View
                style={{
                    width: 40,
                    height: 4,
                    backgroundColor: "#e5e7eb",
                    borderRadius: 2,
                    alignSelf: "center",
                    marginVertical: 12,
                }}
            />

            <Text
                style={{
                    fontSize: 17,
                    fontWeight: "700",
                    color: "#1f2937",
                    paddingHorizontal: 20,
                    marginBottom: 12,
                }}
            >
                Add People
            </Text>

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
    );

    return (
        <Modal transparent animationType="slide" visible={visible} onRequestClose={onClose}>
            <Pressable
                style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)", justifyContent: "flex-end" }}
                onPress={onClose}
            >
                {useKeyboardAvoiding ? (
                    <KeyboardAvoidingView
                        behavior={Platform.OS === "ios" ? "padding" : "height"}
                        keyboardVerticalOffset={Platform.OS === "ios" ? 20 : 0}
                    >
                        {sheetContent}
                    </KeyboardAvoidingView>
                ) : (
                    sheetContent
                )}
            </Pressable>
        </Modal>
    );
}
