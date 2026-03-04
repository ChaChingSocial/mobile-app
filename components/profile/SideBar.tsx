import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@/components/ui/drawer";
import { Heading } from "@/components/ui/heading";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";

import {
  checkIfFinFluencer,
  fetchFollowers,
  fetchFollowing,
} from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Box } from "../ui/box";
import { Divider } from "../ui/divider";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import {Colors} from "@/lib/constants/Colors";

export default function SideBar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { signOut, session } = useSession();
  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  const fetchFinfluencerStatus = async () => {
    if (session?.uid) {
      const res = await checkIfFinFluencer(session.uid);
      setIsFinfluencer(res);
    }
  };

  const fetchFollowersAndFollowing = async () => {
    if (session?.uid) {
      const followersRes = await fetchFollowers(session.uid);
      const followingRes = await fetchFollowing(session.uid);
      setFollowers(followersRes.size);
      setFollowing(followingRes.size);
    }
  };

  useEffect(() => {
    fetchFollowersAndFollowing();
    fetchFinfluencerStatus();
  }, [session?.uid]);

  return (
    <SafeAreaView>
      <Drawer
        isOpen={open}
        onClose={() => {
          onOpenChange(false);
        }}
        size="lg"
        anchor="left"
      >
        <DrawerBackdrop />
        <DrawerContent className="pt-16" style={{backgroundColor: Colors.dark.tint}}>
          <DrawerHeader>
            <VStack space="md">
              <TouchableOpacity
                onPressOut={() => {
                  router.push(`/(protected)/(home)/profile?id=${session?.uid}`);
                  onOpenChange(false);
                }}
              >
                <Avatar size="md">
                  <AvatarFallbackText>
                    {session?.displayName}
                  </AvatarFallbackText>
                  <AvatarImage
                    source={{
                      uri: session?.profilePic || "",
                    }}
                  />
                </Avatar>
              </TouchableOpacity>
              <Box>
                <Heading size="xl" className="text-white">{session?.displayName}</Heading>
              </Box>
              <HStack space="md" reversed={false}>
                <Box className="flex flex-row gap-1">
                  <Text bold className="text-white">{following}</Text>
                  <Text className="font-extralight text-white">Following</Text>
                </Box>
                <Box className="flex flex-row gap-1">
                  <Text bold className="text-white">{followers}</Text>
                  <Text className="font-extralight text-white">Followers</Text>
                </Box>
              </HStack>
            </VStack>
          </DrawerHeader>
          <DrawerBody>
            <Box className="flex flex-1 justify-between h-full">
              <Divider className="my-0.5" />
              <VStack space="lg" className="mt-14 ml-2">
                <Pressable
                  className="flex flex-row gap-3 items-center"
                  onPress={() => {
                    router.push(
                      `/(protected)/(home)/profile?id=${session?.uid}`
                    );
                    onOpenChange(false);
                  }}
                >
                  <FontAwesome5 name="user" size={20} color="white" />
                  <Text size="xl" bold className="text-white">
                    Profile
                  </Text>
                </Pressable>
                <Pressable
                  className="flex flex-row gap-3 items-center"
                  onPress={() => {
                    router.push(`/(protected)/about`);
                    onOpenChange(false);
                  }}
                >
                  <FontAwesome size={24} name="info-circle" color="white" />
                  <Text size="xl" bold className="text-white">
                    About
                  </Text>
                </Pressable>
                <Pressable
                  className="flex flex-row gap-3 items-center"
                  onPress={() => {
                    router.push(`/(protected)/settings`);
                    onOpenChange(false);
                  }}
                >
                  <FontAwesome5 name="cog" size={20} color="white" />
                  <Text size="xl" bold className="text-white">
                    Settings
                  </Text>
                </Pressable>
              </VStack>
            </Box>
          </DrawerBody>
          <DrawerFooter className="border-t border-background-200 pt-6">
            <TouchableOpacity
              className="flex flex-row gap-3 items-center ml-2"
              onPress={() => {
                signOut();
                onOpenChange(false);
              }}
            >
              <FontAwesome name="sign-out" size={20} color="white" />
              <Text size="xl" bold className="text-white">
                Logout
              </Text>
            </TouchableOpacity>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </SafeAreaView>
  );
}
