import { Community } from "@/_sdk";
import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";
import { Box } from "../ui/box";
import { Button, ButtonText } from "../ui/button";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";

export default function CommunityCard({ community }: { community: Community }) {
  const router = useRouter();

  return (
    <Box className="p-4 shadow-2xl rounded-xl bg-white border border-gray-300">
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/(protected)/communities/[slug]",
            params: { slug: community.slug, communityId: community.id },
          });
        }}
      >
        <HStack className="py-1 gap-4">
          <Avatar size="md">
            <AvatarFallbackText>
              {community.title?.charAt(0).toUpperCase()}
            </AvatarFallbackText>
            <AvatarImage
              source={{
                uri: community.image || "",
              }}
            />
          </Avatar>
          <Box>
            <Text className="font-bold flex-wrap">
              {community.title?.length > 28
                ? `${community.title?.slice(0, 25)}...`
                : community.title}
            </Text>

            <Text className="text-xs">
              {community.members?.length ?? 0} members
            </Text>
          </Box>
          <Button
            action="secondary"
            variant="solid"
            size="xs"
            className="rounded bg-secondary-0 h-8 px-3 ml-auto "
          >
            <ButtonText className="text-white">Join</ButtonText>
          </Button>
        </HStack>
        <Box>
          {community.description && (
            <Text className="mt-1 line-clamp-2 leading-6 text-sm text-gray-400 text-wrap">
              {community.description.slice(0, 100).replace(/<[^>]+>/g, "")}
              ...
            </Text>
          )}

          {community.requiresPaidSubscription && (
            <Text className="text-primary-50 mt-2 text-xs">
              💰 Paid Subscription required
            </Text>
          )}
          {community.featured && (
            <Text className="text-amber-800 mt-2 text-xs">
              ⭐ Featured Community
            </Text>
          )}
        </Box>
      </TouchableOpacity>
    </Box>
  );
}
