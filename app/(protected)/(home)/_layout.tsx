import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { notificationApi } from "@/config/backend";
import { Colors } from "@/lib/constants/Colors";
import { useSession } from "@/lib/providers/AuthContext";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { FontAwesome, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Image, Platform, TouchableOpacity } from "react-native";

export default function TabLayout() {
  const { open, setOpen } = useContext(DrawerContext);
  const { session } = useSession();
  const [totalUnreadNotifications, setTotalUnreadNotifications] = useState(0);

  useEffect(() => {
    const fetchNotifications = async () => {
      if (!session?.uid) return;
      const count = await notificationApi.getUnreadNotificationsCount({
        userId: session.uid,
      });
      setTotalUnreadNotifications(count);
    };
    fetchNotifications();
  }, [session]);

  return (
    <Tabs
      screenOptions={({ navigation }) => {
        return {
          headerShadowVisible: true,
          headerStyle: {
            backgroundColor: Colors.light.tint,
          },
          tabBarHideOnKeyboard: Platform.OS === "android" ? true : undefined,
          headerTitle: () => (
            <TouchableOpacity onPressOut={() => navigation.navigate("index")}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={{
                  height: 40,
                  resizeMode: "contain",
                  width: 140,
                  marginBottom: 10,
                }}
              />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPressOut={() => navigation.navigate("notifications")}
              className="mr-5"
            >
              <Box className="relative">
                <Ionicons
                  name="notifications-outline"
                  size={28}
                  color="black"
                />
                {totalUnreadNotifications > 0 && (
                  <Box className="absolute -top-1 -right-1 bg-red-500 rounded-full min-w-[20px] h-5 flex items-center justify-center">
                    <Text className="text-white text-xs font-bold px-1">
                      {totalUnreadNotifications > 9
                        ? "9+"
                        : totalUnreadNotifications}
                    </Text>
                  </Box>
                )}
              </Box>
            </TouchableOpacity>
          ),

          headerLeft: () => (
            <TouchableOpacity
              onPressOut={() => setOpen(!open)}
              className="ml-5"
            >
              <Avatar size="md" className="mb-4 border-2 border-gray-900">
                <AvatarFallbackText>{session?.displayName}</AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: session?.profilePic || "",
                  }}
                />
              </Avatar>
            </TouchableOpacity>
          ),
          headerTitleAlign: "center",

          tabBarActiveTintColor: Colors["dark"].tabIconSelected,
          tabBarInactiveTintColor: Colors["dark"].muted,
          // tabBarButton: HapticTab,
          tabBarStyle: Platform.select({
            ios: {
              position: "absolute",
              backgroundColor: Colors["light"].tint, // set iOS tab bar color (keeps absolute positioning)
            },
            default: {
              backgroundColor: Colors["light"].tint, // Android / default tab bar color
              height: 75,
              elevation: 8, // Android shadow
            },
          }),
        };
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Discover",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={28} name="star-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="communities"
        options={{
          title: "Connect",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="hand-scissors-o" color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="profile/edit-profile"
        options={{
          href: null,
          headerShadowVisible: true,
        }}
      />

      <Tabs.Screen
        name="blog/index"
        options={{
          title: "Blog",
          tabBarIcon: ({ color }) => (
            <FontAwesome size={22} name="newspaper-o" color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="blog/[slug]"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
          name="profile/index"
          options={{
              title: "Profile",
              tabBarIcon: ({ color }) => (
                  <FontAwesome5 name="user-alt" size={22} color={color} />
              ),
          }}
      />
    </Tabs>
  );
}
