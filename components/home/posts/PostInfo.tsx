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

  const displayName = authorName ?? post.posterName;
  const displayUserId = authorId ?? post.posterUserId;
  const displayPic = authorPic ?? post.posterPic;

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
        <TouchableOpacity onPress={() => router.push(`/(protected)/user-profile?id=${displayUserId}`)}>
          <Text size="sm" className="font-semibold">@{displayName}</Text>
        </TouchableOpacity>
        <Text size="xs">{formatPostDate(createdAt)}</Text>
      </Box>
    );
  }

  return (
    <Box className="flex flex-row items-center justify-between w-full px-4">
      <TouchableOpacity
        onPress={() => router.push(`/(protected)/user-profile?id=${displayUserId}`)}
        className="flex items-left justify-start mt-4"
      >
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
        <Text size="sm" className="text-center mt-2 font-semibold">
          @{displayName}
        </Text>
      </TouchableOpacity>
      <Text size="xs">{formatPostDate(createdAt)}</Text>
    </Box>
  );
};
