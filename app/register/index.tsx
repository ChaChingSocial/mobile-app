import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Divider } from "@/components/ui/divider";
import { Heading } from "@/components/ui/heading";
import { CheckIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { userApi } from "@/config/backend";
import { useStorageState } from "@/hooks/useStorageState";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  AppleAuthProvider,
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
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
import { Image, Linking } from "react-native";
import appleAuth, {
  AppleButton,
} from "@invertase/react-native-apple-authentication";
import Toast from "react-native-toast-message";
import { defaultProfilePic } from "@/lib/constants";
import { Status } from "@/_sdk";
import generateRandomUsername from "@/lib/utils/generator";

export default function RegisterScreen() {
  const [_, setSession] = useStorageState("session");
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

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
      // Try to get existing user
      let res = await userApi.getUserByEmail({ email });
      const username = generateRandomUsername();

      if (res?.id) {
        // User exists in backend
        return {
          uid: res.id,
          email,
          displayName: res.username || username,
          profilePic: res.profilePic || photoURL || defaultProfilePic,
        };
      } else {
        // Create new user in backend
        const newUser = {
          id: firebaseUser.uid,
          username,
          email,
          profilePic: photoURL || defaultProfilePic,
          interests: [],
          bio: "",
          socials: {
            twitter: "",
            instagram: "",
            linkedin: "",
            youtube: "",
            website: "",
          },
          persona: [""],
          industry: "",
          status: Status.Pending,
          finfluencer: false,
        };

        await userApi.updateUser({ user: newUser });

        return {
          uid: firebaseUser.uid,
          email,
          displayName: username,
          profilePic: photoURL || defaultProfilePic,
        };
      }
    } catch (error) {
      console.error("Backend user error:", error);
      throw error;
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      }); // for android devices only
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        const { user: googleUser, idToken } = response.data;
        const googleCredential = GoogleAuthProvider.credential(idToken);
        console.log("Google Signed In Response:", response.data);

        try {
          const userCredential = await signInWithCredential(
            getAuth(),
            googleCredential
          );
          const firebaseUser = userCredential.user;

          // Create/get backend user
          const sessionData = await createOrGetBackendUser({
            firebaseUser,
            email: googleUser.email,
            photoURL: googleUser.photo || defaultProfilePic,
          });

          setSession(sessionData);
          router.replace("/(protected)/(home)");
        } catch (err: any) {
          // Handle account exists with different credential
          if (err.code === "auth/account-exists-with-different-credential") {
            const methods = await fetchSignInMethodsForEmail(
              getAuth(),
              err.email
            );

            const providerNames = {
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
          console.error("Error in Firebase sign-in:", err);
          setError("Failed to authenticate. Please try again.");
          Toast.show({
            type: "error",
            text1: "Authentication Failed",
            text2: err.message || "Please try again",
          });
        }
      } else {
        setError(`Google Sign cancelled by user`);
        console.error("Google Sign In Error:", response);
      }
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            setError("Google Sign In is already in progress.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            setError("Google Play Services are not available or outdated.");
            break;
          default:
            setError(
              `Google Sign In failed with error code ${error.code}: ${
                error.message || "Unknown error"
              }`
            );
        }
      } else {
        setError(
          `Google Sign In failed: ${
            (error as Error).message || "Unknown error"
          }`
        );
      }
      console.error("Google Sign In Error:", error);
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setAppleLoading(true);

      const appleAuthRequestResponse = await appleAuth.performRequest({
        requestedOperation: appleAuth.Operation.LOGIN,
        requestedScopes: [appleAuth.Scope.EMAIL],
      });

      if (!appleAuthRequestResponse.identityToken) {
        throw new Error("Apple Sign-In failed - no identity token returned");
      }

      const { identityToken, nonce, email } = appleAuthRequestResponse;

      // Note: Apple may not return email on subsequent logins
      // In that case, we need to get it from Firebase after authentication
      let userEmail = email;

      // Create Apple credential for Firebase
      const appleCredential = AppleAuthProvider.credential(
        identityToken,
        nonce
      );

      try {
        // Sign in to Firebase with Apple credential
        const userCredential = await signInWithCredential(
          getAuth(),
          appleCredential
        );
        const firebaseUser = userCredential.user;

        // If email wasn't provided by Apple, get it from Firebase user
        if (!userEmail && firebaseUser.email) {
          userEmail = firebaseUser.email;
        }

        // Create/get backend user
        const sessionData = await createOrGetBackendUser({
          firebaseUser,
          email: userEmail,
          photoURL: firebaseUser.photoURL || defaultProfilePic,
        });

        setSession(sessionData);
        console.log("Apple Sign-In successful, session set:", sessionData);

        router.replace("/(protected)/(home)");
      } catch (err: any) {
        // Handle account exists with different credential (same as Google)
        if (err.code === "auth/account-exists-with-different-credential") {
          const methods = await fetchSignInMethodsForEmail(
            getAuth(),
            err.email
          );

          const providerNames = {
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

        console.error("Error in Firebase Apple sign-in:", err);
        setError("Failed to authenticate with Apple. Please try again.");
        Toast.show({
          type: "error",
          text1: "Apple Sign In Failed",
          text2: err.message || "Please try again",
        });
      }
    } catch (e: any) {
      if (e.code === appleAuth.Error.CANCELED) {
        // User canceled the Apple Sign In flow
        setError("Apple Sign In was cancelled by the user.");
        Toast.show({
          type: "info",
          text1: "Apple Sign In Cancelled",
          text2: "You cancelled the Apple Sign In process.",
        });
      } else if (e.code === appleAuth.Error.FAILED) {
        setError("Apple Sign In failed. Please try again.");
        Toast.show({
          type: "error",
          text1: "Apple Sign In Error",
          text2: "Authentication failed. Please try again.",
        });
      } else if (e.code === appleAuth.Error.INVALID_RESPONSE) {
        setError("Invalid response from Apple. Please try again.");
        Toast.show({
          type: "error",
          text1: "Apple Sign In Error",
          text2: "Invalid response received. Please try again.",
        });
      } else if (e.code === appleAuth.Error.NOT_HANDLED) {
        setError("Apple Sign In not handled. Please try again.");
        Toast.show({
          type: "error",
          text1: "Apple Sign In Error",
          text2: "Sign in request was not handled. Please try again.",
        });
      } else {
        // Generic error handling
        setError(`Apple Sign In failed: ${e.message || "Unknown error"}`);
        Toast.show({
          type: "error",
          text1: "Apple Sign In Error",
          text2: `Error: ${e.message || "Unknown error occurred"}`,
        });
      }
      console.error("Apple Sign In Error:", e);
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
          Sign up
        </Heading>

        {/* Google Sign In Button */}
        <Button
          className="w-full flex-row items-center justify-between border rounded-full bg-white h-12"
          onPress={handleGoogleSignIn}
          disabled={googleLoading}
        >
          <Image
            source={require("@/assets/images/google-icon.png")}
            className="h-6 w-6"
          />
          <ButtonText className="text-lg items-center font-bold w-full text-center text-typography-black">
            {googleLoading ? "Signing in..." : "Continue with Google"}
          </ButtonText>
        </Button>

        {/* Email/Username Button */}
        <Button
          className="w-full flex-row items-center border rounded-full bg-white h-12"
          onPress={() => router.push("/register/register-form")}
        >
          <FontAwesome5 name="user" size={20} color="#333" className="ml-6" />
          <ButtonText className="text-lg items-center font-bold w-full text-center text-typography-black">
            Use email or username
          </ButtonText>
        </Button>

        {/* Apple Sign In Button */}
        <AppleButton
          buttonStyle={AppleButton.Style.WHITE_OUTLINE}
          buttonType={AppleButton.Type.SIGN_IN}
          cornerRadius={16}
          style={{
            width: "100%",
            height: 48,
          }}
          onPress={handleAppleSignIn}
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
            >
              Terms & Agreements
            </Text>{" "}
            and acknowledge that you understand the{" "}
            <Text
              className="underline text-blue-600"
              onPress={() =>
                Linking.openURL("https://www.chaching.social/privacy-policy")
              }
            >
              Privacy Policy
            </Text>
            .
          </Text>
          {/* Checkbox */}
          <Checkbox
            value="email-opt-in"
            size="md"
            isInvalid={false}
            isDisabled={false}
            isChecked={emailOptIn}
            onChange={setEmailOptIn}
            className="mt-4"
          >
            <CheckboxIndicator>
              <CheckboxIcon as={CheckIcon} />
            </CheckboxIndicator>
            <CheckboxLabel>
              <Text className="text-sm italic text-gray-600">
                I agree to receive emails updates on Chaching Social.
              </Text>
            </CheckboxLabel>
          </Checkbox>
        </Box>

        {/* Error Message */}
        {error && (
          <Text className="text-red-500 mt-2 text-center">{error}</Text>
        )}
      </VStack>

      <Divider className="w-full mx-2 my-4" />

      <VStack className="mb-8 items-center">
        <Text className="text-lg">
          Already have an account?{" "}
          <Text
            className="underline text-lg text-green-600"
            onPress={() => router.replace("/login")}
          >
            Log in
          </Text>
        </Text>
      </VStack>
    </Center>
  );
}
