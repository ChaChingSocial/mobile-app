import { Notification } from "@/_sdk";
import { Text } from "@/components/ui/text";
import React from "react";
import { View } from "react-native";
import { NotificationCard } from "./NotificationCard";

type NotificationSectionProps = {
  title: string;
  notifications: Notification[];
};

export default function NotificationSection({
  title,
  notifications,
}: NotificationSectionProps) {
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
}
