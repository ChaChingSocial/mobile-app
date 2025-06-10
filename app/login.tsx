import { Button, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useStorageState } from "@/hooks/useStorageState";
import { loginWithEmail } from "@/lib/api/auth";
import { useSession } from "@/lib/providers/AuthContext";
import { FontAwesome5 } from "@expo/vector-icons";
import {
  GoogleAuthProvider,
  getAuth,
  signInWithCredential,
} from "@react-native-firebase/auth";
import {
  GoogleSignin,
  GoogleSigninButton,
  isErrorWithCode,
  isSuccessResponse,
  statusCodes,
} from "@react-native-google-signin/google-signin";
import { useEffect, useState } from "react";

import { Center } from "@/components/ui/center";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  useEffect(() => {
    GoogleSignin.configure({
      webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      // scopes: ["https://www.googleapis.com/auth/drive.readonly"], // what API you want to access on behalf of the user, default is email and profile
      offlineAccess: true,
      // hostedDomain: "", // specifies a hosted domain restriction
      // forceCodeForRefreshToken: false, // [Android] related to `serverAuthCode`, read the docs link below *.
      // accountName: "", // [Android] specifies an account name on the device that should be used
      iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
      // openIdRealm: "", // [iOS] The OpenID2 realm of the home web server. This allows Google to include the user's OpenID Identifier in the OpenID Connect ID token.
      profileImageSize: 150, // [iOS] The desired height (and width) of the profile image. Defaults to 120px
    }); 

    console.log("Google Signin configured!!", `${process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID}`);
  }, []);

  const [_, setSession] = useStorageState("session");
  const { session, signIn } = useSession();

  const router = useRouter();

  console.log("SeSSSIon INOF PREV", session);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [googleResponse, setGoogleResponse] = useState<any>(null);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleLogin = async () => {
    try {
      console.log("email", email);
      console.log("password", password);

      const res = await loginWithEmail(email, password, setSession);
      // const res = await signInWithEmailAndPassword(auth, email, password);
      console.log("SeSSSIon INOF NEXT", session);
      console.log("res Login", res);
      // setError(null);
      // setEmail("");
      // setPassword("");
      signIn();
    } catch (error) {
      console.log("error", error);
      setError(
        `Error during login: ${(error as Error).message || "Unknown error"}`
      );
    }
  };

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  const handleGoogleSignIn = async () => {
    try {
      setGoogleLoading(true);
      await GoogleSignin.hasPlayServices({
        showPlayServicesUpdateDialog: true,
      }); // for android devices only
      const response = await GoogleSignin.signIn();

      if (isSuccessResponse(response)) {
        setGoogleResponse(response.data);
        const { user, idToken } = response.data;
        console.log("Google Sign In Response:", response.data);

        setSession({
          uid: user.id,
          email: user.email,
          displayName: user.name,
          profilePic: user.photo,
        });

        // Create a Google credential with the token
        const googleCredential = GoogleAuthProvider.credential(idToken);

        // Sign-in the user with the credential
        signInWithCredential(getAuth(), googleCredential);

        router.replace("/(protected)/(home)");
      } else {
        setError(
          `Google Sign cancelled by user`
        );
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
    <Center className="flex-1">
    <FormControl className="bg-white p-4 border rounded-lg border-outline-300 mx-6">
      <VStack space="xl">
        <Heading className="text-typography-900">Login</Heading>
        <VStack space="xs">
          <Text className="text-typography-500">Email</Text>
          <Input className="min-w-[250px]">
            <InputField type="text" onChangeText={setEmail} />
          </Input>
        </VStack>
        <VStack space="xs">
          <Text className="text-typography-500">Password</Text>
          <Input className="text-center">
            <InputField
              type={showPassword ? "text" : "password"}
              onChangeText={setPassword}
            />
            <InputSlot className="pr-3" onPress={handleState}>
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} />
            </InputSlot>
          </Input>
        </VStack>
        <Button className="ml-auto" onPress={handleLogin}>
          <ButtonText className="text-typography-0">Log in</ButtonText>
        </Button>
      </VStack>

      <VStack space="md" className="mt-4">
        <Text className="text-typography-500 text-center">
          Or log in with Google
        </Text>
        <GoogleSigninButton
          onPress={handleGoogleSignIn}
          size={GoogleSigninButton.Size.Wide}
          color={GoogleSigninButton.Color.Dark}
          disabled={googleLoading}
        />
      </VStack>

      {error && <Text className="text-red-500 mt-2">{error}</Text>}
    </FormControl>
    </Center>
  );
}
