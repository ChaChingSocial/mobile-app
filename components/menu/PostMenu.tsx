import { useSession } from "@/lib/providers/AuthContext";
import { Post as PostType } from "@/types/post";
import { FontAwesome5 } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Button, ButtonText } from "../ui/button";
import { Menu, MenuItem, MenuItemLabel } from "../ui/menu";

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
  const currentUserId = session?.uid;
  const router = useRouter();

  const handleEdit = () => {
    console.log("Edit post:", post);
    onEdit(post);
  };

  const handleDelete = () => {
    console.log("Delete post:", post);
    onDelete(post);
  };

  return (
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
      <MenuItem
        key={"Report"}
        textValue="Report"
        onPress={() => {
          router.push(`/(protected)/report?type=post&id=${post.id}`);
        }}
      >
        <FontAwesome5 name="flag" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Report</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
};
