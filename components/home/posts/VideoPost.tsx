import React from "react";
import { View, Text, ScrollView } from "react-native";
import VideoComponent from "@/components/resources/Video";
import { Post as PostType } from "@/types/post";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import PostTags from "../post-editor/PostTag";
import { useVideoPlayer, VideoView } from 'expo-video';

export function VideoPost({ post }: { post: PostType }) {
    // Helper to render video preview section for external videos
    const renderVideoPreview = () => {
        if (
            (post.category === "youtube" || post.category === "tiktok" || post.category === "instagram") &&
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
                    {post.linkPreview.description && (
                        <View className="flex-1 flex-col justify-start gap-2">
                            <Text className="text-base text-gray-700">
                                {post.linkPreview.description.length > 500
                                    ? post.linkPreview.description.slice(0, 500) + "..."
                                    : post.linkPreview.description}
                            </Text>
                        </View>
                    )}
                </View>
            );
        }
        return null;
    };

    // Component for rendering a single video with expo-video
    const SingleVideo = ({ url }: { url: string }) => {
        const player = useVideoPlayer(url, (player) => {
            player.loop = false;
        });

        return (
            <VideoView
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                style={{
                    width: '100%',
                    height: 300,
                    borderRadius: 12,
                    marginBottom: 16
                }}
            />
        );
    };

    // Component for rendering carousel video with expo-video
    const CarouselVideo = ({ url }: { url: string }) => {
        const player = useVideoPlayer(url, (player) => {
            player.loop = false;
        });

        return (
            <VideoView
                player={player}
                allowsFullscreen
                allowsPictureInPicture
                style={{
                    width: 300,
                    height: 300,
                    borderRadius: 12,
                    marginRight: 12
                }}
            />
        );
    };

    // Helper to render uploaded videos
    const renderUploadedVideos = () => {
        if (post.category === 'video' && post.videos && post.videos.length > 0) {
            if (post.videos.length === 1) {
                const videoUrl = typeof post.videos[0] === 'string' ? post.videos[0] : post.videos[0].url;
                return <SingleVideo url={videoUrl} />;
            } else {
                return (
                    <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        className="mb-4"
                    >
                        {post.videos.map((video, idx) => {
                            const videoUrl = typeof video === 'string' ? video : video.url;
                            return <CarouselVideo key={idx} url={videoUrl} />;
                        })}
                    </ScrollView>
                );
            }
        }
        return null;
    };

    return (
        <ScrollView className="bg-white p-4 rounded-lg shadow-none">
            {post.title && (
                <Text className="text-xl font-semibold mb-3">{post.title}</Text>
            )}

            {post.post && !post.linkPreview?.description && (
                <Text className="text-xl mb-4">
                    <HtmlRenderText source={post.post} />
                </Text>
            )}

            {renderVideoPreview()}
            {renderUploadedVideos()}

            {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
        </ScrollView>
    );
}
