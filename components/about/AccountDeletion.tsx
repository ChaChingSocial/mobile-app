import { Button, ButtonText } from "@/components/ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import React from "react";
import { Box } from "../ui/box";
import { Linking } from "react-native";
import { VStack } from "../ui/vstack";

export default function AccountDeletion() {
  const [showDrawer, setShowDrawer] = React.useState(false);
  return (
    <Box>
      <Button
        onPress={() => {
          setShowDrawer(true);
        }}
        className="mt-8 bg-transparent border border-red-600 bg-white"
      >
        <ButtonText className="text-red-600">Delete Account</ButtonText>
      </Button>
      <Drawer
        isOpen={showDrawer}
        onClose={() => {
          setShowDrawer(false);
        }}
        size="md"
        anchor="bottom"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerHeader>
            <Heading size="2xl">
              Are you sure you want to delete your account?
            </Heading>
          </DrawerHeader>
          <DrawerBody>
            <Box className="flex flex-col justify-between h-full">
              <Text size="lg" className="text-typography-800">
                We will redirect you to a form to confirm your deletion. This
                action cannot be undone.
              </Text>
              <VStack className="gap-4 mt-16">
                <Button
                  onPress={() => {
                    Linking.openURL("https://form.jotform.com/252326934974063");
                    setShowDrawer(false);
                  }}
                  className="flex-1 bg-red-600"
                >
                  <ButtonText className="text-white">Yes, delete</ButtonText>
                </Button>
                <Button
                  onPress={() => {
                    setShowDrawer(false);
                  }}
                  className="flex-1 bg-transparent border border-black"
                >
                  <ButtonText className="text-typography-black">
                    Cancel
                  </ButtonText>
                </Button>
              </VStack>
            </Box>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
}
