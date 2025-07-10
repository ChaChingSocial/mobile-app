import {
  Notification,
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import { notificationApi, pushNotificationApi } from "@/config/backend";

/**
 * Sends a notification to a user via the notification API and attempts to deliver a push notification as well.
 *
 * Constructs and sends a notification with the specified details, then triggers a push notification for the user. Errors in either process are logged but do not interrupt the overall flow.
 */
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
 * Sends a push notification to the specified user's device with the given message and notification details.
 *
 * @param userId - The ID of the user to receive the push notification
 * @param message - The message content of the notification
 * @param notificationType - The type of notification to send
 * @param entityType - The entity type associated with the notification
 * @throws Rethrows any error encountered during the push notification API call
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
 * Returns a notification title string corresponding to the given notification type.
 *
 * @param notificationType - The type of notification to generate a title for
 * @returns The title string appropriate for the specified notification type, or "New Notification" if the type is unrecognized
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

/**
 * Sends an email notification to the specified recipients using the provided notification details.
 *
 * @param notificationType - The type of notification to send
 * @param notificationImage - Optional image URL to include in the notification
 * @param notificationTitle - Optional title for the notification email
 * @param notificationLink - Optional link to include in the notification
 * @param notificationMessage - Optional message body for the notification
 * @param entityType - The entity type associated with the notification
 * @param emails - List of recipient email addresses
 */
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
