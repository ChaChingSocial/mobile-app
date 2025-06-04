import { Notification } from "@/_sdk";
import NotificationSection from "@/components/notifications/NotificationSection";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { notificationApi } from "@/config/backend";
import { useSession } from "@/lib/providers/AuthContext";
import React, { useEffect, useState } from "react";
import { View } from "react-native";

export default function NotificationList() {
  const { session: currentUser } = useSession();

  const [notifications, setNotifications] = useState<Notification[]>([]);

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
  );
}
