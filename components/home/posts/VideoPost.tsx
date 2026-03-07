import React, { useState, useCallback } from "react";
import { View, Text, ScrollView, LayoutChangeEvent } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { VideoView, useVideoPlayer } from "expo-video";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Button } from "@/components/ui/button";
import PostTags from "../post-editor/PostTag";

// ── Firebase Storage / direct-URL video player ────────────────────────────────
function FirebaseVideoPlayer({ uri }: { uri: string }) {
  const player = useVideoPlayer({ uri }, (p) => {
    p.loop = false;
    p.muted = false;
  });

  return (
    <View
      style={{ aspectRatio: 16 / 9 }}
      className="w-full max-w-[550px] self-center rounded-lg overflow-hidden bg-black mb-4"
    >
      <VideoView
        player={player}
        style={{ flex: 1 }}
        nativeControls
        allowsFullscreen
      />
    </View>
  );
}

export function VideoPost({ post }: { post: PostType }) {
  const [playing, setPlaying] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [showReadMoreButton, setShowReadMoreButton] = useState(false);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 120) {
      setShowReadMoreButton(true);
    }
  };

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

  // Use the linkPreview URL as a direct video source when it's not a YouTube link
  const directVideoUrl = !videoId && post.linkPreview?.url
    ? post.linkPreview.url
    : null;

  return (
    <ScrollView className="bg-white p-4 rounded-lg shadow-none">
      {post.title && (
        <Text className="text-xl font-semibold mb-3">{post.title}</Text>
      )}

      {directVideoUrl && <FirebaseVideoPlayer uri={directVideoUrl} />}

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
          {/* Measure full content first */}
          {!readMore && (
            <View style={{ position: 'absolute', opacity: 0, width: '100%' }} onLayout={handleContentLayout}>
              <HtmlRenderText source={cleanHtml} />
            </View>
          )}

          {/* Display truncated or full content */}
          <View
            style={{
              maxHeight: readMore ? undefined : 120,
              overflow: 'hidden',
            }}
          >
            <HtmlRenderText source={cleanHtml} />
          </View>

          {/* Gradient mask overlay when content is collapsed */}
          {!readMore && showReadMoreButton && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                height: 50,
                backgroundColor: 'rgba(255, 255, 255, 0.8)',
                pointerEvents: 'none',
              }}
            />
          )}
        </View>
      )}

      {/* Read More / Read Less button */}
      {showReadMoreButton && (
        <Button
          onPress={() => setReadMore(!readMore)}
          variant="outline"
          size="sm"
          className="mb-4 px-0 py-0 bg-transparent border-0"
        >
          <Text className="text-blue-600 font-semibold text-sm">
            {readMore ? 'Read Less' : 'Read More'}
          </Text>
        </Button>
      )}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </ScrollView>
  );
}
