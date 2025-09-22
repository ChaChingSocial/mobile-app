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

export default function LoginScreen() {
  const [_, setSession] = useStorageState("session");
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [googleResponse, setGoogleResponse] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [emailOptIn, setEmailOptIn] = useState(true);

  const handleGoogleLogin = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      }); // for android devices only
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        setGoogleResponse(response.data);
        const { user, idToken } = response.data;
        console.log("Google Signed In Response:", response.data);

        try {
          const res = await userApi.getUserByEmail({
            email: user.email,
          });

          if (!res?.id) {
            console.log("No user ID found in response");
            throw new Error("User ID not found");
          }

          const sessionData = {
            uid: res.id,
            email: user.email,
            displayName: res?.username,
            profilePic: res.profilePic || "",
          };
          console.log("Setting session with data:", sessionData);
          setSession(sessionData);
        } catch (err: any) {
          console.error("Error in getUserByEmail:", err);
          if (err.response) {
            console.error("Error response:", err.response);
          }
          setError("Failed to get user data. Please try again.");
          return; // Exit early on error
        }

        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        signInWithCredential(getAuth(), googleCredential);

        router.replace("/(protected)/(home)");
      } else {
        setError(`Google Sign cancelled by user`);
        console.error("Google Sign In Error:", response);
      }
      setGoogleLoading(false);
    } catch (error) {
      if (isErrorWithCode(error)) {
        switch (error.code) {
          case statusCodes.IN_PROGRESS:
            // operation (eg. sign in) already in progress
            setError("Google Sign In is already in progress.");
            break;
          case statusCodes.PLAY_SERVICES_NOT_AVAILABLE:
            // Android only, play services not available or outdated
            setError("Google Play Services are not available or outdated.");
            break;
          default:
            // some other error happened
            setError(
              `Google Sign In failed with error code ${error.code}: ${
                error.message || "Unknown error"
              }`
            );
        }
      } else {
        // an error that's not related to google sign in occurred
        setError(
          `Google Sign In failed: ${
            (error as Error).message || "Unknown error"
          }`
        );
      }
      console.error("Google Sign In Error:", error);
      setError(
        `Error during Google Sign In: ${
          (error as Error).message || "Unknown error"
        }`
      );
      setGoogleLoading(false);
    }
  };

  return (
    <Center className="flex-1 bg-white justify-between">
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
          <ButtonText className="text-lg items-center font-bold w-full text-center">
            Continue with Google
          </ButtonText>
        </Button>

        <Button
          className="w-full flex-row items-center border rounded-full bg-white h-12"
          onPress={() => router.push("/login/login-form")}
        >
          <FontAwesome5 name="user" size={20} color="#333" className="ml-6" />
          <ButtonText className="text-lg items-center font-bold w-full text-center">
            Use email or username
          </ButtonText>
        </Button>

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
          {/* <Checkbox
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
              <Text className="text-sm italic">
                I agree to receive emails updates on Chaching Social.
              </Text>
            </CheckboxLabel>
          </Checkbox> */}
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
            onPress={() => router.replace("/register")}
          >
            Sign up
          </Text>
        </Text>
      </VStack>
    </Center>
  );
}
