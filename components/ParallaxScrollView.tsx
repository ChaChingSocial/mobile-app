import { useBottomTabOverflow } from "@/components/ui/TabBarBackground";
import type { PropsWithChildren } from "react";
import Animated, { useAnimatedRef } from "react-native-reanimated";

type Props = PropsWithChildren<{
  classNames?: string;
}>;

export default function ParallaxScrollView({ children, classNames }: Props) {
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  const bottom = useBottomTabOverflow();

  return (
    <Animated.ScrollView
      ref={scrollRef}
      scrollEventThrottle={16}
      scrollIndicatorInsets={{ bottom }}
      contentContainerStyle={{ paddingBottom: bottom }}
    >
      <Animated.View className={classNames}>{children}</Animated.View>
    </Animated.ScrollView>
  );
}
