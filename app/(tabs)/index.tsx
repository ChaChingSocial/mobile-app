import { HelloWave } from "@/components/HelloWave";
import ParallaxScrollView from "@/components/ParallaxScrollView";

export default function HomeScreen() {
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#fff", dark: "red" }}
      // headerImage={
      //   <Image
      //     source={require("@/assets/images/logo.svg")}
      //     style={styles.reactLogo}
      //   />
      // }
    >
      <HelloWave />
    </ParallaxScrollView>
  );
}
