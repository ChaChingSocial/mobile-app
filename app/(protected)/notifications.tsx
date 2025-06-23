import NotificationList from "@/components/notifications/NotificationMenu";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function NotificationScreen() {
  return (
    <ParallaxScrollView>
      <NotificationList />
    </ParallaxScrollView>
  );
}
