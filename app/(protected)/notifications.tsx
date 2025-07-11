import NotificationList from "@/components/notifications/NotificationMenu";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useSession } from "@/lib/providers/AuthContext";

export default function NotificationScreen() {
  console.log("NotificationScreen rendered");
  const { session } = useSession();

  return (
    <ParallaxScrollView>
      <NotificationList />
    </ParallaxScrollView>
  );
}
