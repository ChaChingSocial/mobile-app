import { Box } from "@/components/ui/box";
import { Button, ButtonText } from "@/components/ui/button";
import { Center } from "@/components/ui/center";
import { FormControl } from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { resetPassword } from "@/lib/api/auth";
import { useState } from "react";
import Toast from "react-native-toast-message";

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  const handleReset = async () => {
    try {
      await resetPassword(email);
      Toast.show({
        type: "success",
        text1: "Password reset email sent",
      });
    } catch (error) {
      console.log("error", error);
      setError(
        `Error during login: ${(error as Error).message || "Unknown error"}`
      );
    }
  };

  return (
    <Center className="flex-1 bg-[#7ad8bd]">
      <FormControl className="p-4 mx-6 flex-1 justify-between items-center">
        <VStack space="xl">
          <Heading className="text-black text-center">
            Reset your Password
          </Heading>
          <Text className="text-black text-center">
            Enter your email and we'll send you a link to reset your password
          </Text>

<Input size="xl" className="min-w-[250px] rounded-full pl-2 bg-white">
            <InputField
              type="text"
              onChangeText={setEmail}
              placeholder="jane.doe@hotmail.com"
            />
          </Input>

          <Button
            size="xl"
            className="w-full rounded-full bg-white mt-3"
            onPress={handleReset}
          >
            <ButtonText className="flex-1 text-center text-black">Reset Password</ButtonText>
          </Button>
        </VStack>

        {error && <Text className="text-red-500 mt-2">{error}</Text>}
      </FormControl>
    </Center>
  );
}
