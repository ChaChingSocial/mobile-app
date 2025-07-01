import ExampleNotification from "@/components/notifications/ExampleNotification";
import NotificationList from "@/components/notifications/NotificationMenu";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function NotificationScreen() {
  console.log("NotificationScreen rendered");

  return (
    <ParallaxScrollView>
      <ExampleNotification />
      <NotificationList />
    </ParallaxScrollView>
  );
}
