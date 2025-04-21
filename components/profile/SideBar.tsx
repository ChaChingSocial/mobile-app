import { Button, ButtonText } from "@/components/ui/button";
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
import { TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";
import React from "react";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";
import { Divider } from "../ui/divider";
import { VStack } from "../ui/vstack";

export default function SideBar({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
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
                  <AvatarFallbackText>Jane Doe</AvatarFallbackText>
                  <AvatarImage
                    source={{
                      uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=687&q=80",
                    }}
                  />
                </Avatar>
              </TouchableOpacity>
              <Box>
                <Heading size="xl">Jane Doe</Heading>
                <Text size="md" className="font-extralight">
                  @janedoe
                </Text>
              </Box>
              <HStack space="md" reversed={false}>
                <Box className="flex flex-row gap-1">
                  <Text bold>206</Text>
                  <Text className="font-extralight">Following</Text>
                </Box>
                <Box className="flex flex-row gap-1">
                  <Text bold>262</Text>
                  <Text className="font-extralight">Followers</Text>
                </Box>
              </HStack>
            </VStack>
          </DrawerHeader>
          <DrawerBody>
            <Box className="flex flex-1 justify-between h-full">
              <Divider className="my-0.5" />
              <VStack space="lg" className="mt-14 ml-2">
                <Box className="flex flex-row gap-3 items-center">
                  <FontAwesome5 name="user" size={20} color="black" />
                  <Text size="xl" bold>Profile</Text>
                </Box>
                <Box className="flex flex-row gap-3 items-center">
                  <FontAwesome5 name="cog" size={20} color="black" />
                  <Text size="xl" bold>Settings</Text>
                </Box>{" "}
              </VStack>
            </Box>
          </DrawerBody>
          <DrawerFooter className="border-t border-background-200 pt-6">
            <TouchableOpacity
              onPress={() => {
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
