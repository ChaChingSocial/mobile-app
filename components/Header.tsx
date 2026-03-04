import { Ionicons } from "@expo/vector-icons";
import { View, TouchableOpacity, Image } from "react-native";

export function Header() {
  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
      }}
    >
      <Image
        source={require("@/assets/images/logo.svg")}
        style={{ width: 120, height: 40, paddingBottom: 10, resizeMode: "contain" }}
      />

      <TouchableOpacity
        onPress={() => console.log("Navigate to notifications")}
      >
        <Ionicons name="notifications-outline" size={24} color="black" />
      </TouchableOpacity>
    </View>
  );
}
