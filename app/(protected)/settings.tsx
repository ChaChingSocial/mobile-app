import ParallaxScrollView from "@/components/ParallaxScrollView";
import { SettingsComponent } from "@/components/settings/SettingsScreen";

export default function SettingsScreen() {
  return (
    <ParallaxScrollView classNames="p-6">
      <SettingsComponent />
    </ParallaxScrollView>
  );
}
