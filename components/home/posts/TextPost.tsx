import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePost } from "@/lib/api/newsfeed";
import { Post as PostType } from "@/types/post";
import React, { useState } from "react";
import { Text, View } from "react-native";
// import PostEditor from "../post-editor/PostEditor";
import { HStack } from "@/components/ui/hstack";
import PostTags from "../post-editor/PostTag";

/**
 * Renders a text-based post with support for viewing and editing modes.
 *
 * Displays the post's title, content, and tags. When in editing mode, shows the current content in a non-editable format and provides options to save changes or cancel editing.
 *
 * @param post - The post data to display and edit
 * @param editing - Whether the post is currently in editing mode
 * @param onEditingChange - Callback to toggle the editing state
 */
export function TextPost({
  post,
  editing,
  onEditingChange,
}: {
  post: PostType;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const [editedContent, setEditedContent] = useState(post.post);

  const handleSave = () => {
    if (!post.id) return;
    updatePost(post.id, editedContent, post.tags).then(() => {
      onEditingChange(false);
      post.post = editedContent;
    });
  };

  const handleCancel = () => {
    setEditedContent(post.post);
    onEditingChange(false);
  };

  return (
    <View className="my-1">
      {editing ? (
        <View className="p-4">
          {/* <PostEditor
            message={editedContent}
            setContent={setEditedContent}
            editorType="post"
          /> */}
          <HtmlRenderText source={editedContent} />
          <View className="flex-row mt-4 space-x-2">
            <Button
              onPress={handleSave}
              className="bg-green-600 px-4 py-2 rounded"
            >
              <Text className="text-white font-medium">Save</Text>
            </Button>
            <Button
              onPress={handleCancel}
              variant="outline"
              className="px-4 py-2 rounded bg-transparent"
            >
              <Text className="font-medium text-green-600">Cancel</Text>
            </Button>
          </View>
        </View>
      ) : (
        <View className="px-4">
          {post.title && (
            <Text className="text-xl font-semibold mb-3">{post.title}</Text>
          )}

          <Text className="text-lg mb-1">
            <HtmlRenderText source={post.post} />
          </Text>
          {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
        </View>
      )}
    </View>
  );
}
