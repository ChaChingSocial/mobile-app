import NewVideoLinkPost from "@/components/new-post/NewVideoLinkPost";
import { SafeAreaView } from "react-native-safe-area-context";
import {Colors} from "@/lib/constants/Colors";

export default function NewLinkPostScreen() {
  return (
      <SafeAreaView
          style={{ backgroundColor: Colors.dark.tint }}
          className="flex-1 pt-6"
      >
          <NewVideoLinkPost />
    </SafeAreaView>
  );
}
