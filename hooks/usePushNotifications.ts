import { pushNotificationApi } from '@/config/backend';
import { useEffect, useState } from 'react';

export interface UsePushNotificationsOptions {
  userId: string;
  autoInitialize?: boolean;
}

export interface UsePushNotificationsReturn {
  isInitialized: boolean;
  isInitializing: boolean;
  error: string | null;
  initialize: () => Promise<void>;
  cleanup: () => Promise<void>;
  sendTestNotification: (title: string, body: string) => Promise<void>;
}

export function usePushNotifications({
  userId,
  autoInitialize = true,
}: UsePushNotificationsOptions): UsePushNotificationsReturn {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialize = async () => {
    if (isInitialized || isInitializing) {
      return;
    }

    setIsInitializing(true);
    setError(null);

    try {
      await pushNotificationApi.initialize(userId);
      setIsInitialized(true);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize push notifications';
      setError(errorMessage);
      console.error('Push notification initialization error:', err);
    } finally {
      setIsInitializing(false);
    }
  };

  const cleanup = async () => {
    try {
      await pushNotificationService.cleanup();
      setIsInitialized(false);
      setError(null);
    } catch (err) {
      console.error('Push notification cleanup error:', err);
    }
  };

  const sendTestNotification = async (title: string, body: string) => {
    try {
      await pushNotificationService.sendTestNotification(title, body);
    } catch (err) {
      console.error('Failed to send test notification:', err);
      throw err;
    }
  };

  useEffect(() => {
    if (autoInitialize && userId) {
      initialize();
    }

    // Cleanup on unmount
    return () => {
      cleanup();
    };
  }, [userId, autoInitialize]);

  return {
    isInitialized,
    isInitializing,
    error,
    initialize,
    cleanup,
    sendTestNotification,
  };
} 