import { Blog } from "@/_sdk";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HStack } from "@/components/ui/hstack";
import { Modal } from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { blogApi, communityApi, userApi } from "@/config/backend";
import { useUserStore } from "@/lib/store/user";
import { formatDate } from "@/lib/utils/dates";
import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  Image,
  Linking,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import ParallaxScrollView from "../ParallaxScrollView";
import HtmlRenderText from "../common/HtmlRenderText";
import PostTags from "../home/post-editor/PostTag";

export function SingleBlog({ slug }: { slug: string }) {
  const { blog: blogParam } = useLocalSearchParams();
  const blog: Blog | null =
    typeof blogParam === "string" ? JSON.parse(blogParam) : null;

  const user = useUserStore((state) => state.user);

  const [authorName, setAuthorName] = useState<string | null>(null);
  const [communityPhoto, setCommunityPhoto] = useState<string | null>(null);
  const [communityTitle, setCommunityTitle] = useState<string | null>(null);
  const [IPFSSuccess, setIPFSSuccess] = useState(false);
  const [cid, setCid] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityInfo = async () => {
      if (blog?.communityId) {
        const res = await communityApi.communityById({
          communityId: blog.communityId,
        });

        setCommunityPhoto(res.image ?? "");
        setCommunityTitle(res.title ?? "");
      }
    };

    const fetchAuthorInfo = async () => {
      if (blog?.authorId) {
        const res = await userApi.getUserById({ userId: blog.authorId });
        setAuthorName(res.username ?? "");
      }
    };

    fetchCommunityInfo();
    fetchAuthorInfo();
  }, [blog?.communityId]);

  const handleIPFS = async () => {
    try {
      const response = await blogApi.uploadToIPFS({ blog });
      console.log("Uploaded to IPFS:", response);
      setCid(response);
      setIPFSSuccess(true);
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
    }
  };

  return (
    <ScrollView className="bg-white">
      {user && user.id === blog?.authorId && (
        <View style={{ alignItems: "flex-end", marginTop: 16 }}>
          <Button onPress={handleIPFS} variant="outline">
            Forever this Blog
          </Button>
        </View>
      )}

      <Card>
        <Text className="text-green-800 font-bold m-4 italic">
          Community: {communityTitle}
        </Text>

        {communityPhoto && communityPhoto.trim() !== "" && (
          <Image
            source={{ uri: communityPhoto }}
            className="h-48 rounded-md"
            style={{ width: "100%", height: 192 }}
          />
        )}

        <HStack space="sm" className="mt-4 px-4">
          {blog?.authorProfilePic && blog.authorProfilePic.trim() !== "" && (
            <Image
              source={{ uri: blog.authorProfilePic }}
              className="w-10 h-10 rounded-full border-2 border-purple-900"
            />
          )}
          <VStack>
            <Text className="font-medium">{authorName}</Text>
            <Text className="text-gray-500 text-xs">
              {formatDate(blog?.createdAt)}
            </Text>
          </VStack>
        </HStack>

        {user && user.id === blog?.authorId && (cid || blog.ipfsHash) && (
          <VStack className="p-4">
            <Text className="text-gray-500">
              This blog forever lives at this URL:
            </Text>
            <Pressable
              onPress={() =>
                Linking.openURL(`https://ipfs.io/ipfs/${cid || blog.ipfsHash}`)
              }
            >
              <Text className="text-blue-500">
                https://ipfs.io/ipfs/{cid || blog.ipfsHash}
              </Text>
            </Pressable>
          </VStack>
        )}

        <View className="p-4">
          <Text className="text-2xl font-bold">{blog?.title}</Text>
          <Text className="text-gray-600 mb-4">{blog?.subtitle}</Text>

          <PostTags tags={blog?.tags ?? []} />

          {blog?.coverPhoto && (
            <Image
              source={{ uri: blog.coverPhoto }}
              className="my-4 rounded-md w-full h-64"
              resizeMode="cover"
            />
          )}

          <HtmlRenderText source={blog?.content ?? ""} />
        </View>
      </Card>

      <Modal isOpen={IPFSSuccess} onClose={() => setIPFSSuccess(false)}>
        <VStack space="md" className="p-4">
          <Text className="text-2xl font-bold">IPFS Upload Successful</Text>
          <Text className="text-xl font-bold">
            Your post uploaded to IPFS! 🎉
          </Text>
          <Text>
            Now you can access you can always access your writings regardless of
            which social media you're using. You own your own content.
          </Text>
          <Text>
            You can access your content using the following link on IPFS
            forever:
          </Text>
          <Pressable
            onPress={() => Linking.openURL(`https://ipfs.io/ipfs/${cid}`)}
          >
            <Text className="text-blue-500">https://ipfs.io/ipfs/{cid}</Text>
          </Pressable>
        </VStack>
      </Modal>
    </ScrollView>
  );
}
