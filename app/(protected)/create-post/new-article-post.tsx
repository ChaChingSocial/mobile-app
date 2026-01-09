import NewArticlePost from "@/components/new-post/NewArticlePost";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewArticlePostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewArticlePost />
    </SafeAreaView>
  );
}