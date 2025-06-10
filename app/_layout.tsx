import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SessionProvider } from "@/lib/providers/AuthContext";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Stack } from "expo-router";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";

export default function RootLayout() {
  // useEffect(() => {
  //   GoogleSignin.configure({
  //     webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  //     // scopes: ["https://www.googleapis.com/auth/drive.readonly"], // what API you want to access on behalf of the user, default is email and profile
  //     // offlineAccess: true,
  //     // hostedDomain: "", // specifies a hosted domain restriction
  //     // forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
  //     // accountName: "", // [Android] specifies an account name on the device that should be used
  //     iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
  //     // openIdRealm: "", // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
  //     profileImageSize: 150, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
  //   }); 

  //   console.log("Google Signin configured!!");
  // }, []);

  return (
    <SessionProvider>
      <GluestackUIProvider mode="light">
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack>
            <Stack.Screen
              name="(protected)"
              options={{
                headerShown: false,
                animation: "none",
              }}
            />
            <Stack.Screen
              name="login"
              options={{
                headerShown: false,
                animation: "none",
                presentation: "modal",
              }}
            />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </GluestackUIProvider>
    </SessionProvider>
  );
}
