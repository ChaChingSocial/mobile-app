import ExampleNotification from "@/components/notifications/ExampleNotification";
import NotificationList from "@/components/notifications/NotificationMenu";
import PushNotificationTest from "@/components/notifications/PushNotificationTest";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { useSession } from "@/lib/providers/AuthContext";

export default function NotificationScreen() {
  console.log("NotificationScreen rendered");
  const {session} = useSession();

  return (
    <ParallaxScrollView>
      {/* <PushNotificationTest userId={userId} />
      <ExampleNotification /> */}
      <NotificationList />
    </ParallaxScrollView>
  );
}
