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
import { useState } from "react";
import { Center } from "@/components/ui/center";
import { useRouter } from "expo-router";
import { useUserStore } from "@/lib/store/user";
import { userApi } from "@/config/backend";

export default function LoginFormScreen() {
  const [_, setSession] = useStorageState("session");
  const { session, signIn } = useSession();
  const { setUser } = useUserStore.getState();

  const router = useRouter();

  console.log("SeSSSIon INOF PREV", session);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    try {
      console.log("email", email);
      console.log("password", password);

      const user = await loginWithEmail(email, password, setSession);
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
      // router.push("/(protected)/(home)");
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

  return (
    <Center className="flex-1 bg-white">
      <FormControl className="p-4 mx-6 flex-1 justify-between items-center">
        <VStack space="xl">
          <Heading className="text-typography-900 text-center">Log in</Heading>

          <Input size="xl" className="min-w-[250px] rounded-full pl-2">
            <InputField
              type="text"
              onChangeText={setEmail}
              placeholder="jane.doe@hotmail.com"
            />
          </Input>

          <Input size="xl" className="text-center rounded-full w-full pl-2">
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
            <ButtonText className="text-primary-50">
              Forgot Password?
            </ButtonText>
          </Button>
        </VStack>
        <Button
          size="xl"
          className="w-full bg-[#40c057] rounded-full"
          onPress={handleLogin}
        >
          <ButtonText className="flex-1 text-center">Log in</ButtonText>
        </Button>

        {error && <Text className="text-red-500 mt-2">{error}</Text>}
      </FormControl>
    </Center>
  );
}
