import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Button } from "@/components/ui/button";
import { updatePost } from "@/lib/api/newsfeed";
import { Post as PostType } from "@/types/post";
import React, { useEffect, useState } from "react";
import { Text, View, LayoutChangeEvent } from "react-native";
import PostEditor from "../post-editor/PostEditor";
import PostTags from "../post-editor/PostTag";

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
  const [readMore, setReadMore] = useState(false);
  const [showReadMoreButton, setShowReadMoreButton] = useState(false);

  useEffect(() => {
    setEditedContent(post.post);
    setReadMore(false);
    setShowReadMoreButton(false);
  }, [post.post]);

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

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    setShowReadMoreButton(height > 120);
  };

  return (
    <View className="my-1">
      {editing ? (
        <View className="p-4">
          <PostEditor
            message={editedContent}
            setContent={setEditedContent}
            editorType="post"
          />
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

          <View>
            {!readMore && (
              <View
                style={{ position: "absolute", opacity: 0, width: "100%" }}
                onLayout={handleContentLayout}
                pointerEvents="none"
              >
                <View className="mb-1">
                  <HtmlRenderText source={post.post} />
                </View>
              </View>
            )}

            <View
              style={{
                maxHeight: readMore ? undefined : 120,
                overflow: "hidden",
              }}
            >
              <View className="mb-1">
                <HtmlRenderText source={post.post} />
              </View>
            </View>

            {!readMore && showReadMoreButton && (
              <View
                style={{
                  position: "absolute",
                  bottom: 0,
                  left: 0,
                  right: 0,
                  height: 50,
                  backgroundColor: "rgba(255, 255, 255, 0.8)",
                  pointerEvents: "none",
                }}
              />
            )}
          </View>

          {showReadMoreButton && (
            <Button
              onPress={() => setReadMore(!readMore)}
              variant="outline"
              size="sm"
              className="mt-3 px-0 py-0 bg-transparent border-0"
            >
              <Text className="text-blue-600 font-semibold text-sm">
                {readMore ? "Read Less" : "Read More"}
              </Text>
            </Button>
          )}

          {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
        </View>
      )}
    </View>
  );
}
