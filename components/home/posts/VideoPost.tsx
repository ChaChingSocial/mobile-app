import React from "react";
import { View, Text, ScrollView } from "react-native";
import { Badge, BadgeText } from "@/components/ui/badge";
import VideoComponent from "@/components/resources/Video";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import PostTags from "../post-editor/PostTag";

export function VideoPost({ post }: { post: PostType }) {
  // Helper to render video preview section
  const renderVideoPreview = () => {
    if (
      (post.category === "youtube" || post.category === "tiktok") &&
      post.linkPreview?.image
    ) {
      return (
        <View className="flex-row gap-5 items-start mb-4 flex-wrap md:flex-nowrap">
          {/* Video */}
          <VideoComponent
            url={post.linkPreview?.url}
            title={post.linkPreview?.title}
            className="w-72 h-40 rounded-lg mr-5 mb-2"
          />
          {/* Text Preview */}
          <View className="flex-1 flex-col justify-start gap-2">
            {post.linkPreview.description ? (
              <Text className="text-base text-gray-700">
                {post.linkPreview.description.length > 500
                  ? post.linkPreview.description.slice(0, 500) + "..."
                  : post.linkPreview.description}
              </Text>
            ) : (
              <Text className="text-xl mb-4">
                <HtmlRenderText source={post.post} />
              </Text>
            )}
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <ScrollView className="bg-white p-4 rounded-lg shadow-none">
      {post.title && (
        <Text className="text-xl font-semibold mb-3">{post.title}</Text>
      )}
      {/* 
      {post.post && (
        <Text className="text-xl mb-4">
          <HtmlRenderText source={post.post} />
        </Text>
      )} */}

      {renderVideoPreview()}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </ScrollView>
  );
}
