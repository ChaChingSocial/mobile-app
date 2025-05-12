import { Menu, MenuItem, MenuItemLabel } from "../ui/menu";
import { TouchableOpacity } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Post as PostType } from "@/types/post";

export const PostMenu = ({
  post,
  type,
  onEdit,
  onDelete,
  onShare,
}: {
  post: PostType;
  type: "post" | "comment" | "text";
  onEdit: (post: PostType) => void;
  onDelete: (post: PostType) => void;
  onShare?: (post: PostType) => void;
}) => {
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
      trigger={({ ...triggerProps }) => {
        return (
          <TouchableOpacity {...triggerProps}>
            <FontAwesome5
              name="ellipsis-v"
              size={20}
              color="black"
              className="absolute right-4 top-4"
            />
          </TouchableOpacity>
        );
      }}
    >
      {type === "text" && (
        <MenuItem key={"Edit"} textValue="Edit" onPress={handleEdit}>
          <FontAwesome5 name="edit" size={20} color="black" className="mr-2" />
          <MenuItemLabel size="sm">Edit</MenuItemLabel>
        </MenuItem>
      )}
      <MenuItem key={"Delete"} textValue="Delete" onPress={handleDelete}>
        <FontAwesome5 name="trash" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Delete</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
};
