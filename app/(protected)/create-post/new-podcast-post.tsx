import NewPodcastPost from "@/components/new-post/NewPodcastPost";
import { SafeAreaView } from "react-native-safe-area-context";
import { Colors } from "@/lib/constants/Colors";

export default function NewPodcastPostScreen() {
  return (
    <SafeAreaView
      className="flex-1 pt-6"
      style={{ backgroundColor: Colors.dark.tint }}
    >
      <NewPodcastPost />
    </SafeAreaView>
  );
}
