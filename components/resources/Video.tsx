import React from "react";
import { View, Dimensions } from "react-native";
import { WebView } from "react-native-webview";

interface VideoComponentProps {
  url: string;
  title: string;
  className?: string;
}

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const getYouTubeEmbedUrl = (url: string) => {
  // Support both youtu.be and youtube.com URLs
  let videoId = "";
  if (url.includes("youtu.be")) {
    videoId = url.split("youtu.be/")[1]?.split(/[?&]/)[0];
  } else {
    const match = url.match(/[?&]v=([^&]+)/);
    videoId = match ? match[1] : "";
  }
  return `https://www.youtube.com/embed/${videoId}`;
};

const getTikTokEmbedUrl = (url: string) => {
  // TikTok embed URLs are of the form: https://www.tiktok.com/embed/{videoId}
  const parts = url.split("/");
  const videoId = parts[parts.length - 1] || parts[parts.length - 2];
  return `https://www.tiktok.com/embed/${videoId}`;
};

const VideoComponent: React.FC<VideoComponentProps> = ({ url, title, className }) => {
  const isYouTube = url.includes("youtube.com") || url.includes("youtu.be");
  const isTikTok = url.includes("tiktok.com");

  let embedUrl = url;
  let aspectRatio = 16 / 9;
  let height = (SCREEN_WIDTH * 9) / 16;

  if (isYouTube) {
    embedUrl = getYouTubeEmbedUrl(url);
    aspectRatio = 16 / 9;
    height = (SCREEN_WIDTH * 9) / 16;
  } else if (isTikTok) {
    embedUrl = getTikTokEmbedUrl(url);
    aspectRatio = 9 / 16;
    height = (SCREEN_WIDTH * 16) / 9;
  }

  return (
    <View
      className={`w-full max-w-[550px] self-center aspect-video rounded-lg overflow-hidden bg-black min-h-[200px] mb-3 ${className}`}
    >
      <WebView
        source={{ uri: embedUrl }}
        style={{ flex: 1 }}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        javaScriptEnabled
        domStorageEnabled
        startInLoadingState
        accessibilityLabel={title}
      />
    </View>
  );
};

export default VideoComponent;
