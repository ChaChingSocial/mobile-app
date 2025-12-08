import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { userApi } from "@/config/backend";
import { useStorageState } from "@/hooks/useStorageState";
import { loginWithEmail } from "@/lib/api/auth";
import { useSession } from "@/lib/providers/AuthContext";
import { useUserStore } from "@/lib/store/user";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";

export default function LoginFormScreen() {
  const [_, setSession] = useStorageState("session");
  const { session, signIn } = useSession();
  const { setUser } = useUserStore.getState();

  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      console.log("email", email);
      console.log("password", password);

      const user = await loginWithEmail(email, password);
      // const res = await signInWithEmailAndPassword(auth, email, password);
      console.log("SeSSSIon INOF NEXT", session);
      console.log("res Login", user);

      await userApi.getUserById({ userId: user.uid }).then((res) => {
        setUser(res);
        setSession({
          uid: res.id ?? "",
          email: res.email ?? "",
          displayName: res.username ?? "",
          profilePic: res.profilePic ?? "",
        });
        console.log("session in loginWithEmail", session);
        console.log("user get user but ni ID", res);
      });

      signIn();
    } catch (error) {
      console.log("error", error);
      const code = (error as any)?.code || "";
      let uiMessage = "Unable to log in. Please try again.";

      if (
        code === "auth/invalid-credential" ||
        code === "auth/wrong-password"
      ) {
        uiMessage = "Incorrect email or password.";
      } else if (code === "auth/invalid-email") {
        uiMessage = "Please enter a valid email address.";
      } else if (code === "auth/user-disabled") {
        uiMessage = "This account has been disabled.";
      } else if (code === "auth/user-not-found") {
        uiMessage = "No account found with that email.";
      } else if (code === "auth/too-many-requests") {
        uiMessage = "Too many attempts. Please try again later.";
      }

      setError(uiMessage);
    }
  };

  const handleState = () => {
    setShowPassword((showState) => {
      return !showState;
    });
  };

  return (
    <Center className="flex-1 bg-[#7ad8bd]">
      <FormControl className="p-4 mx-6 flex-1 justify-between items-center">
        <VStack space="xl" className="mt-12">
          <Heading className="text-center">Log in</Heading>

          <Input size="xl" className="min-w-[250px] rounded-full pl-2 bg-white">
            <InputField
              type="text"
              onChangeText={setEmail}
              placeholder="jane.doe@hotmail.com"
            />
          </Input>

          <Input size="xl" className="text-center rounded-full w-full pl-2 bg-white">
            <InputField
              type={showPassword ? "text" : "password"}
              onChangeText={setPassword}
              placeholder="password"
            />
            <InputSlot className="pr-3" onPress={handleState}>
              <FontAwesome5 name={showPassword ? "eye" : "eye-slash"} />
            </InputSlot>
          </Input>

          <Button
            variant="link"
            className="mr-auto"
            onPress={() => router.push("/login/forgot-password")}
          >
            <ButtonText className="text-black">
              Forgot Password?
            </ButtonText>
          </Button>
        </VStack>

        <Button
          size="xl"
          className="w-full rounded-full bg-white" //bg-[#40c057]
          onPress={handleLogin}
        >
          <ButtonText className="flex-1 text-center text-black">
            Log in
          </ButtonText>
        </Button>

        {error && <Text className="text-red-500 mt-2">{error}</Text>}
      </FormControl>
    </Center>
  );
}
