import NewVideoLinkPost from "@/components/new-post/NewVideoLinkPost";
import { SafeAreaView } from "react-native";

export default function NewLinkPostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewVideoLinkPost />
    </SafeAreaView>
  );
}
