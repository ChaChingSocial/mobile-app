import { useSession } from "@/lib/providers/AuthContext";
import { Text, View } from "react-native";

export default function Login() {
  const { signIn } = useSession();
  return (
    <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
      <Text
        onPress={() => {
          signIn();
        }}
      >
        Log In
      </Text>
    </View>
  );
}
