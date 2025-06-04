import { Notification } from "@/_sdk";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { notificationApi } from "@/config/backend";
import { useSession } from "@/lib/providers/AuthContext";
import {
  AntDesign,
  Feather,
  MaterialCommunityIcons,
  MaterialIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { TouchableOpacity, View } from "react-native";

export default function NotificationScreen() {
  const { session: currentUser } = useSession();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const router = useRouter();

  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        if (currentUser?.uid) {
          const res = await notificationApi.getNotifications({
            userId: currentUser.uid,
          });
          setNotifications(res);
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, [currentUser]);

  const groupNotificationsByDate = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay());

    const lastTwoDaysNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate >= twoDaysAgo;
    });

    const thisWeekNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate >= startOfWeek && notificationDate < twoDaysAgo;
    });

    const olderNotifications = notifications.filter(({ createdAt }) => {
      const notificationDate = createdAt ? new Date(createdAt) : new Date(0);
      return notificationDate < startOfWeek;
    });

    return {
      lastTwoDays: lastTwoDaysNotifications,
      thisWeek: thisWeekNotifications,
      older: olderNotifications,
    };
  };

  const groupedNotifications = groupNotificationsByDate();

  return (
    <ParallaxScrollView>
      <Box className="flex-1 p-4">
        <NotificationSection
          title="New"
          notifications={groupedNotifications.lastTwoDays}
        />
        <NotificationSection
          title="This week"
          notifications={groupedNotifications.thisWeek}
        />
        <NotificationSection
          title="Earlier"
          notifications={groupedNotifications.older}
        />

        {notifications.length === 0 && (
          <View className="flex items-center justify-between py-16">
            <View className="w-full border-t border-gray-300 my-2" />
            <Text className="text-sm text-gray-500 px-3">
              No notifications yet
            </Text>
            <View className="w-full border-t border-gray-300 my-2" />
          </View>
        )}

        {notifications.length > 0 && (
          <View className="flex items-center justify-between py-16">
            <View className="w-full border-t border-gray-300 my-2" />
            <Text className="text-sm text-gray-500 px-3">
              That's it for now :)
            </Text>
            <View className="w-full border-t border-gray-300 my-2" />
          </View>
        )}
      </Box>
    </ParallaxScrollView>
  );
}

// Notification Section Component
type NotificationSectionProps = {
  title: string;
  notifications: Notification[];
};

const NotificationSection = ({
  title,
  notifications,
}: NotificationSectionProps) => {
  if (notifications.length === 0) return null;

  return (
    <View className="mb-4">
      <Text className="font-semibold text-gray-600 pt-6 pb-2 border-b border-gray-300">
        {title}
      </Text>
      <View className="mt-2">
        {notifications.map((notification, index) => (
          <NotificationCard key={index} notification={notification} />
        ))}
      </View>
    </View>
  );
};

// Notification Card Component
type NotificationCardProps = {
  notification: Notification;
  showDate?: boolean;
};

const NotificationCard = ({
  notification,
  showDate = true,
}: NotificationCardProps) => {
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
      router.push(notification?.notificationLink);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      className={`w-full p-3 mt-3 rounded-lg flex-row items-center ${getNotificationColor(
        notification.notificationType
      )}`}
    >
      <View
        className={`w-8 h-8 rounded-full flex items-center justify-center border ${
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
          {notification.notificationMessage || "New notification"}
        </Text>
        {showDate && notification.createdAt && (
          <Text className="text-xs text-gray-500 mt-1">
            {getTimeAgo(notification.createdAt)}
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
};
