import { useSession } from "@/lib/providers/AuthContext";
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import { Post as PostType } from "@/types/post";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, ButtonText } from "../ui/button";
import { Menu, MenuItem, MenuItemLabel } from "../ui/menu";
import BlockUserModal from "../BlockUserModal";
import { useState } from "react";
import { createAbuseReport } from "@/lib/api/user";
import { sendNotificationEmail } from "@/lib/api/notifications";
import {
  NotificationEntityTypeEnum,
  NotificationNotificationTypeEnum,
} from "@/_sdk";
import Toast from "react-native-toast-message";

export const PostMenu = ({
  post,
  type,
  onEdit,
  onDelete,
  onShare,
  userId,
  editing,
}: {
  post: PostType;
  userId: string;
  editing: boolean;
  type: "post" | "comment" | "text";
  onEdit: (post: PostType) => void;
  onDelete: (post: PostType) => void;
  onShare?: (post: PostType) => void;
}) => {
  const { session } = useSession();
  const { blockUser } = useBlockedUsers();
  const currentUserId = session?.uid;
  const router = useRouter();
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [blocking, setBlocking] = useState(false);

  const handleEdit = () => {
    console.log("Edit post:", post);
    onEdit(post);
  };

  const handleDelete = () => {
    console.log("Delete post:", post);
    onDelete(post);
  };

  const handleBlockUser = async (reason?: string, alsoReport?: boolean) => {
    if (!currentUserId || !userId) return;

    setBlocking(true);
    try {
      let abuseReportId: string | undefined;

      // Create abuse report if requested
      if (alsoReport && reason) {
        abuseReportId = await createAbuseReport(
          currentUserId,
          userId,
          reason,
          post.id
        );

        // Send notification to developers
        const reporterName = session?.displayName || session?.email || "Unknown User";
        const message = `User Block & Report\n\nReporter: ${reporterName} (${currentUserId})\nReported User: ${userId}\nPost ID: ${post.id}\nReason: ${reason}\nReport ID: ${abuseReportId}`;

        // Developer emails to notify
        const developerEmails = [
          "rushikesh.joshi@chachingsocial.io",
          "sonia.lomo@fatfiresocial.com",
          "mabel.oza@chachingsocial.io",
        ];

        await sendNotificationEmail(
          NotificationNotificationTypeEnum.Reported,
          "",
          "User Blocked & Reported",
          "",
          message,
          NotificationEntityTypeEnum.Post,
          developerEmails,
          currentUserId
        );
      }

      // Block the user
      const success = await blockUser(userId, reason, abuseReportId);

      if (success) {
        Toast.show({
          type: "success",
          text1: "User blocked successfully",
          text2: "You won't see their content anymore.",
        });
        setShowBlockModal(false);
      } else {
        Toast.show({
          type: "error",
          text1: "Failed to block user",
          text2: "Please try again.",
        });
      }
    } catch (error) {
      console.error("Error blocking user:", error);
      Toast.show({
        type: "error",
        text1: "Failed to block user",
        text2: "Please try again.",
      });
    } finally {
      setBlocking(false);
    }
  };

  return (
    <>
      <Menu
        placement="bottom left"
        trigger={(triggerProps) => (
          <Button
            size="md"
            className="rounded-full bg-white w-12"
            {...triggerProps}
          >
            <ButtonText>
              <FontAwesome5 name="ellipsis-v" size={16} color="black" />
            </ButtonText>
          </Button>
        )}
      >
        {type === "text" && currentUserId === userId && !editing && (
          <MenuItem key={"Edit"} textValue="Edit" onPress={handleEdit}>
            <FontAwesome5 name="edit" size={20} color="black" className="mr-2" />
            <MenuItemLabel size="sm">Edit</MenuItemLabel>
          </MenuItem>
        )}
        {currentUserId === userId && !editing && (
          <MenuItem key={"Delete"} textValue="Delete" onPress={handleDelete}>
            <FontAwesome5 name="trash" size={20} color="black" className="mr-2" />
            <MenuItemLabel size="sm">Delete</MenuItemLabel>
          </MenuItem>
        )}
        {currentUserId !== userId && (
          <MenuItem
            key={"Block"}
            textValue="Block"
            onPress={() => setShowBlockModal(true)}
          >
            <FontAwesome5 name="ban" size={20} color="black" className="mr-2" />
            <MenuItemLabel size="sm">Block User</MenuItemLabel>
          </MenuItem>
        )}
        <MenuItem
          key={"Report"}
          textValue="Report"
          onPress={() => {
            router.push(`/(protected)/report?type=post&id=${post.id}&userId=${userId}&communityId=${post.newsfeedId}`);
          }}
        >
          <FontAwesome5 name="flag" size={20} color="black" className="mr-2" />
          <MenuItemLabel size="sm">Report</MenuItemLabel>
        </MenuItem>
      </Menu>

      <BlockUserModal
        isOpen={showBlockModal}
        onClose={() => setShowBlockModal(false)}
        onConfirm={handleBlockUser}
        userName={post.posterName}
        loading={blocking}
      />
    </>
  );
};
