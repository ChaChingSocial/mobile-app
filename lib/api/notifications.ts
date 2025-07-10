import {
  Notification,
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import { notificationApi, pushNotificationApi } from "@/config/backend";

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

    const response = await notificationApi.notify({ notification });

    console.log("Notification sent:", response);

    // Also send push notification
    try {
      await sendPushNotification(userId, notificationMessage, notificationType, entityType);
    } catch (pushError) {
      console.error("Error sending push notification:", pushError);
    }
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

/**
 * Send push notification to user's device
 */
async function sendPushNotification(
  userId: string,
  message: string,
  notificationType: NotificationNotificationTypeEnum,
  entityType: NotificationEntityTypeEnum
) {
  try {
    const title = getNotificationTitle(notificationType);
    

    const pushNotification = {
      userId,
      deviceToken: '', // Backend will look up user's device tokens
      platform: 'ios' as const, // Backend will handle platform detection
      isActive: true,
      createdAt: new Date(),
      deviceTokenId: '', // Backend will generate this
      notification: {
        notificationType,
        entityType,
        notificationMessage: message,
        notificationTitle: title,
        userId,
      },
    };

    const response = await pushNotificationApi.pushNotification({
      pushNotification,
    });

    console.log('Push notification sent successfully:', response);
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Get notification title based on notification type
 */
function getNotificationTitle(notificationType: NotificationNotificationTypeEnum): string {
  switch (notificationType) {
    case NotificationNotificationTypeEnum.Commented:
      return 'New Comment';
    case NotificationNotificationTypeEnum.Liked:
      return 'New Like';
    case NotificationNotificationTypeEnum.EventReminder:
      return 'Event Reminder';
    case NotificationNotificationTypeEnum.CommunityInvite:
      return 'Community Invitation';
    case NotificationNotificationTypeEnum.Tagged:
      return 'You were tagged';
    case NotificationNotificationTypeEnum.Followed:
      return 'New Follower';
    case NotificationNotificationTypeEnum.Oinked:
      return 'New Oink!';
    case NotificationNotificationTypeEnum.Invited:
      return 'New Invitation';
    case NotificationNotificationTypeEnum.Accepted:
      return 'Invitation Accepted';
    case NotificationNotificationTypeEnum.Rejected:
      return 'Invitation Rejected';
    case NotificationNotificationTypeEnum.CommentLiked:
      return 'Comment Liked';
    case NotificationNotificationTypeEnum.Subscribed:
      return 'New Subscription';
    case NotificationNotificationTypeEnum.EventCancelled:
      return 'Event Cancelled';
    case NotificationNotificationTypeEnum.EventRescheduled:
      return 'Event Rescheduled';
    case NotificationNotificationTypeEnum.EventStarted:
      return 'Event Started';
    case NotificationNotificationTypeEnum.EventInvite:
      return 'Event Invitation';
    case NotificationNotificationTypeEnum.CommunityUpdate:
      return 'Community Update';
    case NotificationNotificationTypeEnum.ProductShipped:
      return 'Product Shipped';
    case NotificationNotificationTypeEnum.ProductDelivered:
      return 'Product Delivered';
    case NotificationNotificationTypeEnum.ProductReturned:
      return 'Product Returned';
    case NotificationNotificationTypeEnum.ProductPurchased:
      return 'Product Purchased';
    default:
      return 'New Notification';
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
