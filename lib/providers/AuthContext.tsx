import { useNotification } from "@/hooks/useNotification";
import { useStorageState } from "@/hooks/useStorageState";
import { registerDeviceTokenWithBackend, unregisterDeviceTokenFromBackend } from "@/lib/utils/deviceTokenRegistration";
import { SessionValue } from "@/types";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { SplashScreen, useRouter } from "expo-router";
import {
  createContext,
  type PropsWithChildren,
  useContext,
  useEffect,
} from "react";

SplashScreen.preventAutoHideAsync();

const AuthContext = createContext<{
  signIn: () => void;
  signOut: () => void;
  session?: SessionValue | null;
  isLoading: boolean;
}>({
  signIn: () => null,
  signOut: () => null,
  session: null,
  isLoading: false,
});

// This hook can be used to access the user info.
export function useSession() {
  const value = useContext(AuthContext);
  if (process.env.NODE_ENV !== "production") {
    if (!value) {
      throw new Error("useSession must be wrapped in a <SessionProvider />");
    }
  }

  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const { expoPushToken } = useNotification();

  const [[isLoading, session], setSession] = useStorageState("session");
  console.log("session", session);
  console.log("isLoading", isLoading);

  useEffect(() => {
    if (isLoading) {
      SplashScreen.hideAsync();
    }
    if (session) {
      router.replace("/(protected)/(home)");
      
      // Register device token for push notifications
      if (session.uid) {
        registerDeviceTokenWithBackend(session.uid).catch((error) => {
          console.error("Failed to register device token:", error);
        });
      }
    }
  }, [isLoading, session]);

  return (
    <AuthContext.Provider
      value={{
        signIn: () => {
          // Perform sign-in logic here
          router.replace("/(protected)/(home)");
        },
        signOut: async () => {
          // Unregister device token before signing out
          if (session?.uid && expoPushToken) {
            try {
              await unregisterDeviceTokenFromBackend(session.uid, expoPushToken);
            } catch (error) {
              console.error("Failed to unregister device token:", error);
            }
          }
          
          await GoogleSignin.signOut();
          
          setSession(null);
          router.replace("/login");
        },
        session,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
