import { useNotification } from "@/hooks/useNotification";
import { Button, Text, View } from "react-native";
import Toast from "react-native-toast-message";

/**
 * Sends a push notification to the specified Expo push token using Expo's push notification service.
 *
 * @param expoPushToken - The Expo push token identifying the target device
 */
async function sendPushNotification(expoPushToken: string) {
  const message = {
    to: expoPushToken,
    sound: "default",
    title: "Original Title",
    body: "And here is the body!",
    data: { someData: "goes here" },
  };

  await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Accept-encoding": "gzip, deflate",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(message),
  });
}

/**
 * Displays the current Expo push token and the latest received notification, and allows sending a test push notification to the device.
 *
 * Renders the Expo push token and details of the most recent notification if available. Provides a button to send a push notification to the device using the Expo push notification service. If no push token is available, shows an error toast message.
 *
 * @returns A React element displaying notification information and a button to trigger a test notification.
 */
export default function ExampleNotification() {
  const { expoPushToken, notification } = useNotification();
  return (
    <View
      style={{ flex: 1, alignItems: "center", justifyContent: "space-around" }}
    >
      <Text>Your Expo push token: {expoPushToken}</Text>
      <View style={{ alignItems: "center", justifyContent: "center" }}>
        <Text>
          Title: {notification && notification.request.content.title}{" "}
        </Text>
        <Text>Body: {notification && notification.request.content.body}</Text>
        <Text>
          Data:{" "}
          {notification && JSON.stringify(notification.request.content.data)}
        </Text>
      </View>
      <Button
        title="Press to Send Notification"
        onPress={async () => {
          if (expoPushToken) {
            await sendPushNotification(expoPushToken);
          } else {
            Toast.show({
              text1: "No push token found",
              type: "error",
            });
          }
        }}
      />
    </View>
  );
}
