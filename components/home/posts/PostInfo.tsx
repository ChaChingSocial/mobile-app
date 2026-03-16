import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { checkIfFinFluencer } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { formatPostDate } from "@/lib/utils/dates";
import { Post as PostType } from "@/types/post";
import { useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Colors} from "@/lib/constants/Colors";

export const PostInfo = ({
  post,
  createdAt,
  authorName,
  authorId,
  authorPic,
  hideAvatar,
}: {
  post: PostType;
  createdAt: Timestamp | Date;
  authorName?: string;
  authorId?: string;
  authorPic?: string;
  hideAvatar?: boolean;
}) => {
  const router = useRouter();
  const { session: user } = useSession();

  const displayUserId = authorId ?? post.posterUserId;
  const displayName = (displayUserId && user?.uid && displayUserId === user.uid && user.displayName)
    ? user.displayName
    : (authorName ?? post.posterName);
  // Prefers current session avatar when the post belongs to the logged-in user to update it instantly
  const displayPic = (displayUserId && user?.uid && displayUserId === user.uid && user.profilePic)
    ? user.profilePic
    : (authorPic ?? post.posterPic);

  const [isFinfluencer, setIsFinfluencer] = useState(false);

  useEffect(() => {
    if (user) {
      const fetchFinFluencerStatus = async () => {
        if (user?.uid) {
          const res = await checkIfFinFluencer(user.uid);
          setIsFinfluencer(res);
        }
      };

      fetchFinFluencerStatus();
    }
  }, [user]);

  if (hideAvatar) {
    return (
      <Box className="flex flex-row items-center justify-between w-full pl-2 pr-4 mt-4">
        <TouchableOpacity
          onPress={() => {
            if (displayUserId) {
              router.push(`/(protected)/user-profile?id=${displayUserId}`);
            } else {
              console.warn("[PostInfo] Cannot navigate to profile: displayUserId is undefined");
            }
          }}
        >
          <Text size="sm" className="font-semibold">@{displayName}</Text>
        </TouchableOpacity>
        <Text size="xs">{formatPostDate(createdAt)}</Text>
      </Box>
    );
  }

  return (
    <Box className="flex flex-row items-center justify-between w-full px-4">
      <TouchableOpacity
        onPress={() => {
          if (displayUserId) {
            router.push(`/(protected)/user-profile?id=${displayUserId}`);
          } else {
            console.warn("[PostInfo] Cannot navigate to profile: displayUserId is undefined");
          }
        }}
        className="items-center justify-center mt-4"
      >
        <Box className="items-center justify-center">
          <Avatar
            size="md"
            className={`object-contain border-2 transform transition-transform duration-200 hover:scale-110 ${
              isFinfluencer ? "border-amber-500" : "border-purple-800"
            }`}
          >
            <AvatarFallbackText>{displayName}</AvatarFallbackText>
            <AvatarImage
              source={{
                uri: displayPic || "",
              }}
            />
          </Avatar>
          <Badge style={{ backgroundColor: Colors.dark.tint }} className="-mt-3 rounded-full px-2 py-1">
            <BadgeText className="text-xs font-semibold text-white">
              {displayName}
            </BadgeText>
          </Badge>
        </Box>
      </TouchableOpacity>
      <Text size="xs">{formatPostDate(createdAt)}</Text>
    </Box>
  );
};
