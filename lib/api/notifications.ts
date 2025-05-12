import {
  Notification,
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import { notificationApi } from "@/config/backend";

export async function sendNotification(
  userId: string,
  communityId: string,
  notificationMessage: string,
  notificationType: NotificationNotificationTypeEnum,
  entityType: NotificationEntityTypeEnum
) {
  try {
    const notification = {
      userId,
      communityId,
      notificationMessage,
      notificationType,
      entityType,
    };

    const response = notificationApi.notify({ notification });

    console.log("Notification sent:", response);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

export async function sendNotificationEmail(
  notificationType: NotificationNotificationTypeEnum,
  notificationImage: string = "",
  notificationTitle: string = "",
  notificationLink: string = "",
  notificationMessage: string = "",
  entityType: NotificationEntityTypeEnum,
  emails: string[] = []
) {
  try {
    const notification: Notification = {
      notificationType,
      notificationImage,
      notificationTitle,
      notificationLink,
      notificationMessage,
      entityType,
      emails,
      userId: "0",
    };
    const response = await notificationApi.notifyEmail({ notification });

    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    const data = await response;
    console.log("Notification sent successfully:", data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}
