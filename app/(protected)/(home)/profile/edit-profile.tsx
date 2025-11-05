import ParallaxScrollView from "@/components/ParallaxScrollView";
import EditProfileComponent from "@/components/profile/EditProfile";

export default function EditComponentScreen() {
  return (
    <ParallaxScrollView classNames="p-6">
      <EditProfileComponent />
    </ParallaxScrollView>
  );
}
