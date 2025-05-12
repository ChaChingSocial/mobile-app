import MainNewsfeed from "@/components/home/MainNewsFeed";
import SideBar from "@/components/profile/SideBar";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { useContext } from "react";
import { ScrollView } from "react-native-gesture-handler";

export default function HomeScreen() {
  const { open, setOpen } = useContext(DrawerContext);

  return (
    <ScrollView contentInsetAdjustmentBehavior={"automatic"} className="bg-white">
      <MainNewsfeed />
      <SideBar open={open} onOpenChange={setOpen} />
    </ScrollView>
  );
}
