import React, { useState, useCallback } from "react";
import { View, Text, ScrollView } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import PostTags from "../post-editor/PostTag";

export function VideoPost({ post }: { post: PostType }) {
  const [playing, setPlaying] = useState(false);

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
      /(?:youtube\.com\/embed\/([^?&]+))/,
      /(?:youtube\.com\/watch\?v=([^&]+))/,
      /(?:youtu\.be\/([^?&]+))/,
      /(?:youtube\.com\/v\/([^?&]+))/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const getYouTubeVideoIdFromPost = (): string | null => {
    let url: string | null = null;


    if (post.category === "youtube" && post.linkPreview?.url) {
      url = post.linkPreview.url;
    }
    
    else if (post.post && post.post.includes("data-youtube-video")) {
      const srcMatch = post.post.match(/src="([^"]*youtube\.com\/embed[^"]*)"/);
      if (srcMatch) {
        url = srcMatch[1];
      }
    }

    return url ? getYouTubeVideoId(url) : null;
  };

  const onStateChange = useCallback((state: string) => {
    if (state === "ended") {
      setPlaying(false);
    }
  }, []);

  const removeYouTubeFromHtml = (html: string): string => {
    if (!html) return html;

    let cleanedHtml = html.replace(
      /<div[^>]*data-youtube-video[^>]*>[\s\S]*?<\/div>/g,
      ""
    );

    return cleanedHtml.trim();
  };

  const videoId = getYouTubeVideoIdFromPost();
  const cleanHtml = removeYouTubeFromHtml(post.post);
  const hasTextContent = cleanHtml && cleanHtml.length > 0;

  return (
    <ScrollView className="bg-white p-4 rounded-lg shadow-none">
      {post.title && (
        <Text className="text-xl font-semibold mb-3">{post.title}</Text>
      )}

      {videoId && (
        <View className="w-full max-w-[550px] self-center aspect-video rounded-lg overflow-hidden bg-black min-h-[200px] mb-4">
          <YoutubePlayer
            height={300}
            play={playing}
            videoId={videoId}
            onChangeState={onStateChange}
            webViewStyle={{
              opacity: 0.99,
            }}
            webViewProps={{
              allowsFullscreenVideo: true,
              allowsInlineMediaPlayback: true,
            }}
          />
        </View>
      )}

      {post.category === "youtube" && post.linkPreview?.description && (
        <Text className="text-base text-gray-700 mb-4">
          {post.linkPreview.description.length > 500
            ? post.linkPreview.description.slice(0, 500) + "..."
            : post.linkPreview.description}
        </Text>
      )}

      {hasTextContent && (
        <View className="mb-4">
          <HtmlRenderText source={cleanHtml} />
        </View>
      )}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </ScrollView>
  );
}
