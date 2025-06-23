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
import { Linking, Pressable, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";

import { Link, useRouter } from "expo-router";
import { Box } from "../ui/box";
import { Divider } from "../ui/divider";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";
import { VStack } from "../ui/vstack";
import { useSession } from "@/lib/providers/AuthContext";
import { useEffect, useState } from "react";
import { checkIfFinFluencer, fetchFollowers, fetchFollowing } from "@/lib/api/user";

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
        <DrawerContent className="pt-16">
          <DrawerHeader>
            <VStack space="md">
              <TouchableOpacity onPressOut={() => {}}>
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
                <Heading size="xl">{session?.displayName}</Heading>
                <Text size="md" className="font-extralight">
                  @{session?.displayName}
                </Text>
              </Box>
              <HStack space="md" reversed={false}>
                <Box className="flex flex-row gap-1">
                  <Text bold>{following}</Text>
                  <Text className="font-extralight">Following</Text>
                </Box>
                <Box className="flex flex-row gap-1">
                  <Text bold>{followers}</Text>
                  <Text className="font-extralight">Followers</Text>
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
                    Linking.openURL(
                      `https://www.chaching.social/profile/${session?.displayName}?userId=${session?.uid}&isFinfluencer=${isFinfluencer}`
                    );
                  }}
                >
                  <FontAwesome5 name="user" size={20} color="black" />
                  <Text size="xl" bold>
                    Profile
                  </Text>
                </Pressable>
                <Pressable
                  className="flex flex-row gap-3 items-center"
                  onPress={() => {
                    Linking.openURL("https://www.chaching.social/settings");
                    onOpenChange(false);
                  }}
                >
                  <FontAwesome5 name="cog" size={20} color="black" />

                  <Text size="xl" bold>
                    Settings
                  </Text>
                </Pressable>
              </VStack>
            </Box>
          </DrawerBody>
          <DrawerFooter className="border-t border-background-200 pt-6">
            <TouchableOpacity
              onPress={() => {
                signOut();
                onOpenChange(false);
              }}
              className="w-fit border-2 border-background-200 rounded-md bg-background-200 p-2"
            >
              <FontAwesome name="sign-out" size={16} color="black" />
            </TouchableOpacity>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </SafeAreaView>
  );
}
