import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge, BadgeText } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { communityApi } from "@/config/backend";
import { checkIfFinFluencer } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { formatPostDate, formatTimestamp } from "@/lib/utils/dates";
import { Post as PostType } from "@/types/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Timestamp } from "firebase/firestore";
import { useEffect, useState } from "react";
import { Pressable, TouchableOpacity } from "react-native";

export const PostInfo = ({
  post,
  createdAt,
}: {
  post: PostType;
  createdAt: Timestamp;
}) => {
  const { session: user } = useSession();
  const { posterName, posterUserId, posterPic } = post;

  const params = useLocalSearchParams();
  const { slug } = params;

  const communityId = post.newsfeedId;
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [communitySlug, setCommunitySlug] = useState<string | null>(null);

  const router = useRouter();

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

  useEffect(() => {
    const fetchCommunityData = async () => {
      if (communityId) {
        try {
          const res = await communityApi.communityById({ communityId });
          if (res) {
            setCommunityName(res.title);
            setCommunitySlug(res.slug);
          }
        } catch (error) {
          console.error("Error fetching community data:", error);
        }
      }
    };

    fetchCommunityData();
  }, []);

  console.log("Community name:", communityName);

  return (
    <>
      {communityName && !slug && (
        <Pressable
          onPress={() =>
            router.push(
              `/(protected)/communities/${communitySlug}?communityId=${communityId}`
            )
          }
          className="flex flex-row items-center justify-between px-4 rounded-lg"
        >
          <Badge
            size="md"
            variant="solid"
            action="info"
            className="ml-auto -mt-2 rounded-md bg-violet-600"
          >
            <BadgeText className="text-purple-50 font-semibold text-xs">
              {communityName.length > 30
                ? `${communityName.slice(0, 30)}...`
                : communityName}
            </BadgeText>
          </Badge>
        </Pressable>
      )}
      <Box className="items-start">
        <Box className="flex flex-row items-center justify-between w-full px-4">
          <TouchableOpacity
            onPress={() =>
              router.push(`/profile/${posterName}?userId=${posterUserId}`)
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
      </Box>
    </>
  );
};
