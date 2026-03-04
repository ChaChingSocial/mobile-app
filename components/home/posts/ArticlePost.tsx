import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
} from "react-native";
import * as WebBrowser from "expo-web-browser";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { updatePost } from "@/lib/api/newsfeed";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import PostTags from "../post-editor/PostTag";
import { stripHtml } from "@/lib/utils/stripHtml";

const TagsInput = ({
  value,
  onChange,
}: {
  value: string[];
  onChange: (tags: string[]) => void;
}) => (
  <TextInput
    className="border border-gray-300 rounded p-2 my-2"
    placeholder="Enter tags, separated by commas"
    value={value.join(", ")}
    onChangeText={(text) =>
      onChange(
        text
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    }
  />
);

export function ArticlePost({
  post,
  editing,
  onEditingChange,
}: {
  post: PostType;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const [editedContent, setEditedContent] = useState(post.post);
  const [editedTags, setEditedTags] = useState(post.tags ? post.tags : []);

  const handleSave = () => {
    if (post.id) {
      updatePost(post.id, editedContent, editedTags).then(() => {
        onEditingChange(false);
        post.post = editedContent;
        post.tags = editedTags;
      });
    }
  };

  const handleCancel = () => {
    setEditedContent(post.post);
    setEditedTags(post.tags || []);
    onEditingChange(false);
  };

  const navigateToLink = () => {
    if (post.linkPreview?.url) {
      WebBrowser.openBrowserAsync(post.linkPreview.url, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN,
      });
    }
  };

  if (editing) {
    return (
      <ScrollView className="bg-white p-4 rounded-lg">
        <TextInput
          className="border border-gray-300 rounded p-2 mb-3"
          placeholder="Edit article content"
          value={editedContent}
          onChangeText={setEditedContent}
          multiline
          style={{ minHeight: 100, textAlignVertical: "top" }}
        />
        <TagsInput value={editedTags} onChange={setEditedTags} />
        <View className="flex-row gap-4 mt-4">
          <Button onPress={handleSave} className="flex-1">
            <Text className="text-white font-medium">Save</Text>
          </Button>
          <Button
            onPress={handleCancel}
            variant="outline"
            className="flex-1 bg-transparent border border-gray-300"
          >
            <Text className="font-medium">Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="px-4 py-1">
      {post.title && (
        <Text className="text-xl font-semibold text-gray-800 mb-2">
          {post.title}
        </Text>
      )}
      {post.post && (
        <Text className="text-base text-gray-700 mb-3">
          <HtmlRenderText source={post.post} />
        </Text>
      )}

      {post.linkPreview?.url && (
        <TouchableOpacity
          className="flex flex-col justify-center gap-4 items-start"
          onPress={navigateToLink}
          activeOpacity={0.8}
        >
          {post.linkPreview?.image && (
            <Image
              source={{ uri: post.linkPreview.image }}
              className="w-full h-40 rounded-md mb-2 px-2"
            />
          )}
          <View className="flex-1 flex-col gap-2">
            <Text className="font-bold text-base">
              {post.linkPreview?.title}
            </Text>
            {post.linkPreview?.description && (
              <Text className="text-gray-500">
                {stripHtml(post.linkPreview.description).slice(0, 100)}...
              </Text>
            )}
            <Text className="text-green-600 font-bold mt-1">Read more</Text>
          </View>
        </TouchableOpacity>
      )}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </View>
  );
}
