import React, { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { getDownloadURL, getStorage, ref, uploadBytes, listAll } from "firebase/storage";
import { updateBackgroundImage } from "@/lib/api/user";

type Props = {
  visible: boolean;
  userId: string;
  currentBanner?: string;
  onClose: () => void;
  onSaved: (url: string) => void;
};

export default function BackgroundImageModal({
  visible,
  userId,
  currentBanner,
  onClose,
  onSaved,
}: Props) {
  const [preview, setPreview] = useState<string | undefined>(currentBanner);
  const [localUri, setLocalUri] = useState<string | null>(null); // local file to upload
  const [presets, setPresets] = useState<string[]>([]);
  const [chosenPreset, setChosenPreset] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // Reset state each time the modal opens
  useEffect(() => {
    if (visible) {
      setPreview(currentBanner);
      setLocalUri(null);
      setChosenPreset(null);
    }
  }, [visible, currentBanner]);

  // Fetch preset bg images from Firebase Storage
  useEffect(() => {
    (async () => {
      try {
        const folderRef = ref(getStorage(), "/app-images/bg-images");
        const result = await listAll(folderRef);
        const urls = await Promise.all(
          result.items.map((item) => getDownloadURL(item))
        );
        setPresets(urls);
      } catch {
        // folder may not exist yet — silently ignore
      }
    })();
  }, []);

  // ── Pick from gallery ────────────────────────────────────────────────────
  const pickFromGallery = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.85,
    });
    if (!result.canceled && result.assets?.length) {
      const uri = result.assets[0].uri;
      setLocalUri(uri);
      setPreview(uri);
      setChosenPreset(null);
    }
  };

  // ── Upload local file to Firebase Storage ────────────────────────────────
  const uploadToStorage = async (uri: string): Promise<string> => {
    const storage = getStorage();
    const filename = `/app-images/bg-images/custom/${userId}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const resp = await fetch(uri);
    const blob = await resp.blob();
    await uploadBytes(storageRef, blob);
    return getDownloadURL(storageRef);
  };

  // ── Save ─────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!preview) return;
    setUploading(true);
    try {
      let finalUrl = preview;

      // If the user picked a local file, upload it first
      if (localUri) {
        finalUrl = await uploadToStorage(localUri);
      }

      await updateBackgroundImage(userId, finalUrl);
      onSaved(finalUrl);
      onClose();
    } catch (err) {
      console.error("Failed to save background image:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-gray-100">
          <TouchableOpacity onPress={onClose} disabled={uploading}>
            <Text className="text-gray-500 text-base">Cancel</Text>
          </TouchableOpacity>
          <Text className="text-gray-900 font-bold text-base">
            Background Image
          </Text>
          <TouchableOpacity onPress={handleSave} disabled={uploading || !preview}>
            {uploading ? (
              <ActivityIndicator size="small" color="#1e3a6e" />
            ) : (
              <Text
                className={`font-bold text-base ${
                  preview ? "text-[#1e3a6e]" : "text-gray-300"
                }`}
              >
                Save
              </Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={{ paddingBottom: 32 }}>
          {/* Preview */}
          <View className="mx-4 mt-4 rounded-xl overflow-hidden bg-gray-100 h-44 items-center justify-center">
            {preview ? (
              <Image
                source={{ uri: preview }}
                className="w-full h-full"
                resizeMode="cover"
              />
            ) : (
              <View className="items-center gap-2">
                <Ionicons name="image-outline" size={36} color="#9ca3af" />
                <Text className="text-gray-400 text-sm">No image selected</Text>
              </View>
            )}
          </View>

          {/* Pick from Gallery */}
          <View className="mx-4 mt-5">
            <Text className="text-gray-700 font-semibold text-sm mb-2">
              Upload your own image
            </Text>
            <TouchableOpacity
              className="border-2 border-dashed border-gray-300 rounded-xl py-5 items-center justify-center flex-row gap-3"
              onPress={pickFromGallery}
              disabled={uploading}
            >
              <Ionicons name="cloud-upload-outline" size={22} color="#6b7280" />
              <Text className="text-gray-500 text-sm">
                Choose from photo library
              </Text>
            </TouchableOpacity>
          </View>

          {/* Preset grid */}
          {presets.length > 0 && (
            <View className="mx-4 mt-6">
              <Text className="text-gray-700 font-semibold text-sm mb-3">
                Or pick a preset
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {presets.map((url) => (
                  <TouchableOpacity
                    key={url}
                    onPress={() => {
                      setChosenPreset(url);
                      setPreview(url);
                      setLocalUri(null);
                    }}
                    className="rounded-lg overflow-hidden"
                    style={{
                      width: "30%",
                      height: 70,
                      borderWidth: chosenPreset === url ? 2 : 1,
                      borderColor: chosenPreset === url ? "#1e3a6e" : "#e5e7eb",
                      borderRadius: 8,
                    }}
                  >
                    <Image
                      source={{ uri: url }}
                      style={{ width: "100%", height: "100%" }}
                      resizeMode="cover"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}
