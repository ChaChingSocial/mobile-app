import { useSession } from "@/lib/providers/AuthContext";
import { Button, ButtonText } from "@/components/ui/button";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { FontAwesome5 } from "@expo/vector-icons";
import { useState } from "react";
import { loginWithEmail } from "@/lib/api/auth";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useStorageState } from "@/hooks/useStorageState";
import { auth } from "@/config/firebase";
import { userApi } from "@/config/backend";

export default function LoginScreen() {
  const [_, setSession] = useStorageState("session");
  const { session, signIn } = useSession();
  console.log("SeSSSIon INOF PREV", session);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

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


  return (
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
          <ButtonText className="text-typography-0">Save</ButtonText>
        </Button>
      </VStack>
      {error && <Text className="text-red-500 mt-2">{error}</Text>}
    </FormControl>
  );
}
