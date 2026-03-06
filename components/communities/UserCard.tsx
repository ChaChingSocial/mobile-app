import { Community } from "@/_sdk";
import { communityApi } from "@/config/backend";
import { useUserStore } from "@/lib/store/user";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { Image, TouchableOpacity, View } from "react-native";
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


const MAX_SHOWN = 5;

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
        const shared = theirMemberships.filter((c) =>
          myIds.has(c.id)
        );
        setSharedCommunities(shared);
      } catch {
        // silently ignore — not critical
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user.userId, myMemberships]);

  const shownCommunities = sharedCommunities.slice(0, MAX_SHOWN);
  const extraCount = sharedCommunities.length - MAX_SHOWN;

  return (
    <Box className="p-4 shadow-2xl rounded-xl bg-white border border-gray-300">
      <TouchableOpacity
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
        <HStack className="py-1 gap-4 items-center">
          <Avatar size="md">
            <AvatarFallbackText>
              {user.displayName?.charAt(0).toUpperCase()}
            </AvatarFallbackText>
            <AvatarImage source={{ uri: user.photoURL || "" }} />
          </Avatar>

          <Box className="flex-1">
            <Text className="font-bold">{user.displayName}</Text>

            {user.bio ? (
              <Text className="text-sm text-gray-400 mt-1" numberOfLines={2}>
                {user.bio}
              </Text>
            ) : null}

            {user.interests?.length > 0 && (
              <HStack className="flex-wrap gap-1 mt-2">
                {user.interests.slice(0, 4).map((interest, i) => (
                  <Box key={i} className="bg-gray-100 rounded-full px-2 py-0.5">
                    <Text className="text-xs text-gray-600">{interest}</Text>
                  </Box>
                ))}
              </HStack>
            )}

            {/* ── Shared communities ── */}
            {sharedCommunities.length > 0 && (
              <View style={{ marginTop: 10 }}>
                <Text className="text-xs text-gray-400 mb-1.5">
                  {sharedCommunities.length}{" "}
                  {sharedCommunities.length === 1 ? "community" : "communities"} in common
                </Text>

                <HStack className="items-end gap-2">
                  {shownCommunities.map((c) => (
                    <View
                      key={c.id}
                      style={{ width: 44, alignItems: "center" }}
                    >
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          borderWidth: 1.5,
                          borderColor: "#e5e7eb",
                          overflow: "hidden",
                        }}
                      >
                        <Image
                          source={{ uri: c.image }}
                          style={{ width: 36, height: 36 }}
                          resizeMode="cover"
                        />
                      </View>
                      <Text
                        numberOfLines={1}
                        style={{
                          fontSize: 9,
                          color: "#6b7280",
                          marginTop: 3,
                          width: 50,
                          textAlign: "center",
                        }}
                      >
                        {c.title}
                      </Text>
                    </View>
                  ))}

                  {extraCount > 0 && (
                    <View style={{ width: 44, alignItems: "center", marginBottom: 23 }}>
                      <View
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 18,
                          backgroundColor: "#e5e7eb",
                          alignItems: "center",
                          justifyContent: "center",
                          borderWidth: 1.5,
                          borderColor: "#d1d5db",
                        }}
                      >
                        <Text style={{ fontSize: 10, fontWeight: "700", color: "#6b7280" }}>
                          +{extraCount}
                        </Text>
                      </View>
                    </View>
                  )}
                </HStack>
              </View>
            )}
          </Box>
        </HStack>
      </TouchableOpacity>
    </Box>
  );
}
