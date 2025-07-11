import { Platform } from 'react-native';
import { pushNotificationApi } from '@/config/backend';
import { 
  PushNotification, 
  DeviceTokenRegistration,
  DeviceTokenUnregistration,
  NotificationNotificationTypeEnum, 
  NotificationEntityTypeEnum, 
  PushNotificationPlatformEnum 
} from '@/_sdk';
import { registerForPushNotificationsAsync } from './registerForPushNotifications';

/**
 * Get the platform string for the backend
 */
function getPlatformForBackend(): 'ios' | 'android' | 'web' {
  const platform = Platform.OS;
  if (platform === 'ios' || platform === 'android' || platform === 'web') {
    return platform;
  }
  // Default to web for unknown platforms
  return 'web';
}

/**
 * Register device token with the Go backend service
 */
export async function registerDeviceTokenWithBackend(
  userId: string,
  appVersion?: string
): Promise<string | null> {
  try {
    // Get the Expo push token
    const expoPushToken = await registerForPushNotificationsAsync();
    
    if (!expoPushToken) {
      console.error('Failed to get Expo push token');
      return null;
    }

    console.log('Got Expo push token:', expoPushToken);

    // Register the token with the backend
    const deviceInfo: DeviceTokenRegistration = {
      userId,
      deviceToken: expoPushToken,
      platform: getPlatformForBackend(),
      appVersion: appVersion || '1.0.0',
    };

    console.log('Sending device info to backend:', JSON.stringify(deviceInfo, null, 2));

    try {
      const response = await pushNotificationApi.registerDeviceToken({
        deviceTokenRegistration: deviceInfo,
      });

      console.log('Device token registered with backend:', response);
      return expoPushToken;
    } catch (apiError: any) {
      console.error('API Error details:', {
        message: apiError.message,
        status: apiError.status,
        response: apiError.response,
        data: apiError.data,
      });
      
      // Log the full error for debugging
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response headers:', apiError.response.headers);
        console.error('Response data:', apiError.response.data);
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error registering device token with backend:', error);
    throw error;
  }
}

/**
 * Unregister device token from the Go backend service
 */
export async function unregisterDeviceTokenFromBackend(
  userId: string,
  deviceToken: string
): Promise<void> {
  try {
    const deviceInfo: DeviceTokenUnregistration = {
      userId,
      deviceToken,
    };

    const response = await pushNotificationApi.unregisterDeviceToken({
      deviceTokenUnregistration: deviceInfo,
    });

    console.log('Device token unregistered from backend:', response);
  } catch (error) {
    console.error('Error unregistering device token from backend:', error);
    throw error;
  }
}

/**
 * Send a test push notification through the backend
 */
export async function sendTestPushNotification(
  userId: string,
  title: string,
  body: string
): Promise<void> {
  try {
    // Get the current device token
    const expoPushToken = await registerForPushNotificationsAsync();
    
    if (!expoPushToken) {
      throw new Error('No device token available for test notification');
    }

    const testNotification: PushNotification = {
      userId,
      deviceToken: expoPushToken, // Use actual device token
      platform: getPlatformForBackend(),
      isActive: true,
      createdAt: new Date(),
      deviceTokenId: '',
      notification: {
        notificationType: NotificationNotificationTypeEnum.Liked, // Use a more appropriate type
        entityType: NotificationEntityTypeEnum.Post,
        notificationMessage: body,
        notificationTitle: title,
        userId,
      },
      user: {
        id: userId,
        username: `user_${userId.substring(0, 8)}`, // Generate a username from userId
        email: `${userId}@example.com`, // Generate an email
      },
    };

    console.log('Sending test notification to backend:', JSON.stringify(testNotification, null, 2));
    console.log('Platform being sent:', getPlatformForBackend());
    console.log('Device token being sent:', expoPushToken);

    try {
      const response = await pushNotificationApi.testPushNotification({
        pushNotification: testNotification,
      });

      console.log('Test push notification sent:', response);
    } catch (apiError: any) {
      console.error('API Error details:', {
        message: apiError.message,
        status: apiError.status,
        response: apiError.response,
        data: apiError.data,
      });
      
      // Log the full error for debugging
      if (apiError.response) {
        console.error('Response status:', apiError.response.status);
        console.error('Response headers:', apiError.response.headers);
        console.error('Response data:', apiError.response.data);
        console.error('Response text:', await apiError.response.text?.());
      }
      
      throw apiError;
    }
  } catch (error) {
    console.error('Error sending test push notification:', error);
    throw error;
  }
} 