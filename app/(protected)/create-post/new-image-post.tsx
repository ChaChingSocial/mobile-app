import NewImagePost from "@/components/new-post/NewImagePost";
import { SafeAreaView } from "react-native-safe-area-context";
import {Colors} from "@/lib/constants/Colors";

export default function NewImagePostScreen() {
  return (
    <SafeAreaView
        style={{ backgroundColor: Colors.dark.tint }}
        className="flex-1 pt-6"
    >
      <NewImagePost />
    </SafeAreaView>
  );
}
