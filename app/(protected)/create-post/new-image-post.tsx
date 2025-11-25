import NewImagePost from "@/components/new-post/NewImagePost";
import { SafeAreaView } from "react-native-safe-area-context";

export default function NewImagePostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewImagePost />
    </SafeAreaView>
  );
}
