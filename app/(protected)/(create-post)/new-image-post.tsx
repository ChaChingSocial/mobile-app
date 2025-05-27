import NewPost from "@/components/new-post/NewPost";
import { SafeAreaView } from "react-native";

export default function NewImagePostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewPost />
    </SafeAreaView>
  );
}
