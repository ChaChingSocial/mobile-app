import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { Link, Stack } from "expo-router";
import { StyleSheet, View } from "react-native";

/**
 * Displays a fallback screen indicating that the requested page does not exist, with a link to navigate back to the home screen.
 */
export default function NotFoundScreen() {
  return (
      <View style={styles.container}>
        <Heading size="2xl">This screen doesn't exist.</Heading>
        <Link href="/(protected)/(home)" style={styles.link}>
          <Text>Go to home screen!</Text>
        </Link>
      </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
