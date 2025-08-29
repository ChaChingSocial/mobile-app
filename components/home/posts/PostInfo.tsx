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
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Linking, TouchableOpacity } from "react-native";

export const PostInfo = ({
  post,
  createdAt,
}: {
  post: PostType;
  createdAt: Timestamp;
}) => {
  const { session: user } = useSession();
  const { posterName, posterUserId, posterPic } = post;

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

  return (
    <Box className="flex flex-row items-center justify-between w-full px-4">
      <TouchableOpacity
        onPress={() =>
          Linking.openURL(
            `https://www.chaching.social/profile/${posterName}?userId=${posterUserId}`
          )
        }
        className="flex items-left justify-start mt-4"
      >
        <Avatar
          size="md"
          className={`object-contain border-2 transform transition-transform duration-200 hover:scale-110 ${
            isFinfluencer ? "border-amber-500" : "border-purple-800"
          }`}
        >
          <AvatarFallbackText>{posterName}</AvatarFallbackText>
          <AvatarImage
            source={{
              uri: posterPic || "",
            }}
          />
        </Avatar>
        <Text size="sm" className="text-center mt-2 font-semibold">
          @{posterName}
        </Text>
      </TouchableOpacity>
      <Text size="xs">{formatPostDate(post.createdAt)}</Text>
    </Box>
  );
};
