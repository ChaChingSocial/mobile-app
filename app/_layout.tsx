import { GluestackUIProvider } from "@/components/ui/gluestack-ui-provider";
import "@/global.css";
import { SessionProvider, useSession } from "@/lib/providers/AuthContext";
import { PrivyProvider } from "@privy-io/expo";
import { GoogleSignin } from "@react-native-google-signin/google-signin";
import { Redirect, usePathname } from "expo-router";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { Text } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-reanimated";
import Toast from "react-native-toast-message";

SplashScreen.preventAutoHideAsync();

// Apply Bricolage Grotesque as the default font across the app.
// Components with explicit style props will also need fontFamily set
// for the font to apply — see the weight constants below.
Text.defaultProps = {
    ...(Text.defaultProps ?? {}),
    style: { fontFamily: "BricolageGrotesque-Regular" },
};

function RootLayoutNav() {
    const pathname = usePathname();
    const { session } = useSession();

    useEffect(() => {
        GoogleSignin.configure({
            webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
            offlineAccess: true,
            iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
            profileImageSize: 150,
        });
    }, []);

    // if the user is not logged in and the pathname starts with /(protected) redirect to /login
    if (
        session === null &&
        !pathname.startsWith("/login") &&
        !pathname.startsWith("/register")
    ) {
        return <Redirect href="/login" />;
    }

    console.log("session layout", session, pathname);

    return (
        <GluestackUIProvider>
            <GestureHandlerRootView>
                <Stack>
                    <Stack.Screen
                        name="(protected)"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="login"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen
                        name="register"
                        options={{
                            headerShown: false,
                        }}
                    />
                    <Stack.Screen name="+not-found" />
                </Stack>
                <StatusBar style="auto" backgroundColor="transparent" />
            </GestureHandlerRootView>
        </GluestackUIProvider>
    );
}

export default function RootLayout() {
    const privyAppId = process.env.EXPO_PUBLIC_PRIVY_APP_ID;
    const privyClientId = process.env.EXPO_PUBLIC_PRIVY_CLIENT_ID;

    const [fontsLoaded] = useFonts({
        "BricolageGrotesque-ExtraLight": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-ExtraLight.ttf"),
        "BricolageGrotesque-Light": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Light.ttf"),
        "BricolageGrotesque-Regular": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Regular.ttf"),
        "BricolageGrotesque-Medium": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Medium.ttf"),
        "BricolageGrotesque-SemiBold": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-SemiBold.ttf"),
        "BricolageGrotesque-Bold": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-Bold.ttf"),
        "BricolageGrotesque-ExtraBold": require("../assets/fonts/Bricolage_Grotesque/static/BricolageGrotesque-ExtraBold.ttf"),
    });

    useEffect(() => {
        if (fontsLoaded) SplashScreen.hideAsync();
    }, [fontsLoaded]);

    if (!fontsLoaded) return null;

    const appTree = (
        <SessionProvider>
            <RootLayoutNav />
        </SessionProvider>
    );
    return (
        <>
            {privyAppId && privyClientId ? (
                <PrivyProvider appId={privyAppId} clientId={privyClientId}>
                    {appTree}
                </PrivyProvider>
            ) : (
                appTree
            )}
            <Toast />
        </>
    );
}
