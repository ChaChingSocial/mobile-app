import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { userApi } from "@/config/backend";
import { useStorageState } from "@/hooks/useStorageState";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
  AppleAuthProvider,
  fetchSignInMethodsForEmail,
  FirebaseAuthTypes,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useRouter } from "expo-router";
import { useState } from "react";
import { Image, Linking, ActivityIndicator } from "react-native";
import Toast from "react-native-toast-message";
import { defaultProfilePic } from "@/lib/constants";
import appleAuth, {
  AppleButton,
} from "@invertase/react-native-apple-authentication";
import generateRandomUsername from "@/lib/utils/generator";

export default function LoginScreen() {
  const [_, setSession] = useStorageState("session");
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);

  const createOrGetBackendUser = async ({
    firebaseUser,
    email,
    photoURL,
  }: {
    firebaseUser: FirebaseAuthTypes.User;
    email: string;
    photoURL: string;
  }) => {
    try {
      const res = await userApi.getUserByEmail({ email });

      if (res?.id) {
        // User exists in backend
        return {
          uid: res.id,
          email,
          displayName: res.username,
          profilePic: res.profilePic || photoURL || defaultProfilePic,
        };
      } else {
        console.warn("User not found in backend during login:", email);

        return {
          uid: firebaseUser.uid,
          email,
          displayName: firebaseUser.displayName || generateRandomUsername(),
          profilePic: photoURL || defaultProfilePic,
        };
      }
    } catch (error) {
      console.error("Backend user error during login:", error);
      throw error;
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      setError(null);

      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      });

      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { user: googleUser, idToken } = response.data;
        const googleCredential = GoogleAuthProvider.credential(idToken);

        try {
          const userCredential = await signInWithCredential(
            getAuth(),
            googleCredential
          );
          const firebaseUser = userCredential.user;

          const sessionData = await createOrGetBackendUser({
            firebaseUser,
            email: googleUser.email,
            photoURL: googleUser.photo || defaultProfilePic,
          });

          console.log("Setting session with data:", sessionData);
          setSession(sessionData);

          router.replace("/(protected)/(home)");
        } catch (err: any) {
          // Handle specific Firebase auth errors
          if (err.code === "auth/account-exists-with-different-credential") {
            const methods = await fetchSignInMethodsForEmail(
              getAuth(),
              err.email
            );

            const providerNames: Record<string, string> = {
              password: "Email/Password",
              "google.com": "Google",
              "apple.com": "Apple",
            };

            const existingProvider = providerNames[methods[0]] || methods[0];

            Toast.show({
              type: "info",
              text1: "Account Already Exists",
              text2: `You previously signed in with ${existingProvider}. Please use that method to sign in.`,
              visibilityTime: 5000,
            });
            return;
          }

          // Handle other Firebase errors
          console.error("Firebase sign-in error:", err);
          Toast.show({
            type: "error",
            text1: "Authentication Failed",
            text2: err.message || "Please try again",
          });
        }
      } else {
        // User cancelled or other non-success response
        setError("Google sign-in was cancelled or failed");
      }
    } catch (error: unknown) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            setError("Google sign-in is already in progress");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError("Google Play Services are not available or outdated");
            break;
          case statusCodes.SIGN_IN_CANCELLED:
            setError("Google sign-in was cancelled");
            break;
          default:
            setError(
              `Google sign-in failed: ${error.message || "Unknown error"}`
            );
        }
      } else if (error instanceof Error) {
        setError(`Google sign-in failed: ${error.message}`);
      } else {
        setError("Google sign-in failed: Unknown error");
      }
      console.error("Google sign-in error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    try {
      setAppleLoading(true);
      setError(null);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL, appleAuth.Scope.FULL_NAME],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple sign-in failed - no identity token returned");
      }

      const { identityToken, nonce, email } = appleAuthRequestResponse;
      const appleCredential = AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      try {
        const userCredential = await signInWithCredential(
          getAuth(),
          appleCredential
        );
        const firebaseUser = userCredential.user;

        // Use email from Firebase if Apple didn't provide it (happens on subsequent logins)
        const userEmail = email || firebaseUser.email;

        if (!userEmail) {
          throw new Error("No email available for Apple sign-in");
        }

        const sessionData = await createOrGetBackendUser({
          firebaseUser,
          email: userEmail,
          photoURL: firebaseUser.photoURL || defaultProfilePic,
        });

        console.log("Setting session with Apple data:", sessionData);
        setSession(sessionData);

        router.replace("/(protected)/(home)");
      } catch (err: any) {
        // Handle specific Firebase auth errors
        if (err.code === "auth/account-exists-with-different-credential") {
          const methods = await fetchSignInMethodsForEmail(
            getAuth(),
            err.email
          );

          const providerNames: Record<string, string> = {
            password: "Email/Password",
            "google.com": "Google",
            "apple.com": "Apple",
          };

          const existingProvider = providerNames[methods[0]] || methods[0];

          Toast.show({
            type: "info",
            text1: "Account Already Exists",
            text2: `You previously signed in with ${existingProvider}. Please use that method to sign in.`,
            visibilityTime: 5000,
          });
          return;
        }

        console.error("Firebase Apple sign-in error:", err);
        Toast.show({
          type: "error",
          text1: "Apple Sign In Failed",
          text2: err.message || "Please try again",
        });
      }
    } catch (e: any) {
      if (e.code === appleAuth.Error.CANCELED) {
        // User cancelled the flow
        setError("Apple sign-in was cancelled");
        Toast.show({
          type: "info",
          text1: "Apple Sign In Cancelled",
          text2: "You cancelled the sign-in process",
        });
      } else {
        setError(`Apple sign-in failed: ${e.message || "Unknown error"}`);
        Toast.show({
          type: "error",
          text1: "Apple Sign In Error",
          text2: e.message || "Please try again",
        });
      }
      console.error("Apple sign-in error:", e);
    } finally {
      setAppleLoading(false);
    }
  };

  return (
    <Center className="flex-1 bg-[#7ad8bd] justify-between">
      <VStack
        space="xl"
        className="flex-1 justify-center items-center w-full px-6"
      >
        <Image
          source={require("@/assets/images/logo.png")}
          className="mb-6 h-20 w-64"
        />

        <Heading className="text-2xl font-bold mb-6 text-center">
          Log in
        </Heading>

        <Button
          className="w-full flex-row items-center justify-between border rounded-full bg-white h-12"
          onPress={handleGoogleLogin}
          disabled={googleLoading}
        >
          <Image
            source={require("@/assets/images/google-icon.png")}
            className="h-6 w-6"
          />
          <ButtonText className="text-lg items-center font-bold w-full text-center text-typography-black">
            Continue with Google
          </ButtonText>
        </Button>

        <Button
          className="w-full flex-row items-center border rounded-full bg-white h-12"
          onPress={() => router.push("/login/login-form")}
        >
          <FontAwesome5 name="user" size={20} color="#333" className="ml-6" />
          <ButtonText className="text-lg items-center font-bold w-full text-center text-typography-black">
            Use email or username
          </ButtonText>
        </Button>

        <AppleButton
          buttonStyle={AppleButton.Style.WHITE_OUTLINE}
          buttonType={AppleButton.Type.CONTINUE}
          cornerRadius={16}
          style={{
            width: "100%",
            height: 48,
            // opacity: appleLoading ? 0.5 : 1,
          }}
          onPress={handleAppleLogin}
        />

        <Box className="absolute bottom-10">
          {/* Legal Text */}
          <Text className="text-center mt-4">
            By continuing, you agree to our{" "}
            <Text
              className="underline text-blue-600"
              onPress={() =>
                Linking.openURL("https://www.chaching.social/terms-of-service")
              }
              accessibilityLabel="Terms of Service"
              accessibilityRole="link"
            >
              Terms & Agreements
            </Text>{" "}
            and acknowledge that you understand the{" "}
            <Text
              className="underline text-blue-600"
              onPress={() =>
                Linking.openURL("https://www.chaching.social/privacy-policy")
              }
              accessibilityLabel="Privacy Policy"
              accessibilityRole="link"
            >
              Privacy Policy
            </Text>
            .
          </Text>
        </Box>

        {/* Error Message */}
        {error && (
          <Text className="text-red-500 mt-2 text-center">{error}</Text>
        )}
      </VStack>

      <Divider className="w-full mx-2 my-4" />

      <VStack className="mb-8 items-center">
        <Text className="text-lg">
          Don't have an account?{" "}
          <Text
            className="underline text-green-600"
            onPress={() => router.replace("/register")}
            accessibilityLabel="Sign up"
            accessibilityRole="link"
          >
            Sign up
          </Text>
        </Text>
      </VStack>
    </Center>
  );
}
