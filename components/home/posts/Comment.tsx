import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { FontAwesome } from "@expo/vector-icons";

// import { runHearts } from "@/components/VisualEffects/runHearts";

import {
    deleteComment,
    likeComment,
    unlikeComment,
    updateComment,
    commentOnComment,
} from "@/lib/api/newsfeed";
import { Button } from "@/components/ui/button";
import { useSession } from "@/lib/providers/AuthContext";
import { PostMenu } from "@/components/menu/PostMenu";
import PostEditor from "../post-editor/PostEditor";
import { PostWrapper } from "./PostWrapper";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Comment as CommentType, Post as PostType } from "@/types/post";
import { Box } from "@/components/ui/box";

export function Comment({
                            comment,
                            post,
                            showReplies = false,
                        }: {
    comment: CommentType;
    post: PostType;
    showReplies?: boolean;
}) {
    const { session } = useSession();
    const currentUserId = session?.uid;
    const currentUserName = session?.displayName;

    const [liked, setLiked] = useState(
        comment.likes.some((like) => like.userId === currentUserId)
    );
    const [editing, setEditing] = useState(false);
    const [editedContent, setEditedContent] = useState(
        typeof comment.message === "string"
            ? comment.message
            : comment.message?.message ?? ""
    );
    const [commentLikes, setCommentLikes] = useState(comment.likes.length);
    const [replying, setReplying] = useState(false);
    const [replyContent, setReplyContent] = useState("");

    const handleLike = async () => {
        if (
            currentUserName &&
            currentUserId &&
            post.id &&
            comment.id &&
            post.newsfeedId
        ) {
            if (liked) {
                await unlikeComment(post.id, comment.id, currentUserId);
                setLiked(false);
                setCommentLikes((n) => Math.max(0, n - 1));
            } else {
                await likeComment(
                    post.id,
                    comment.id,
                    currentUserId,
                    "like",
                    comment.userId,
                    post.newsfeedId,
                    currentUserName
                );
                setLiked(true);
                setCommentLikes((n) => n + 1);
                // runHearts();
            }
        }
    };

    const handleEdit = () => setEditing(true);

    const handleSave = async () => {
        if (post.id) {
            await updateComment(post.id, comment.id, {
                message: editedContent,
                mentions: Array.isArray((comment as any)?.message?.mentions)
                    ? (comment as any).message.mentions
                    : [],
            });
        }
        comment.message = typeof comment.message === "string"
            ? editedContent
            : { ...(comment.message as any), message: editedContent };
        setEditing(false);
    };

    const handleCancel = () => {
        setEditedContent(
            typeof comment.message === "string"
                ? comment.message
                : comment.message?.message ?? ""
        );
        setEditing(false);
    };

    const handleDelete = async () => {
        if (post.id) await deleteComment(post.id, comment.id);
        // Optionally: remove comment from UI
    };

    const sortedReplies = useMemo(() => {
        return [...(comment.comments || [])].sort((a, b) => {
            if ((b.likes?.length || 0) === (a.likes?.length || 0)) {
                return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
            }
            return (b.likes?.length || 0) - (a.likes?.length || 0);
        });
    }, [comment.comments]);

    const handleReply = async () => {
        if (!post.id || !comment.id || !currentUserId) return;

        const newReply = {
            userId: currentUserId,
            userName: currentUserName ?? "",
            userPic: session?.profilePic ?? "",
            message: { message: replyContent, mentions: [] as string[] },
            timestamp: new Date(),
        };

        const saved = await commentOnComment(
            post.id,
            comment.id,
            newReply,
            comment.userId,
            post.newsfeedId!
        );

        if (!comment.comments) comment.comments = [];
        comment.comments.push((saved as any) ?? (newReply as any));
        setReplyContent("");
        setReplying(false);
    };

    const [showChildReplies, setShowChildReplies] = useState<boolean>(!!showReplies);
    useEffect(() => {
        setShowChildReplies(!!showReplies);
    }, [showReplies]);

    return (
        <PostWrapper
            post={post}
            onLike={handleLike}
            userLikedPost={liked}
            onEdit={setEditing}
            editing={editing}
            type="comment"
            createdAt={comment.timestamp}
            userId={comment.userId}
            authorName={comment.userName}
            authorId={comment.userId}
            authorPic={comment.userPic}
        >
            {editing ? (
                <View className="border-l-4 rounded-md p-4 ml-4 shadow-sm mt-4">
                    <PostEditor
                        message={editedContent}
                        setContent={setEditedContent}
                        editorType="comment"
                    />
                    <View className="flex-row mt-2 space-x-2">
                        <Button
                            onPress={handleSave}
                            className="px-4 py-2 bg-purple-700 rounded"
                        >
                            <Text className="text-white font-medium">Save</Text>
                        </Button>
                        <Button
                            onPress={handleCancel}
                            variant="outline"
                            className="px-4 py-2 border border-purple-700 rounded bg-transparent"
                        >
                            <Text className="font-medium text-purple-700">Cancel</Text>
                        </Button>
                    </View>
                </View>
            ) : (
                <View className="mb-1">
                    <Text className="text-base leading-relaxed mx-3">
                        <HtmlRenderText
                            source={
                                typeof comment.message === "string"
                                    ? comment.message
                                    : comment.message?.message ?? (comment as any)?.content ?? ""
                            }
                        />
                    </Text>
                </View>
            )}

            {currentUserId === comment.userId && !editing && (
                <PostMenu
                    post={comment}
                    type="comment"
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <View className="flex-row items-center mt-2 space-x-4">
                <TouchableOpacity onPress={handleLike} activeOpacity={0.7}>
                    <FontAwesome
                        name={liked ? "heart" : "heart-o"}
                        size={20}
                        solid={liked}
                        color="red"
                        className="m-3"
                    />
                </TouchableOpacity>
                <Text className="text-gray-500">{commentLikes}</Text>
                <TouchableOpacity onPress={() => setReplying((v) => !v)}>
                    <Text className="text-primary-700 mx-3">Reply</Text>
                </TouchableOpacity>
            </View>

            {replying && (
                <View className="ml-6 mt-2 border border-secondary-0 rounded-md p-3 bg-[#f3e8ff]">
                    <PostEditor
                        message={replyContent}
                        setContent={setReplyContent}
                        editorType="comment"
                    />
                    <View className="flex-row justify-end mt-2 space-x-2">
                        <Button onPress={() => setReplying(false)} variant="outline" className="px-4 py-2 border border-purple-700 rounded bg-transparent">
                            <Text className="font-medium text-purple-700">Cancel</Text>
                        </Button>
                        <Button onPress={handleReply} className="px-4 py-2 bg-purple-700 rounded">
                            <Text className="text-white font-medium">Send</Text>
                        </Button>
                    </View>
                </View>
            )}

            {sortedReplies.length > 0 && !showChildReplies && (
                <TouchableOpacity onPress={() => setShowChildReplies(true)}>
                    <Text className="ml-6 mt-2 text-sm text-primary-700">
                        Show {sortedReplies.length} {sortedReplies.length === 1 ? "comment" : "comments"}
                    </Text>
                </TouchableOpacity>
            )}

            {showChildReplies && sortedReplies.length > 0 && (
                <>
                    <TouchableOpacity onPress={() => setShowChildReplies(false)}>
                        <Text className="ml-6 mt-2 text-sm text-primary-700">
                            Hide {sortedReplies.length} {sortedReplies.length === 1 ? "comment" : "comments"}
                        </Text>
                    </TouchableOpacity>
                    <Box className="ml-6 mt-2">
                        {sortedReplies.map((reply) => (
                            <Box key={reply.id} className="mt-4">
                                <Comment comment={reply} post={post} />
                            </Box>
                        ))}
                    </Box>
                </>
            )}
        </PostWrapper>
    );
}
