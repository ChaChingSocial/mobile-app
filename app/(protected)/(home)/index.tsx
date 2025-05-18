import MainNewsfeed from "@/components/home/MainNewsFeed";
import SideBar from "@/components/profile/SideBar";
import { Box } from "@/components/ui/box";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { useRouter } from "expo-router";
import { useContext } from "react";
import { TouchableOpacity } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

export default function HomeScreen() {
  const { open, setOpen } = useContext(DrawerContext);
  const router = useRouter();

  return (
    <Box className="flex-1 relative">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="bg-white"
      >
        <MainNewsfeed />
        <SideBar open={open} onOpenChange={setOpen} />
      </ScrollView>

      <TouchableOpacity
        className="p-3 absolute bottom-28 right-2 z-50 h-16 w-16 bg-secondary-0 shadow-2xl rounded-full items-center justify-center"
        onPress={() => router.push("/(protected)/new-post")}
      >
        <AddIcon color="white" className="p-5 w-2 h-2" />
      </TouchableOpacity>
    </Box>
  );
}
