import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  Share,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import QRCode from "react-native-qrcode-svg";

interface FriendMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username?: string;
}

export default function FriendMeModal({
  isOpen,
  onClose,
  userId,
  username,
}: FriendMeModalProps) {
  const [sharing, setSharing] = useState(false);

  // Generate the deep link for the QR code
  // This should link to the user's profile page
  const deepLink = `chaching://profile/${userId}`;

  const handleShare = async () => {
    try {
      setSharing(true);
      await Share.share({
        message: `Check out my profile on ChaChing! ${deepLink}`,
        title: `${username || "User"}'s ChaChing Profile`,
      });
    } catch (error) {
      console.error("Error sharing:", error);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      {/* Overlay */}
      <View className="flex-1 bg-black/50 justify-center items-center">
        {/* Modal Container */}
        <View className="bg-white rounded-3xl p-8 mx-4 w-full max-w-sm shadow-2xl">
          {/* Header */}
          <View className="flex-row justify-between items-center mb-6">
            <Text className="text-2xl font-bold text-gray-900 flex-1">
              Friend Me
            </Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close-circle-outline" size={28} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {/* Subtitle */}
          <Text className="text-gray-600 text-center mb-8">
            Scan this QR code to follow {username || "this user"} on ChaChing
          </Text>

          {/* QR Code Container */}
          <View className="bg-gray-50 rounded-2xl p-6 items-center justify-center mb-8">
            <QRCode
              value={deepLink}
              size={250}
              color="#1e3a6e"
              backgroundColor="white"
              quietZone={10}
            />
          </View>

          {/* Action Buttons */}
          <View className="gap-3">
            {/* Share Button */}
            <TouchableOpacity
              disabled={sharing}
              onPress={handleShare}
              className="bg-[#1e3a6e] rounded-full px-6 py-4 flex-row items-center justify-center gap-2"
            >
              {sharing ? (
                <ActivityIndicator color="white" />
              ) : (
                <Ionicons name="share-social-outline" size={20} color="white" />
              )}
              <Text className="text-white font-semibold text-base">
                {sharing ? "Sharing..." : "Share Link"}
              </Text>
            </TouchableOpacity>

            {/* Close Button */}
            <TouchableOpacity
              onPress={onClose}
              className="bg-gray-100 rounded-full px-6 py-4"
            >
              <Text className="text-gray-800 font-semibold text-base text-center">
                Done
              </Text>
            </TouchableOpacity>
          </View>

          {/* Helper text */}
          <Text className="text-gray-500 text-xs text-center mt-6">
            Other users can scan this code to view and follow your profile
          </Text>
        </View>
      </View>
    </Modal>
  );
}

