import React, { useState, useCallback, useEffect } from "react";
import { View, Text, ScrollView, LayoutChangeEvent } from "react-native";
import YoutubePlayer from "react-native-youtube-iframe";
import { VideoView, useVideoPlayer } from "expo-video";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Button } from "@/components/ui/button";
import PostTags from "../post-editor/PostTag";
import { getDownloadURL, getStorage, ref } from "firebase/storage";

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

const FIREBASE_STORAGE_HOST = "firebasestorage.googleapis.com";

function isLikelyVideoUrl(url: string): boolean {
  const lower = url.toLowerCase();
  return (
    lower.startsWith("file://") ||
    lower.startsWith("content://") ||
    lower.startsWith("blob:") ||
    /\.(mp4|mov|m4v|webm|m3u8)(\?|$)/i.test(lower) ||
    lower.includes(FIREBASE_STORAGE_HOST)
  );
}

function ensureFirebaseMediaUrl(url: string): string {
  if (!url.includes(FIREBASE_STORAGE_HOST)) return url;

  try {
    const parsed = new URL(url);
    if (parsed.searchParams.get("alt") !== "media") {
      parsed.searchParams.set("alt", "media");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

async function resolveVideoUrl(rawUrl: string): Promise<string | null> {
  if (!rawUrl) return null;

  // Resolve Firebase gs:// paths to signed download URLs.
  if (rawUrl.startsWith("gs://")) {
    try {
      return await getDownloadURL(ref(getStorage(), rawUrl));
    } catch {
      return null;
    }
  }

  if (/^https?:\/\//i.test(rawUrl)) {
    return ensureFirebaseMediaUrl(rawUrl);
  }

  if (rawUrl.startsWith("file://") || rawUrl.startsWith("content://") || rawUrl.startsWith("blob:")) {
    return rawUrl;
  }

  return null;
}

export function VideoPost({ post }: { post: PostType }) {
  const [playing, setPlaying] = useState(false);
  const [readMore, setReadMore] = useState(false);
  const [showReadMoreButton, setShowReadMoreButton] = useState(false);
  const [resolvedVideoUrl, setResolvedVideoUrl] = useState<string | null>(null);
  const [videoUrlUnavailable, setVideoUrlUnavailable] = useState(false);

  const handleContentLayout = (event: LayoutChangeEvent) => {
    const { height } = event.nativeEvent.layout;
    if (height > 120) {
      setShowReadMoreButton(true);
    }
  };

  const getYouTubeVideoId = (url: string): string | null => {
    if (!url) return null;

    const patterns = [
      /youtube\.com\/embed\/([^?&]+)/,
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtu\.be\/([^?&]+)/,
      /youtube\.com\/v\/([^?&]+)/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) return match[1];
    }

    return null;
  };

  const getYouTubeVideoIdFromPost = (): string | null => {
    // Always check linkPreview.url first — video posts created via the
    // "video" category can still have a YouTube URL as their linkPreview.
    if (post.linkPreview?.url) {
      const id = getYouTubeVideoId(post.linkPreview.url);
      if (id) return id;
    }

    if (post.post && post.post.includes("data-youtube-video")) {
      const srcMatch = post.post.match(/src="([^"]*youtube\.com\/embed[^"]*)"/);
      if (srcMatch) return getYouTubeVideoId(srcMatch[1]);
    }

    return null;
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

  useEffect(() => {
    let isMounted = true;

    async function resolveDirectVideo() {
      setResolvedVideoUrl(null);
      setVideoUrlUnavailable(false);

      if (!directVideoUrl) return;

      const resolved = await resolveVideoUrl(directVideoUrl);
      if (!isMounted) return;

      if (resolved && isLikelyVideoUrl(resolved)) {
        setResolvedVideoUrl(resolved);
        return;
      }

      setVideoUrlUnavailable(true);
    }

    resolveDirectVideo();

    return () => {
      isMounted = false;
    };
  }, [directVideoUrl]);

  return (
    <ScrollView className="bg-white p-4 rounded-lg shadow-none">
      {post.title && (
        <Text className="text-xl font-semibold mb-3">{post.title}</Text>
      )}

      {resolvedVideoUrl && <FirebaseVideoPlayer uri={resolvedVideoUrl} />}

      {videoUrlUnavailable && (
        <View className="w-full max-w-[550px] self-center rounded-lg bg-gray-100 p-3 mb-4">
          <Text className="text-sm text-gray-600">
            This video URL is not directly playable. Please use a Firebase download URL.
          </Text>
        </View>
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
