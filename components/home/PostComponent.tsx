import { ArticlePost } from "./posts/ArticlePost";
import { TextPost } from "./posts/TextPost";
import { VideoPost } from "./posts/VideoPost";

// import { ProductPost } from "@/components/NewsFeed/Post/ProductPost";
import { EventPost } from "./posts/EventPost";
import GoalPost from "./posts/GoalPost";
// import { PicturePost } from "@/components/NewsFeed/Post/PicturePost";
// import { PresentationPost } from "@/components/NewsFeed/Post/PresentationPost";

import { PointsGift } from "@/_sdk";
import { scoreApi } from "@/config/backend";
import { commentOnPost, likePost, unlikePost } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { Post as PostType } from "@/types/post";
import { useEffect, useState } from "react";
import { TextInput, TouchableOpacity, View } from "react-native";
import { Button, ButtonText } from "../ui/button";
import { Card } from "../ui/card";

import { Image } from "react-native";
import { Badge, BadgeText } from "../ui/badge";
import { Box } from "../ui/box";
import PostEditor from "./post-editor/PostEditor";
import { PicturePost } from "./posts/PicturePost";
import { PostComments } from "./posts/PostComments";
import { PostWrapper } from "./posts/PostWrapper";
import { PresentationPost } from "./posts/PresentationPost";
import { PodcastPost } from "./posts/PodcastPost";
import { AdvertPost } from "./posts/AdvertPost";

export function PostComponent({ post }: { post: PostType }) {
  const { session } = useSession();
  const currentUserId = session?.uid;

  const [userLikedPost, setUserLikedPost] = useState(false);
  const [userOinkedPost, setUserOinkedPost] = useState(false);
  const [writeComment, setWriteComment] = useState(false);
  const [enableComments, setEnableComments] = useState(true);
  const [commentText, setCommentText] = useState("");
  const [comment, setComment] = useState("");
  const [editing, setEditing] = useState(false);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    if (post) {
      setUserLikedPost(
        (post.likes ?? []).some((like) => like.userId === currentUserId)
      );
    }
  }, [post, currentUserId]);

  useEffect(() => {
    if (post.category === "advertisement" && post.advert) {
      setEnableComments(post.advert.commentable);
    }
  }, [post]);

  const handleLike = () => {
    if (!post.id || !currentUserId) return;

    if (userLikedPost) {
      unlikePost(post.id, currentUserId);
    } else {
      likePost(post.id, currentUserId, "like");
      // runHearts(); // You'll need to implement this as a React Native animation
    }
    setUserLikedPost(!userLikedPost);
  };

  const handleOink = () => {
    const pointsGift: PointsGift = {
      giverUserId: currentUserId ?? "",
      receivingUserId: post.posterUserId,
      score: 1,
    };

    scoreApi
      .givePoints({ pointsGift })
      .then((response) => {
        console.log("Points given successfully:", response);
      })
      .catch((error) => {
        console.error("Error giving points:", error);
      });
    // runPigs();
    setUserOinkedPost(!userOinkedPost);
  };

  const postTypeTitle = (category: string) => {
    switch (category) {
      case "advert":
        return "Advertisement";
      case "event":
        return "Event";
      case "video":
        return "Video";
      case "link":
        return "Article";
      case "product":
        return "Product";
      case "picture":
        return "Snaps";
      case "goal":
        return "Challenge";
      case "podcast":
        return "Podcast";
      case "presentation":
        return "Presentations";
      default:
        return "Writings";
    }
  };

  const renderPostContent = () => {
    switch (post.category) {
      case "event":
        return (
          <EventPost
            post={post}
            editing={editing}
            onEditingChange={setEditing}
          />
        );
      case "youtube":
      case "tiktok":
        return (
          <VideoPost
            post={post}
            // editing={editing}
            // onEditingChange={setEditing}
          />
        );
      case "link":
        return (
          <ArticlePost
            post={post}
            editing={editing}
            onEditingChange={setEditing}
          />
        );
      // case "product":
      //   return (
      //     <ProductPost
      //       post={post}
      //       editing={editing}
      //       onEditingChange={setEditing}
      //     />
      //   );
      case "picture":
        return (
          <PicturePost
            post={post}
            // editing={editing}
            // onEditingChange={setEditing}
          />
        );
      // case "advert":
      //   return (
      //     <AdvertPost
      //       post={post}
      //       editing={editing}
      //       onEditingChange={setEditing}
      //     />
      //   );
      case "goal":
        return <GoalPost post={post} />;
      case "podcast":
        return <PodcastPost post={post} />;
      case "presentation":
        return <PresentationPost post={post} />;
      default:
        return (
          <TextPost
            post={post}
            editing={editing}
            onEditingChange={setEditing}
          />
        );
    }
  };

  const handlePostingComment = () => {
    const newComment = {
      userId: currentUserId,
      userName: session?.displayName,
      userPic: session?.profilePic,
      message: { message: comment, mentions: [] },
      timestamp: new Date(),
      likes: [],
      comments: [],
      postReference: post.id,
      communityId: post.newsfeedId,
    };
    commentOnPost(post.id, newComment, post.posterUserId).then(() => {
      setWriteComment(false);
      post.comments.push(newComment);
    });
  };

  return (
    <Box className="mt-8">
      <Box className="relative -top-4 left-6">
        <Image
          source={require("@/assets/images/pig-face.png")}
          className="w-10 h-10 absolute top-0 -left-7 z-20"
        />
        <Badge className="absolute bg-[#36454F] top-2 left-0 z-10 rounded-full px-6 py-1 w-fit">
          <BadgeText className="text-white uppercase text-center font-bold">
            {postTypeTitle(post.category)}
          </BadgeText>
        </Badge>
      </Box>
      <Card className="m-2 p-4 rounded-lg bg-[#f3e8ff] border border-[#6b21a8] ">
        <PostWrapper
          post={post}
          onLike={handleLike}
          onOink={handleOink}
          userLikedPost={userLikedPost}
          userOinkedPost={userOinkedPost}
          onEdit={setEditing}
          editing={editing}
          type="post"
          createdAt={post.createdAt}
          userId={post.posterUserId}
          onViewComments={setShowAllComments}
        >
          {renderPostContent()}
        </PostWrapper>

        {writeComment && currentUserId ? (
          <View className="border border-secondary-0 rounded-md p-4 ml-4 bg-[#f3e8ff] mb-4">
            <PostEditor
              message=""
              setContent={(content) => setComment(content)}
              editorType="post"
            />
            <View className="flex flex-row justify-end mt-2 gap-2">
              <Button
                // mode="outlined"
                onPress={() => setWriteComment(false)}
                className="ml-2"
              >
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                // mode="contained"
                onPress={handlePostingComment}
                className="ml-2"
              >
                <ButtonText>Comment</ButtonText>
              </Button>
            </View>
          </View>
        ) : (
          enableComments &&
          currentUserId && (
            <TouchableOpacity onPress={() => setWriteComment(true)}>
              <TextInput
                placeholder="Comment..."
                value={commentText}
                onChangeText={setCommentText}
                className="bg-[#f5f3ff] rounded-lg p-3 mt-2 ml-8 border-2 border-primary-50"
                editable={false}
                onTouchStart={() => setWriteComment(true)}
              />
            </TouchableOpacity>
          )
        )}

        {enableComments && post.comments && (
          <PostComments post={post} showAllComments={showAllComments} />
        )}
      </Card>
    </Box>
  );
}
