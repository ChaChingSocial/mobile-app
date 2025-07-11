import { useSession } from "@/lib/providers/AuthContext";
import { useNotification } from "@/hooks/useNotification";
import { 
  registerDeviceTokenWithBackend, 
  sendTestPushNotification,
  unregisterDeviceTokenFromBackend 
} from "@/lib/utils/deviceTokenRegistration";
import { checkBackendHealth, getBackendConfig } from "@/lib/utils/backendHealthCheck";
import { Button, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useState } from "react";

export default function PushNotificationDebugger() {
  const { session } = useSession();
  const { expoPushToken } = useNotification();
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [backendStatus, setBackendStatus] = useState<{
    isAccessible: boolean;
    error?: string;
    details?: any;
  } | null>(null);

  const handleRegisterToken = async () => {
    if (!session?.uid) {
      Toast.show({
        text1: "No user session found",
        type: "error",
      });
      return;
    }

    setIsRegistering(true);
    try {
      const token = await registerDeviceTokenWithBackend(session.uid);
      
      if (token) {
        Toast.show({
          text1: "Device token registered successfully!",
          text2: `Token: ${token.substring(0, 20)}...`,
          type: "success",
        });
      } else {
        Toast.show({
          text1: "Failed to get device token",
          type: "error",
        });
      }
    } catch (error) {
      Toast.show({
        text1: "Failed to register device token",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregisterToken = async () => {
    if (!session?.uid || !expoPushToken) {
      Toast.show({
        text1: "No user session or device token found",
        type: "error",
      });
      return;
    }

    setIsUnregistering(true);
    try {
      await unregisterDeviceTokenFromBackend(session.uid, expoPushToken);
      
      Toast.show({
        text1: "Device token unregistered successfully!",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Failed to unregister device token",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsUnregistering(false);
    }
  };

  const handleSendTestNotification = async () => {
    if (!session?.uid) {
      Toast.show({
        text1: "No user session found",
        type: "error",
      });
      return;
    }

    setIsSendingTest(true);
    try {
      await sendTestPushNotification(
        session.uid,
        "Test Push Notification",
        "This is a test push notification from your Go backend service!"
      );
      
      Toast.show({
        text1: "Test notification sent!",
        text2: "Check your device for the push notification",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Failed to send test notification",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  const handleCheckBackendHealth = async () => {
    setIsCheckingHealth(true);
    try {
      const status = await checkBackendHealth();
      setBackendStatus(status);
      
      if (status.isAccessible) {
        Toast.show({
          text1: "Backend is accessible!",
          type: "success",
        });
      } else {
        Toast.show({
          text1: "Backend is not accessible",
          text2: status.error,
          type: "error",
        });
      }
    } catch (error) {
      Toast.show({
        text1: "Health check failed",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsCheckingHealth(false);
    }
  };

  return (
    <View
      style={{ 
        padding: 20,
        backgroundColor: "#fff3cd",
        borderRadius: 8,
        margin: 16,
        borderWidth: 1,
        borderColor: "#ffeaa7"
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        🔧 Push Notification Debugger
      </Text>
      
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
        This component helps debug the push notification workflow:
        {"\n"}1. Check backend health
        {"\n"}2. Register device token with backend
        {"\n"}3. Send test push notification
        {"\n"}4. Unregister device token
      </Text>

      <Text style={{ marginBottom: 10 }}>
        User ID: {session?.uid || "Not logged in"}
      </Text>

      <Text style={{ marginBottom: 10, fontSize: 12 }}>
        Expo Push Token: {expoPushToken ? `${expoPushToken.substring(0, 30)}...` : "Not available"}
      </Text>

      <Text style={{ marginBottom: 10, fontSize: 12 }}>
        Backend URL: {getBackendConfig().baseUrl}
      </Text>

      {backendStatus && (
        <View style={{ marginBottom: 10, padding: 10, backgroundColor: backendStatus.isAccessible ? '#d4edda' : '#f8d7da', borderRadius: 5 }}>
          <Text style={{ fontSize: 12, fontWeight: 'bold', color: backendStatus.isAccessible ? '#155724' : '#721c24' }}>
            Backend Status: {backendStatus.isAccessible ? '✅ Accessible' : '❌ Not Accessible'}
          </Text>
          {backendStatus.error && (
            <Text style={{ fontSize: 10, color: '#721c24' }}>
              Error: {backendStatus.error}
            </Text>
          )}
          {backendStatus.details && (
            <Text style={{ fontSize: 10, color: '#721c24' }}>
              Details: {JSON.stringify(backendStatus.details)}
            </Text>
          )}
        </View>
      )}

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isCheckingHealth ? "Checking..." : "Check Backend Health"}
          onPress={handleCheckBackendHealth}
          disabled={isCheckingHealth}
        />
      </View>

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isRegistering ? "Registering..." : "Register Device Token"}
          onPress={handleRegisterToken}
          disabled={isRegistering || !session?.uid}
        />
      </View>

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isSendingTest ? "Sending..." : "Send Test Push Notification"}
          onPress={handleSendTestNotification}
          disabled={isSendingTest || !session?.uid}
        />
      </View>

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isUnregistering ? "Unregistering..." : "Unregister Device Token"}
          onPress={handleUnregisterToken}
          disabled={isUnregistering || !session?.uid || !expoPushToken}
        />
      </View>

      <Text style={{ fontSize: 12, color: "#856404", textAlign: "center", marginTop: 10 }}>
        💡 Make sure your Go backend service is running and check the console for detailed logs!
      </Text>
    </View>
  );
} 