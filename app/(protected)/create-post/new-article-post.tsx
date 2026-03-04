import NewArticlePost from "@/components/new-post/NewArticlePost";
import { SafeAreaView } from "react-native-safe-area-context";
import {Colors} from "@/lib/constants/Colors";

export default function NewArticlePostScreen() {
  return (
      <SafeAreaView
          style={{ backgroundColor: Colors.dark.tint }}
          className="flex-1 pt-6"
      >
          <NewArticlePost />
    </SafeAreaView>
  );
}
