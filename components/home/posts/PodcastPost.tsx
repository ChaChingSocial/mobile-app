import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Box } from "@/components/ui/box";
import { Post as PostType } from "@/types/post";
import React from "react";
import WebView from "react-native-webview";
import PostTags from "../post-editor/PostTag";
import { Text } from "@/components/ui/text";

export function PodcastPost({ post }: { post: PostType }) {
  const getEmbedUrl = (url: string) => {
    try {
      const episodeIdMatch = url.match(/episode\/([a-zA-Z0-9]+)/);
      if (!episodeIdMatch) return null;

      const episodeId = episodeIdMatch[1];
      return `https://open.spotify.com/embed/episode/${episodeId}`;
    } catch (error) {
      console.error("Error processing Spotify URL:", error);
      return null;
    }
  };

  const embedUrl = post.podcast ? getEmbedUrl(post.podcast) : null;

  return (
    <Box className="mx-4 my-4">
      {post.title && (
        <Text className="text-xl font-bold mb-2">{post.title}</Text>
      )}

      <HtmlRenderText source={post.post} />

      {embedUrl && (
        <Box className="mt-4">
          <WebView
            source={{ uri: embedUrl }}
            style={{
              height: 380,
            }}
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
            allowsInlineMediaPlayback={true}
          />
        </Box>
      )}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </Box>
  );
}
