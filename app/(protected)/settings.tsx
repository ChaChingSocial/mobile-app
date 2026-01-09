import ParallaxScrollView from "@/components/ParallaxScrollView";
import { SettingsComponent } from "@/components/settings/SettingsScreen";
import AccountDeletion from "@/components/about/AccountDeletion";

export default function SettingsScreen() {
  return (
    <ParallaxScrollView classNames="p-6">
      <SettingsComponent />
      <AccountDeletion />
    </ParallaxScrollView>
  );
}
