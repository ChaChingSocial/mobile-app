import { Community } from "@/_sdk";
import { ShareMenu } from "@/components/menu/ShareMenu";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { communityApi, userApi } from "@/config/backend";
import { Blog } from "@/types/blog";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Image, Pressable } from "react-native";
import { Divider } from "../ui/divider";
import {Badge, BadgeText} from "@/components/ui/badge";
import {Colors} from "@/lib/constants/Colors";

export function BlogArticleCard({
  blog,
  onPress,
  onTagPress,
}: {
  blog: Blog;
  onPress?: () => void;
  onTagPress?: (tag: string) => void;
}) {
  const router = useRouter();

  const [authorName, setAuthorName] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [communityPhoto, setCommunityPhoto] = useState<string | null>(null);
  const [communityLight, setCommunityLight] = useState<string>();

  // Calculate reading time
  const calculateReadingTime = (content: string): number => {
    // Strip HTML tags from content
    const strippedContent = content.replace(/<[^>]+>/g, " ");
    // Count words (split by whitespace and filter empty strings)
    const wordCount = strippedContent
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
    // Calculate reading time (238 words per minute)
    const readingTimeMinutes = Math.ceil(wordCount / 238);
    return readingTimeMinutes;
  };

  const readingTime = calculateReadingTime(blog.content);
  const blogTags = Array.isArray(blog.tags)
    ? blog.tags.filter((tag) => tag.trim().length > 0)
    : [];

  useEffect(() => {
    if (blog) {
      userApi.getUserById({ userId: blog.authorId }).then((author) => {
        setAuthorName(author.username);
      });
    }
  }, [blog]);

  useEffect(() => {
    const fetchCommunityInfo = async () => {
      if (blog.communityId) {
        await communityApi
          .communityById({ communityId: blog?.communityId })
          .then((community) => {
            if (community) {
              setCommunityName((community as Community).title);
              setCommunityPhoto((community as Community).image);
              setCommunityLight((community as Community).themeLightColor || Colors.light.tint);
            }
          });
      }
    };
    fetchCommunityInfo();
  }, [blog.communityId]);

  const handleCardClick = () => {
    if (onPress) {
      onPress();
    } else {
      router.push({
        pathname: "/blog/[slug]",
        params: { slug: blog.slug, blog: JSON.stringify(blog) },
      });
    }
  };

  return (
    <Card className="mb-4 bg-white border-2" >
      <Pressable onPress={handleCardClick}>
        <VStack space="sm">
          <HStack space="sm" className="items-center mx-4 mb-2">
            {communityPhoto && (
              <Image
                source={{ uri: communityPhoto }}
                alt={communityName || "Community Photo"}
                className="w-10 h-10 rounded-full"
                resizeMode="cover"
              />
            )}
            <Text className="font-bold">{communityName}</Text>
          </HStack>

          <Image
            source={{ uri: blog.coverPhoto }}
            alt={blog.title}
            className="w-full h-32 rounded-md px-4"
            resizeMode="cover"
          />

          <VStack space="xs" className="px-4">
            <Text className="font-bold text-lg">{blog.title}</Text>
            <Text className="text-gray-500 text-sm">{blog.subtitle}</Text>

            {blogTags.length > 0 && (
              <HStack space="xs" className="mt-2 flex-wrap">
                {blogTags.map((tag, index) => (
                  <Pressable
                    key={`${tag}-${index}`}
                    onPress={(event) => {
                      event.stopPropagation();
                      onTagPress?.(tag);
                    }}
                  >
                    <Badge style={{backgroundColor: Colors.dark.tint}} className="border-0 mr-1 mb-1 rounded-full px-3 py-1">
                      <BadgeText className="text-white">{tag}</BadgeText>
                    </Badge>
                  </Pressable>
                ))}
              </HStack>
            )}

            <Badge className="self-start mt-2 bg-yellow-300 border-0">
                <BadgeText className="text-black">
                    ⏰ {readingTime} min read
                </BadgeText>
            </Badge>
          </VStack>

          <HStack space="sm" className="px-4 py-2">
            <Image
              source={{ uri: blog?.authorProfilePic ?? "" }}
              className="w-10 h-10 rounded-full border-2 border-purple-900"
            />
            <VStack className="flex-1">
              <Text className="font-medium">{authorName}</Text>
              <HStack space="xs" className="items-center">
                <Text className="text-gray-500 text-xs">
                  {new Date(Date.parse(blog.createdAt)).toLocaleDateString(
                    "en-US",
                    {
                      month: "2-digit",
                      day: "2-digit",
                      year: "2-digit",
                    }
                  )}
                </Text>
                <Text className="text-gray-400 text-xs">•</Text>
              </HStack>
            </VStack>
          </HStack>
        </VStack>
      </Pressable>

      <Divider className="my-1 bg-gray-300" />

      <HStack className="justify-end items-center p-2">
        {!blog.draft && (
          <ShareMenu
            url={`https://www.chaching.social/blog/${blog.slug}`}
            title={blog.title}
            communityTitle={communityName || "ChaChing Social"}
            imageUrl={blog.coverPhoto}
          />
        )}
      </HStack>
    </Card>
  );
}
