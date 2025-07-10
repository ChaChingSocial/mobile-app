import Constants from "expo-constants";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import Toast from "react-native-toast-message";

/**
 * Displays an error toast with the provided message and prompts the user to retry, then throws an error to halt execution.
 *
 * @param errorMessage - The error message to display and throw
 */
function handleRegistrationError(errorMessage: string) {
  Toast.show({
    text1: errorMessage,
    type: "error",
    position: "bottom",
    bottomOffset: 100,
    topOffset: 100,
    text2: "Please try again",
    text2Style: { fontSize: 12, color: "black" },
    text1Style: { fontSize: 16, color: "black" },
  });
  throw new Error(errorMessage);
}

/**
 * Registers the device for push notifications and returns the Expo push token.
 *
 * Configures the notification channel on Android, checks for required permissions, ensures the device is physical, retrieves the Expo project ID, and obtains the Expo push token. Displays an error toast and throws if any step fails.
 *
 * @returns The Expo push token string if registration is successful
 */
export async function registerForPushNotificationsAsync() {
  if (Platform.OS === "android") {
    Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: "#FF231F7C",
    });
  }

  // Check if the device is a physical device
  if (Device.isDevice) {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    if (finalStatus !== "granted") {
      handleRegistrationError(
        "Permission not granted to get push token for push notification!"
      );
      return;
    }

    // for Expo analytics/graphs
    const projectId =
      Constants?.expoConfig?.extra?.eas?.projectId ??
      Constants?.easConfig?.projectId;
    if (!projectId) {
      handleRegistrationError("Project ID not found");
    }
    try {
      const pushTokenString = (
        await Notifications.getExpoPushTokenAsync({
          projectId,
        })
      ).data;
      console.log("pushTokenString", pushTokenString);
      return pushTokenString;
    } catch (e: unknown) {
      handleRegistrationError(`${e}`);
    }
  } else {
    handleRegistrationError("Must use physical device for push notifications");
  }
}
