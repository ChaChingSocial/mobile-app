import { HelloWave } from "@/components/HelloWave";
import SideBar from "@/components/profile/SideBar";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { useContext } from "react";
import { TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function HomeScreen() {
  const { open, setOpen } = useContext(DrawerContext);

  return (
    <ScrollView contentInsetAdjustmentBehavior={"automatic"}>
      <HelloWave />
      <TouchableOpacity onPressOut={() => setOpen(true)}>
        <Avatar size="md">
          <AvatarFallbackText>Jane Doe</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
            }}
          />
        </Avatar>
      </TouchableOpacity>
      <SideBar open={open} onOpenChange={setOpen} />
    </ScrollView>
  );
}
