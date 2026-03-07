import { Box } from "@/components/ui/box";
import { Center } from "@/components/ui/center";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { communityApi } from "@/config/backend";
import { useSession } from "@/lib/providers/AuthContext";
import { FontAwesome, Fontisto } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { TouchableOpacity, Platform } from "react-native";
import {Colors} from "@/lib/constants/Colors";

export default function CommunitiesLayout() {
  const { session } = useSession();
  const params = useLocalSearchParams();
  const router = useRouter();
  const { title, slug, communityId, themeDarkColor, themeLightColor } = params;
  const rawTitle = Array.isArray(title) ? title[0] : title;
  const headerTitle =
    typeof rawTitle === "string" && rawTitle.length > 35
      ? `${rawTitle.slice(0, 35)}...`
      : rawTitle ?? "";

  const [showDrawer, setShowDrawer] = useState(false);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    if (!communityId) {
      console.error("No communityId provided in params");
      return;
    }
    const fetchCommunityData = async () => {
      try {
        const res = await communityApi.getUserCommunityMembership({
          userId: session?.uid ?? "",
        });
        if (res) {
          setIsMember(Array.isArray(res) && res.length > 0);
        }
      } catch (error) {
        console.error("Error fetching community data:", error);
      }
    };
    fetchCommunityData();
  }, [session, communityId]);

  const copyToClipboard = async () => {
    setShowDrawer(false);
    const communityUrl = `https://www.chaching.social/communities/${
      Array.isArray(slug) ? slug[0] : slug
    }?id=${Array.isArray(communityId) ? communityId[0] : communityId}`;
    await Clipboard.setStringAsync(communityUrl);
  };

  return (
    <>
      <Stack
        screenOptions={() => ({
          headerTitle: "",
          headerStyle: {
            backgroundColor:  (Array.isArray(themeDarkColor) ? themeDarkColor[0] : themeDarkColor) || Colors.dark.tint
          },
          headerTintColor: (Array.isArray(themeDarkColor) ? themeDarkColor[0] : themeDarkColor) || Colors.light.text,
          headerRight: () => (
            <Box className="flex flex-row">
              <TouchableOpacity
                onPressOut={() => setShowDrawer(true)}
                className="mr-2"
              >
                <Fontisto name="share" className="top-1" size={16} color="white" />
              </TouchableOpacity>
              <TouchableOpacity
                onPressOut={async () => {
                  if (!isMember) {
                    await communityApi.joinCommunity({
                      communityId: Array.isArray(communityId)
                        ? communityId[0]
                        : "",
                      userId: session?.uid ?? "",
                    });
                    setIsMember(true);
                  } else {
                    await communityApi.leaveCommunity({
                      communityId: Array.isArray(communityId)
                        ? communityId[0]
                        : "",
                      userId: session?.uid ?? "",
                    });
                    setIsMember(false);
                  }
                }}
                className="mr-5 border border-white px-3 rounded-2xl"
              >
                <Text className="text-white">
                  {isMember ? "Joined" : "Join"}
                </Text>
              </TouchableOpacity>
            </Box>
          ),
          headerLeft:
            Platform.OS === "ios"
              ? () => (
                  <Box className="flex flex-row items-center gap-2">
                    <TouchableOpacity
                      onPressOut={() => router.back()}
                      className="mr-1"
                    >
                      <Fontisto name="arrow-left" size={16} color="white" />
                    </TouchableOpacity>
                    <Text className="text-white">{headerTitle}</Text>
                  </Box>
                )
              : () => <Text className="text-white">{headerTitle}</Text>,
          headerBackVisible: true,
          headerBackTitle: "Back",
        })}
      >
        <Stack.Screen name="about" />

        <Stack.Screen
          name="[slug]"
          options={{
            headerShown: true,
            headerBackVisible: true,
            headerBackTitle: "Back",
          }}
        />
      </Stack>
      <Drawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
        }}
        size="sm"
        anchor="bottom"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader>
            <Heading size="3xl">Share</Heading>
          </DrawerHeader>
          <DrawerBody>
            <TouchableOpacity onPressOut={copyToClipboard}>
              <VStack className="items-center ">
                <Center className="bg-gray-200 w-12 h-12 rounded-full">
                  <FontAwesome name="link" size={24} color="black" />
                </Center>
                <Text className="text-gray-800">Copy Link</Text>
              </VStack>
            </TouchableOpacity>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </>
  );
}
