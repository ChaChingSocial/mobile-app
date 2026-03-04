import { useRouter } from "expo-router";
import React from "react";
import { TouchableOpacity } from "react-native";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";
import { Box } from "../ui/box";
import { HStack } from "../ui/hstack";
import { Text } from "../ui/text";

interface UserProfile {
  bio: string;
  displayName: string;
  interests: string[];
  photoURL: string;
  userId: string;
}

export default function UserCard({ user }: { user: UserProfile }) {
  const router = useRouter();

  return (
    <Box className="p-4 shadow-2xl rounded-xl bg-white border border-gray-300">
      <TouchableOpacity
        onPress={() => {
          router.push({
            pathname: "/(protected)/user-profile",
            params: { userId: user.userId },
          });
        }}
      >
        <HStack className="py-1 gap-4 items-center">
          <Avatar size="md">
            <AvatarFallbackText>
              {user.displayName?.charAt(0).toUpperCase()}
            </AvatarFallbackText>
            <AvatarImage source={{ uri: user.photoURL || "" }} />
          </Avatar>
          <Box className="flex-1">
            <Text className="font-bold">{user.displayName}</Text>
            {/*{user.userId ? (*/}
            {/*  <Text className="text-xs text-gray-500">@{user.userId}</Text>*/}
            {/*) : null}*/}
            {user.bio ? (
              <Text className="text-sm text-gray-400 mt-1" numberOfLines={2}>
                {user.bio}
              </Text>
            ) : null}
            {user.interests?.length > 0 && (
              <HStack className="flex-wrap gap-1 mt-2">
                {user.interests.slice(0, 4).map((interest, i) => (
                  <Box
                    key={i}
                    className="bg-gray-100 rounded-full px-2 py-0.5"
                  >
                    <Text className="text-xs text-gray-600">{interest}</Text>
                  </Box>
                ))}
              </HStack>
            )}
          </Box>
        </HStack>
      </TouchableOpacity>
    </Box>
  );
}
