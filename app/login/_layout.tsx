import { Button, ButtonText } from "@/components/ui/button";
import { Stack, useRouter } from "expo-router";
import { Image, TouchableOpacity } from "react-native";

export default function LoginLayout() {
  const router = useRouter();

  return (
    <Stack
      screenOptions={({ navigation }) => {
        return {
          headerTitle: () => (
            <TouchableOpacity onPressOut={() => navigation.navigate("index")}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={{ height: 40, resizeMode: "contain", width: 140 }}
              />
            </TouchableOpacity>
          ),
          headerBackVisible: true,
          headerTitleAlign: "center",
          headerShadowVisible: false,
        };
      }}
    >
      <Stack.Screen
        name="index"
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="login-form"
        options={{
          headerRight: () => (
            <Button variant="link" onPress={() => router.push("/register")}>
              <ButtonText>Sign up</ButtonText>
            </Button>
          ),
        }}
      />
      <Stack.Screen name="forgot-password" />
    </Stack>
  );
}
