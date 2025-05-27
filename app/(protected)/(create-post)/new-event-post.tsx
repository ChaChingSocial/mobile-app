import NewPost from "@/components/new-post/NewPost";
import { useNavigation } from "expo-router";
import { SafeAreaView } from "react-native";

export default function NewEventPostScreen() {
  return (
    <SafeAreaView className="flex-1 bg-white pt-6 mt-4">
      <NewPost />
    </SafeAreaView>
  );
}

const Navigation = {
  index: 0,
  key: "stack-VQV8B29-gtXTIF3U1FGDh",
  preloadedRoutes: [],
  routeNames: [
    "index",
    "new-link-post",
    "new-event-post",
    "new-image-post",
    "new-podcast-post",
  ],
  routes: [
    {
      key: "new-event-post-Fmex5enA3uUzgqh_5T9em",
      name: "new-event-post",
      params: [Object],
      path: undefined,
    },
  ],
  stale: false,
  type: "stack",
};
