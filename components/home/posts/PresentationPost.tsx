import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { VStack } from "@/components/ui/vstack";
import { Post as PostType } from "@/types/post";
import { ScrollView } from "react-native";
import WebView from "react-native-webview";
import PostTags from "../post-editor/PostTag";

export function PresentationPost({ post }: { post: PostType }) {
  return (
    <VStack className="p-4">
      {post.title && (
        <Heading size="md" className="mb-2">
          {post.title}
        </Heading>
      )}

      <ScrollView>
        <HtmlRenderText source={post.post} />
      </ScrollView>

      {post.presentation && (
        <Box className="mt-4 h-[300px]">
          <WebView
            source={{ uri: `${post.presentation}?embed` }}
            className="w-full h-full"
            javaScriptEnabled={true}
            domStorageEnabled={true}
            allowsFullscreenVideo={true}
          />
        </Box>
      )}

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </VStack>
  );
}
