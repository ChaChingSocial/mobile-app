import React, { useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";

// import { runHearts } from "@/components/VisualEffects/runHearts";

import {
  deleteComment,
  likeComment,
  unlikeComment,
  updateComment,
} from "@/lib/api/newsfeed";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/providers/AuthContext";
import { PostMenu } from "@/components/menu/PostMenu";
// import PostEditor from "../post-editor/PostEditor";
import { PostWrapper } from "./PostWrapper";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Comment as CommentType, Post as PostType } from "@/types/post";

/**
 * Renders a comment within a post, providing UI for viewing, liking, editing, and deleting the comment.
 *
 * Displays the comment content, like count, and like button. If the current user is the comment author, editing and deletion options are available. When editing, the comment content is shown in a non-editable HTML view with options to save or cancel changes. Like status and like count are updated in response to user actions.
 */
export function Comment({
  comment,
  post,
}: {
  comment: CommentType;
  post: PostType;
}) {
  const { session } = useSession();
  const currentUserId = session?.uid;
  const currentUserName = session?.displayName;

  const [liked, setLiked] = useState(
    comment.likes.some((like) => like.userId === currentUserId)
  );
  const [editing, setEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(comment.message);
  const [commentLikes, setCommentLikes] = useState(comment.likes.length);

  const handleLike = async () => {
    if (
      currentUserName &&
      currentUserId &&
      post.id &&
      comment.id &&
      post.newsfeedId
    ) {
      if (liked) {
        await unlikeComment(post.id, comment.id, currentUserId);
        setLiked(false);
        setCommentLikes(commentLikes - 1);
      } else {
        await likeComment(
          post.id,
          comment.id,
          currentUserId,
          "like",
          comment.userId,
          post.newsfeedId,
          currentUserName
        );
        setLiked(true);
        setCommentLikes(commentLikes + 1);
        // runHearts();
      }
    }
  };

  const handleEdit = () => setEditing(true);

  const handleSave = async () => {
    if (post.id) {
      await updateComment(post.id, comment.id, editedContent);
    }
    comment.message = editedContent;
    setEditing(false);
  };

  const handleCancel = () => {
    setEditedContent(comment.message);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (post.id) await deleteComment(post.id, comment.id);
    // Optionally: remove comment from UI
  };

  return (
    <PostWrapper
      post={post}
      onLike={handleLike}
      userLikedPost={liked}
      onEdit={setEditing}
      editing={editing}
      type="comment"
      createdAt={comment.timestamp}
      userId={comment.userId}
    >
      {editing ? (
        <View className="border border-purple-700 rounded-md p-4 ml-4 bg-purple-50 shadow-sm mt-4">
          {/* <PostEditor
            message={editedContent}
            setContent={setEditedContent}
            editorType="comment"
          /> */}
          <HtmlRenderText source={editedContent} />
          <View className="flex-row mt-2 space-x-2">
            <Button
              onPress={handleSave}
              className="px-4 py-2 bg-purple-700 rounded"
            >
              <Text className="text-white font-medium">Save</Text>
            </Button>
            <Button
              onPress={handleCancel}
              variant="outline"
              className="px-4 py-2 border border-purple-700 rounded bg-transparent"
            >
              <Text className="font-medium text-purple-700">Cancel</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="mb-1">
          <Text className="text-base leading-relaxed mx-3">
            <HtmlRenderText source={comment.message.message} />
          </Text>
        </View>
      )}

      {currentUserId === comment.userId && !editing && (
        <PostMenu
          post={comment}
          type="comment"
          onEdit={handleEdit}
          onDelete={handleDelete}
        />
      )}

      <View className="flex-row items-center mt-2 space-x-2">
        <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
          <FontAwesome
            name={liked ? "heart" : "heart-o"}
            size={20}
            solid={liked}
            color="red"
            className="m-3"
          />
        </TouchableOpacity>
        <Text className="text-gray-500">{commentLikes}</Text>
      </View>
    </PostWrapper>
  );
}
