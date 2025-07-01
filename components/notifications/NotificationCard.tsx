import { Notification } from "@/_sdk";
import {
  AntDesign,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity, View } from "react-native";
import { Text } from "../ui/text";
import HtmlRenderText from "../common/HtmlRenderText";

type NotificationCardProps = {
  notification: Notification;
  showDate?: boolean;
};

export function NotificationCard({
  notification,
  showDate = true,
}: NotificationCardProps) {
  const router = useRouter();

  const getNotificationColor = (type: Notification["notificationType"]) => {
    switch (type) {
      case "PRODUCT_SHIPPED":
      case "PRODUCT_DELIVERED":
      case "FOLLOWED":
      case "SUBSCRIBED":
        return "bg-green-100 border-green-200 text-green-700";

      case "PRODUCT_RETURNED":
      case "EVENT_CANCELLED":
      case "REJECTED":
        return "bg-red-100 border-red-200 text-red-700";

      case "EVENT_REMINDER":
      case "EVENT_STARTED":
      case "EVENT_RESCHEDULED":
        return "bg-yellow-100 border-yellow-200 text-yellow-700";

      case "OINKED":
        return "bg-pink-100 border-pink-200 text-pink-700";

      case "TAGGED":
      case "COMMENTED":
        return "bg-blue-100 border-blue-200 text-blue-700";

      case "INVITED":
        return "bg-green-100 border-green-200 text-green-700";

      case "LIKED":
      case "COMMENT_LIKED":
      case "ACCEPTED":
      case "COMMUNITY_UPDATE":
      case "COMMUNITY_INVITE":
        return "bg-gray-50 border-gray-300 text-gray-800";

      default:
        return "bg-gray-50 border-gray-300 text-gray-800";
    }
  };

  const renderNotificationIcon = (type: Notification["notificationType"]) => {
    const iconProps = {
      size: 20,
      color: "#000",
    };

    switch (type) {
      case "LIKED":
      case "COMMENT_LIKED":
        return <AntDesign name="heart" {...iconProps} color="#EF4444" />;

      case "OINKED":
        return (
          <MaterialCommunityIcons name="pig" {...iconProps} color="#EC4899" />
        );

      case "TAGGED":
      case "COMMENTED":
        return <Feather name="message-circle" {...iconProps} color="#3B82F6" />;

      case "INVITED":
      case "ACCEPTED":
      case "REJECTED":
      case "COMMUNITY_UPDATE":
      case "COMMUNITY_INVITE":
        return <Feather name="users" {...iconProps} color="#10B981" />;

      case "FOLLOWED":
      case "SUBSCRIBED":
        return <Feather name="user-plus" {...iconProps} color="#8B5CF6" />;

      case "EVENT_REMINDER":
      case "EVENT_CANCELLED":
      case "EVENT_RESCHEDULED":
      case "EVENT_STARTED":
        return <MaterialIcons name="event" {...iconProps} color="#F59E0B" />;

      case "PRODUCT_SHIPPED":
      case "PRODUCT_DELIVERED":
      case "PRODUCT_RETURNED":
      case "PRODUCT_PURCHASED":
        return <Feather name="package" {...iconProps} color="#EC4899" />;

      default:
        return <Feather name="bell" {...iconProps} color="#6B7280" />;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const handlePress = () => {
    if (notification.notificationLink) {
      router.push(notification?.notificationLink as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`w-full p-3 mt-3 rounded-lg flex-row items-start ${getNotificationColor(
        notification.notificationType
      )}`}
    >
      <View
        className={`w-10 h-10 rounded-full flex items-center justify-center border ${
          notification.notificationType === "PRODUCT_SHIPPED" ||
          notification.notificationType === "PRODUCT_DELIVERED" ||
          notification.notificationType === "FOLLOWED" ||
          notification.notificationType === "SUBSCRIBED"
            ? "border-green-200"
            : notification.notificationType === "PRODUCT_RETURNED" ||
              notification.notificationType === "EVENT_CANCELLED" ||
              notification.notificationType === "REJECTED"
            ? "border-red-200"
            : notification.notificationType === "EVENT_REMINDER" ||
              notification.notificationType === "EVENT_STARTED" ||
              notification.notificationType === "EVENT_RESCHEDULED"
            ? "border-yellow-200"
            : notification.notificationType === "LIKED" ||
              notification.notificationType === "COMMENT_LIKED"
            ? "border-red-200"
            : notification.notificationType === "OINKED"
            ? "border-pink-200"
            : notification.notificationType === "TAGGED" ||
              notification.notificationType === "COMMENTED"
            ? "border-blue-200"
            : notification.notificationType === "INVITED" ||
              notification.notificationType === "ACCEPTED" ||
              notification.notificationType === "COMMUNITY_UPDATE" ||
              notification.notificationType === "COMMUNITY_INVITE"
            ? "border-green-200"
            : "border-gray-200"
        }`}
      >
        {renderNotificationIcon(notification.notificationType)}
      </View>

      <View className="ml-3 flex-1">
        <Text className="text-sm">
          <HtmlRenderText
            source={
              notification.notificationMessage || "<b>New notification</b>"
            }
          />
        </Text>
        {showDate && notification.createdAt && (
          <Text className="text-xs text-gray-500 mt-1">
            {getTimeAgo(notification.createdAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}
