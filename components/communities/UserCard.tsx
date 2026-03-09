import { Community } from "@/_sdk";
import { communityApi } from "@/config/backend";
import { useUserStore } from "@/lib/store/user";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { ArrowRightIcon, Icon } from "../ui/icon";
import { Text } from "../ui/text";

interface UserProfile {
  bio: string;
  displayName: string;
  interests: string[];
  photoURL: string;
  userId: string;
}

const MAX_SHOWN = 5;
const FALLBACK_CARD_COLORS = ["#355BB8", "#1C8A4A", "#A73A6D", "#8F4BB3"];

const hashString = (value: string) =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

export default function UserCard({ user }: { user: UserProfile }) {
  const router = useRouter();
  const myMemberships = useUserStore((state) => state.userCommunities) as Community[];
  const [sharedCommunities, setSharedCommunities] = useState<Community[]>([]);

  useEffect(() => {
    if (!user.userId || myMemberships.length === 0) return;

    let cancelled = false;

    (async () => {
      try {
        const theirMemberships = await communityApi.getUserCommunityMembership({
          userId: user.userId,
        });
        if (cancelled || !theirMemberships) return;

        const myIds = new Set(myMemberships.map((c) => c.id));
        const shared = theirMemberships.filter((c) => myIds.has(c.id));
        setSharedCommunities(shared);
      } catch {
        // silently ignore - not critical
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.userId, myMemberships]);

  const shownCommunities = sharedCommunities.slice(0, MAX_SHOWN);
  const extraCount = sharedCommunities.length - MAX_SHOWN;
  const interests = (user.interests || []).slice(0, 3);
  const cardColor =
    FALLBACK_CARD_COLORS[
      hashString(user.userId || user.displayName || "") % FALLBACK_CARD_COLORS.length
    ];

  return (
    <Box className="overflow-hidden rounded-[34px] p-4" style={{ backgroundColor: cardColor }}>
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Open ${user.displayName} profile`}
        onPress={() => {
          if (!user.userId) {
            console.warn("[UserCard] Cannot navigate to profile: user.userId is undefined");
            return;
          }
          router.push({
            pathname: "/(protected)/user-profile",
            params: {
              id: user.userId,
              displayName: user.displayName,
              photoURL: user.photoURL,
              bio: user.bio,
              interests: JSON.stringify(user.interests || []),
            },
          });
        }}
      >
        <HStack className="gap-4">
          <Box className="h-36 w-36 overflow-hidden rounded-[28px] bg-white/20">
            {user.photoURL ? (
              <Image source={{ uri: user.photoURL }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Box className="h-full w-full items-center justify-center">
                <Text className="text-5xl font-bold text-white/80">
                  {user.displayName?.charAt(0).toUpperCase() || "U"}
                </Text>
              </Box>
            )}
          </Box>

          <Box className="flex-1">
            <Text className="text-3xl font-extrabold text-white" numberOfLines={1}>
              {user.displayName || "Unknown User"}
            </Text>

            <Box className="mt-2 self-start rounded-full bg-white/15 px-4 py-1">
              <Text className="text-base text-white">People</Text>
            </Box>

            <HStack className="mt-2 items-center self-start rounded-full bg-black/20 px-4 py-1">
              <Text className="text-base text-white">Shared groups</Text>
              <Box className="ml-2 rounded-full bg-white/25 px-2 py-[1px]">
                <Text className="text-sm font-semibold text-white">{sharedCommunities.length}</Text>
              </Box>
            </HStack>

            {sharedCommunities.length > 0 && (
              <Box className="mt-2 self-start rounded-full bg-white/15 px-4 py-1">
                <Text className="text-sm text-white" numberOfLines={1}>
                  {shownCommunities[0]?.title || "Community"}
                  {extraCount > 0 ? ` +${extraCount}` : ""}
                </Text>
              </Box>
            )}
          </Box>
        </HStack>

        <Text className="mt-4 text-xl text-white/95" numberOfLines={2}>
          {user.bio || "Open profile to learn more about this member."}
        </Text>

        <HStack className="mt-4 items-end justify-between gap-3">
          <HStack className="flex-1 flex-wrap gap-2">
            {interests.length > 0 && (
              interests.map((interest) => (
                <Box key={interest} className="rounded-full bg-white/80 px-4 py-1.5">
                  <Text className="text-sm font-medium text-black/85">{interest}</Text>
                </Box>
              ))
            )}
          </HStack>

          <Box className="h-14 w-14 items-center justify-center rounded-full bg-[#F2ED79]">
            <Icon as={ArrowRightIcon} size="xl" className="text-black" />
          </Box>
        </HStack>
      </TouchableOpacity>
    </Box>
  );
}
