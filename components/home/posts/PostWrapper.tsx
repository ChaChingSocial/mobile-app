import { PostMenu } from "@/components/menu/PostMenu";
import { ShareMenu } from "@/components/menu/ShareMenu";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Tooltip, TooltipContent, TooltipText } from "@/components/ui/tooltip";
import { deletePost, pinPost, unpinPost } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { useCommunityStore } from "@/lib/store/community";
import { usePostStore } from "@/lib/store/post";
import { Post as PostType } from "@/types/post";
import {
  Entypo,
  FontAwesome,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { PostInfo } from "./PostInfo";
import { Icon } from "@/components/ui/icon";
import { Image } from "react-native";

type PostWrapperProps = {
  post: PostType;
  children: React.ReactNode;
  onLike: () => void;
  onOink: () => void;
  userLikedPost: boolean;
  userOinkedPost: boolean;
  onEdit: (editing: boolean) => void;
  editing: boolean;
  type: "post" | "comment";
  createdAt: Timestamp;
  userId: string;
  onViewComments?: (showComments: boolean) => void;
  authorName?: string;
  authorId?: string;
  authorPic?: string;
};

export function PostWrapper({
  post,
  children,
  onLike,
  onOink,
  userOinkedPost,
  userLikedPost,
  onEdit,
  editing,
  type,
  createdAt,
  userId,
  onViewComments,
  authorName,
  authorId,
  authorPic,
}: PostWrapperProps) {
  const { session } = useSession();
  const currentUserId = session?.uid;

  const [showComments, setShowComments] = useState(false);
  const setPinPosts = usePostStore((state) => state.setPinPost);
  const communities = useCommunityStore((state) => state.allCommunities);
  const [isCommunityAdmin, setIsCommunityAdmin] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [communityTitle, setCommunityTitle] = useState("");
  const [shareTitle, setShareTitle] = useState("");

  const router = useRouter();

  useEffect(() => {
    if (post.pinPost?.id === post.id) {
      setPinned(true);
    }
  }, []);

  useEffect(() => {
    const fetchCommunity = async () => {
      try {
        if (!post.newsfeedId) {
          setCommunityTitle("General");
          setIsCommunityAdmin(false);
        } else {
          const community = communities.find(
            (community) => community.id === post.newsfeedId
          );
          if (community) {
            setCommunityTitle(community.title);
            if (currentUserId) {
              setIsCommunityAdmin(community.adminUserId === currentUserId);
            }
          } else {
            setCommunityTitle("General");
            setIsCommunityAdmin(false);
          }
        }
      } catch (error) {
        console.error("Error fetching community:", error);
        setCommunityTitle("General");
        setIsCommunityAdmin(false);
      }
    };
    fetchCommunity();
  }, [post, communities, currentUserId]);

  useEffect(() => {
    if (post.title) {
      setShareTitle(post.title);
    } else if (typeof post.post === "string") {
      setShareTitle(post.post.slice(0, 50) + "...");
    } else {
      setShareTitle("Post on ChaChing Social");
    }
  }, []);

  // Only for posts do we define delete/edit handlers inside the container.
  const handleDelete = () => {
    deletePost(post.id);
  };

  const handleEdit = () => {
    onEdit(!editing);
  };

  const handleShare = () => {
    if (typeof post.id === "string") {
      router.push(`/post/${post.id}`);
    } else {
      console.error("Post ID is not a string:", post.id);
    }
  };

  const viewComments = () => {
    if (onViewComments) onViewComments(!showComments);
    setShowComments(!showComments); // Toggle comments visibility
  };

  const pinToCommunity = () => {
    if (pinned) {
      unpinPost(post.id).then(() => {
        setPinned(false);

        console.log("unpinning post", post);
      });
    } else {
      setPinPosts((prevPinnedPosts: PostType[]) => [
        ...prevPinnedPosts,
        { ...post, pinPost: { id: post.id, order: 0 } },
      ]);
      pinPost(post.id, 0).then(() => {
        setPinned(true);
        console.log("pinning post", post);
      });
    }
  };

  // Computes like count based on local toggle
  const serverLiked = (post.likes ?? []).some((l: any) => l?.userId === currentUserId);
  const baseLikes = post.likes ? post.likes.length : 0;
  const displayedLikes = baseLikes + (userLikedPost && !serverLiked ? 1 : 0) - (!userLikedPost && serverLiked ? 1 : 0);

  return (
    <Box
      className="relative align-middle rounded-lg bg-white">
      <PostInfo
        post={post}
        createdAt={createdAt}
        authorName={authorName}
        authorId={authorId}
        authorPic={authorPic}
        hideAvatar={type === "comment"}
      />

      <Box className={`${type === "comment" ? "border-purple-950 border-l-2 pl-1 ml-1" : ""}`}>
        {children}
      </Box>

      {type !== "comment" && (
        <Box className="mt-4 flex flex-row gap-5 mx-2 mb-2">
          <Box className="flex flex-row items-center gap-2">
            <TouchableOpacity
              onPress={onLike}
              className="flex flex-row items-center"
            >
              <FontAwesome
                name={userLikedPost ? "heart" : "heart-o"}
                size={20}
                color="red"
              />
            </TouchableOpacity>
            <Text>{displayedLikes}</Text>
          </Box>
          {currentUserId !== post.posterUserId && (
            <Tooltip
              placement="top"
              trigger={(triggerProps) => {
                return (
                  <TouchableOpacity
                    onPress={onOink}
                    className="flex flex-row items-center"
                  >
                      <Image
                        source={userOinkedPost ? require("@/assets/images/oink.png") : require("@/assets/images/oink-birthday.png")}
                        className="w-12 h-12"
                      />

                    {/*<MaterialCommunityIcons*/}
                    {/*  name={*/}
                    {/*    userOinkedPost ? "piggy-bank" : "piggy-bank-outline"*/}
                    {/*  }*/}
                    {/*  size={24}*/}
                    {/*  color="purple"*/}
                    {/*/>*/}

                  </TouchableOpacity>
                );
              }}
            >
              <TooltipContent>
                <TooltipText>
                  Oinking a post means you're giving the author your points!
                </TooltipText>
              </TooltipContent>
            </Tooltip>
          )}

          <Box className="flex flex-row items-center gap-2">
            <TouchableOpacity
              onPress={viewComments}
              className="flex flex-row items-center"
            >
              <MaterialCommunityIcons
                name={
                  showComments
                    ? "comment-processing-outline"
                    : "comment-processing"
                }
                size={24}
                color="blue"
              />
            </TouchableOpacity>
            <Text>{post.comments ? post.comments.length : 0}</Text>
          </Box>
          {isCommunityAdmin && (
            // <Icon
            //   variant="transparent"
            //   //size="lg"
            //   aria-label="PinToCommunity"
            //   onClick={pinToCommunity}
            // >
            //   <IconPin
            //     style={{ width: rem(20), color: "gold", cursor: "pointer" }}
            //     stroke={1.5}
            //     //size="lg"
            //     fill={pinned ? "gold" : "transparent"}
            //   />
            // </Icon>
            <TouchableOpacity
              onPress={pinToCommunity}
              className="flex flex-row items-center"
            >
              <Entypo name="pin" size={20} color="gold" />
            </TouchableOpacity>
          )}
          {/* <ShareMenu
            url={`/post/${post.id}`}
            title={shareTitle}
            communityTitle={communityTitle}
          /> */}
          <Box className="ml-auto">
            <PostMenu
              post={post}
              type="post"
              onEdit={handleEdit}
              onDelete={handleDelete}
              onShare={handleShare}
              userId={userId}
              editing={editing}
            />
          </Box>
        </Box>
      )}

      {post.advert && (
        <Text className="mt-4 text-sm text-gray-500 px-2 pb-4" bold>
          This is a sponsored advertisement. We may receive a commission for
          purchases made through this link.
        </Text>
      )}
    </Box>
  );
}
