import { Community } from "@/_sdk";
import { useRouter } from "expo-router";
import React from "react";
import { Image, TouchableOpacity } from "react-native";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { ArrowRightIcon, Icon } from "../ui/icon";
import { Text } from "../ui/text";

type ThemedCommunity = Community & {
  themeDarkColor?: string;
  themeLightColor?: string;
};

const FALLBACK_CARD_COLORS = ["#355BB8", "#1C8A4A", "#A73A6D", "#8F4BB3"];

const hashString = (value: string) =>
  value.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);

const stripHtml = (value: string) => value.replace(/<[^>]+>/g, "").trim();

const formatMeetingType = (meetingType?: Community["meetingType"]) => {
  if (!meetingType) return "Community";
  if (meetingType === "IRL") return "In person";
  if (meetingType === "VIRTUAL") return "Virtual";
  return "Community";
};

export default function CommunityCard({ community }: { community: Community }) {
  const router = useRouter();
  const themedCommunity = community as ThemedCommunity;

  const memberCount = community.members?.length ?? 0;
  const cleanDescription = stripHtml(community.description || "Find your people and start connecting.");
  const cardColor =
    themedCommunity.themeDarkColor ||
    FALLBACK_CARD_COLORS[hashString(community.slug || community.title || "") % FALLBACK_CARD_COLORS.length];
  const chips = (community.interests || []).slice(0, 3);

  return (
    <Box className="overflow-hidden rounded-[34px] p-4" style={{ backgroundColor: cardColor }}>
      <TouchableOpacity
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`Open ${community.title}`}
        onPress={() => {
          router.push({
            pathname: "/(protected)/communities/[slug]",
            params: {
              title: community.title,
              slug: community.slug,
              communityId: community.id,
              themeDarkColor: themedCommunity.themeDarkColor,
              themeLightColor: themedCommunity.themeLightColor,
            },
          });
        }}
      >
        <HStack className="gap-4">
          <Box className="h-40 w-40 overflow-hidden rounded-[28px] bg-white/20">
            {community.image ? (
              <Image source={{ uri: community.image }} className="h-full w-full" resizeMode="cover" />
            ) : (
              <Box className="h-full w-full items-center justify-center">
                <Text className="text-xl font-bold text-white/80">
                  {community.title?.charAt(0).toUpperCase()}
                </Text>
              </Box>
            )}
          </Box>

          <Box className="flex-1">
            <Text className="text-2xl font-extrabold text-white" numberOfLines={1}>
              {community.title}
            </Text>

            <Box className="mt-2 self-start rounded-full bg-white/15 px-4 py-1">
              <Text className="text-base text-white">{formatMeetingType(community.meetingType)}</Text>
            </Box>

            <HStack className="mt-2 items-center self-start rounded-full bg-black/20 px-4 py-1">
              <Text className="text-base text-white">Members</Text>
              <Box className="ml-2 rounded-full bg-white/25 px-2 py-[1px]">
                <Text className="text-sm font-semibold text-white">{memberCount}</Text>
              </Box>
            </HStack>

            {(community.featured || community.requiresPaidSubscription) && (
              <Box className="mt-2 self-start rounded-full bg-[#F2ED79] px-3 py-1">
                <Text className="text-xs font-bold text-black">
                  {community.featured ? "NEW" : "PAID"}
                </Text>
              </Box>
            )}
          </Box>
        </HStack>

        <Text className="mt-4 text-xl text-white/95" numberOfLines={2}>
          {cleanDescription}
        </Text>

        <HStack className="mt-4 items-end justify-between gap-3">
          <HStack className="flex-1 flex-wrap gap-2">
            {chips.length > 0 ? (
              chips.map((interest) => (
                <Box key={interest} className="rounded-full bg-white/80 px-4 py-1.5">
                  <Text className="text-sm font-medium text-black/85">{interest}</Text>
                </Box>
              ))
            ) : (
              <Box className="rounded-full bg-white/80 px-4 py-1.5">
                <Text className="text-sm font-medium text-black/85">General</Text>
              </Box>
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
