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

export function BlogArticleCard({ blog }: { blog: Blog }) {
  const router = useRouter();

  const [authorName, setAuthorName] = useState<string | null>(null);
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [communityPhoto, setCommunityPhoto] = useState<string | null>(null);


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
            }
          });
      }
    };
    fetchCommunityInfo();
  }, [blog.communityId]);

  const handleCardClick = () => {
    router.push({
      pathname: "/blog/[slug]",
      params: { slug: blog.slug, blog: JSON.stringify(blog) },
    });
  };

  return (
    <Card className="mb-4 bg-white border-2 border-[#01af85]">
      <Pressable onPress={handleCardClick}>
        <VStack space="sm">
          <Text className="text-green-800 font-bold mx-4">{communityName}</Text>

          <Image
            source={{ uri: blog.coverPhoto }}
            alt={blog.title}
            className="w-full h-32 rounded-md px-4"
            resizeMode="cover"
          />

          <VStack space="xs" className="px-4">
            <Text className="font-bold text-lg">{blog.title}</Text>
            <Text className="text-gray-500 text-sm">{blog.subtitle}</Text>
          </VStack>

          <HStack space="sm" className="px-4 py-2">
            <Image
              source={{ uri: blog?.authorProfilePic ?? "" }}
              className="w-10 h-10 rounded-full border-2 border-purple-900"
            />
            <VStack>
              <Text className="font-medium">{authorName}</Text>
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
