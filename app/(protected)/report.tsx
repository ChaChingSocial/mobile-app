import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Heading } from "@/components/ui/heading";
import { Text } from "@/components/ui/text";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { Button, ButtonText } from "@/components/ui/button";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import { useSession } from "@/lib/providers/AuthContext";
import {
  sendNotification,
  sendNotificationEmail,
} from "@/lib/api/notifications";
import {
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native";

export default function ReportScreen() {
  const { id: postId } = useLocalSearchParams<{ id?: string }>();
  const router = useRouter();
  const { session } = useSession();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const reporterName =
    session?.displayName || session?.email || session?.uid || "Unknown User";

  const handleSubmit = async () => {
    if (!postId) {
      console.warn("Missing post id in report screen");
      return;
    }
    if (!reason.trim()) {
      Toast.show({
        type: "error",
        text1: "Please provide a reason for reporting.",
      });
      return;
    }

    try {
      setSubmitting(true);
      const message = `Report received\n\nPost ID: ${postId}\nReported by: ${reporterName}\n\nReason:\n${reason}`;

      await sendNotificationEmail(
        NotificationNotificationTypeEnum.Reported,
        "",
        "Content Report",
        "",
        message,
        NotificationEntityTypeEnum.Post,
        [],
        session?.uid
      );

      // await sendNotification(
      //   session?.uid,
      //   "",
      //   message,
      //   NotificationNotificationTypeEnum.Reported,
      //   NotificationEntityTypeEnum.Post
      // );
      console.log("called notification email", {
        type: NotificationNotificationTypeEnum.Reported,
        userId: session?.uid,
        message,
        entityType: NotificationEntityTypeEnum.Post,
        recipients: ["sonylomo1@gmail.com"],
      });
      router.back();
    } catch (error) {
      console.error("Failed to send report:", error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView>
      <ParallaxScrollView>
        <Box className="px-4 py-6 flex-1">
          <VStack space="lg">
            <Heading size="lg">Report content</Heading>
            <Text size="sm" className="text-gray-600">
              Please describe why you're reporting this content. We'll review it
              shortly.
            </Text>

            <FormControl isRequired>
              <FormControlLabel>
                <FormControlLabelText>Reason</FormControlLabelText>
              </FormControlLabel>
              <Textarea size="lg" className="min-h-32">
                <TextareaInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="Provide details..."
                  multiline
                  textAlignVertical="top"
                />
              </Textarea>
            </FormControl>

            <Button
              className="mt-12"
              size="lg"
              action="primary"
              isDisabled={submitting || !reason.trim()}
              onPress={handleSubmit}
            >
              <ButtonText>{submitting ? "Submitting..." : "Submit"}</ButtonText>
            </Button>
          </VStack>
        </Box>
      </ParallaxScrollView>
    </SafeAreaView>
  );
}
