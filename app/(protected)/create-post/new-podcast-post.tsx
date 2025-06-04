import NewPodcastPost from "@/components/new-post/NewPodcastPost";
import { SafeAreaView } from "react-native";

export default function NewPodcastPostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewPodcastPost />
    </SafeAreaView>
  );
}
