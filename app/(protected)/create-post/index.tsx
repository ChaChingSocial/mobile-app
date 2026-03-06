import NewPost from "@/components/new-post/NewPost";
import { SafeAreaView } from "react-native-safe-area-context";
import {Colors} from "@/lib/constants/Colors";

export default function NewPostScreen() {
  return (
      <SafeAreaView
          style={{ backgroundColor: Colors.dark.tint }}
          className="flex-1 pt-6"
      >
          <NewPost />
    </SafeAreaView>
  );
}
