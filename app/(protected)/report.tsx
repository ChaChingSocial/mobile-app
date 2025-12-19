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
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import {
  sendNotification,
  sendNotificationEmail,
} from "@/lib/api/notifications";
import { createAbuseReport } from "@/lib/api/user";
import {
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import Toast from "react-native-toast-message";
import { SafeAreaView } from "react-native-safe-area-context";
import { Checkbox, CheckboxIcon, CheckboxIndicator, CheckboxLabel } from "@/components/ui/checkbox";
import { CheckIcon } from "@/components/ui/icon";

export default function ReportScreen() {
  const {
    id: postId,
    userId: reportedUserId,
    communityId,
  } = useLocalSearchParams<{ id?: string; userId?: string; communityId?: string }>();
  const router = useRouter();
  const { session } = useSession();
  const { blockUser } = useBlockedUsers();

  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [alsoBlockUser, setAlsoBlockUser] = useState(false);
  const reporterName =
    session?.displayName || session?.email;

  const handleSubmit = async () => {
    if (!postId && !reportedUserId) {
      console.warn("Missing post id or user id in report screen");
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
      let abuseReportId: string | undefined;

      // Create abuse report in Firebase
      if (session?.uid) {
        abuseReportId = await createAbuseReport(
          session.uid,
          reportedUserId,
          reason,
          postId
        );
      }

      // Send email notification to developers
      const message = `Report received\n\nPost ID: ${postId || "N/A"}\nReported User ID: ${reportedUserId || "N/A"}\nReported by: ${reporterName} (${session?.uid})\n\nReason:\n${reason}\n\nAbuse Report ID: ${abuseReportId}`;

      await sendNotification(
        session?.uid,
        communityId,
        message,
        NotificationNotificationTypeEnum.Reported,
        NotificationEntityTypeEnum.Post
      );
      
      // Developer emails to notify
      const developerEmails = [
        "rushikesh.joshi@chachingsocial.io",
        "sonia.lomo@fatfiresocial.com",
        "mabel.oza@chachingsocial.io",
      ];
      
      await sendNotificationEmail(
        NotificationNotificationTypeEnum.Reported,
        "",
        "Content Report",
        "",
        message,
        NotificationEntityTypeEnum.Post,
        developerEmails,
        session?.uid
      );

      // Block user if requested
      if (alsoBlockUser && reportedUserId && session?.uid) {
        const blockSuccess = await blockUser(reportedUserId, reason, abuseReportId);
        if (blockSuccess) {
          Toast.show({
            type: "success",
            text1: "Report submitted and user blocked",
            text2: "You won't see their content anymore.",
          });
        } else {
          Toast.show({
            type: "info",
            text1: "Report submitted",
            text2: "Failed to block user, but report was recorded.",
          });
        }
      } else {
        Toast.show({
          type: "success",
          text1: "Report submitted",
          text2: "Thank you for helping keep our community safe.",
        });
      }

      console.log("called notification email", {
        type: NotificationNotificationTypeEnum.Reported,
        userId: session?.uid,
        message,
        entityType: NotificationEntityTypeEnum.Post,
        abuseReportId,
      });
      router.back();
    } catch (error) {
      console.error("Failed to send report:", error);
      Toast.show({
        type: "error",
        text1: "Failed to submit report",
        text2: "Please try again.",
      });
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

            {reportedUserId && (
              <Checkbox
                value="blockUser"
                isChecked={alsoBlockUser}
                onChange={setAlsoBlockUser}
              >
                <CheckboxIndicator>
                  <CheckboxIcon as={CheckIcon} />
                </CheckboxIndicator>
                <CheckboxLabel className="ml-2">
                  Also block this user
                </CheckboxLabel>
              </Checkbox>
            )}

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
