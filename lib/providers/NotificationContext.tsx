import * as Notifications from "expo-notifications";
import {
  createContext,
  type PropsWithChildren,
  useEffect,
  useState,
} from "react";
import { registerForPushNotificationsAsync } from "@/lib/utils/registerForPushNotifications";
import { registerDeviceTokenWithBackend } from "@/lib/utils/deviceTokenRegistration";
import { useSession } from "./AuthContext";

interface NotificationContextType {
  expoPushToken: string | null;
  notification: Notifications.Notification | null;
  error: Error | null;
}

export const NotificationContext = createContext<
  NotificationContextType | undefined
>(undefined);

export function NotificationProvider({ children }: PropsWithChildren) {
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] =
    useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const { session } = useSession();

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => {
        setExpoPushToken(token ?? "");
        
        // Register the token with the backend if user is logged in
        if (token && session?.uid) {
          registerDeviceTokenWithBackend(session.uid)
            .then(() => {
              console.log('Device token registered with backend successfully');
            })
            .catch((error) => {
              console.error('Failed to register device token with backend:', error);
            });
        }
      })
      .catch((error: any) => setError(error));

    // get notification when app is in foreground
    const notificationListener = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log("🔔 Notification Received while app is running: ", notification);
        setNotification(notification);
      }
    );

    // called when user taps/interacts with notification
    const responseListener =
      Notifications.addNotificationResponseReceivedListener((response) => {
        console.log(
          "🔔 Notification Response: ",
          JSON.stringify(response, null, 2),
          JSON.stringify(response.notification.request.content.data, null, 2)
        );
      });

    return () => {
      notificationListener.remove();
      responseListener.remove();
    };
  }, [session?.uid]); // Re-run when user session changes

  return (
    <NotificationContext.Provider
      value={{ expoPushToken, notification, error }}
    >
      {children}
    </NotificationContext.Provider>
  );
}
