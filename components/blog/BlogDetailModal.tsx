import { Modal, ModalBackdrop, ModalContent, ModalBody, ModalCloseButton, ModalHeader } from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { Image, NativeSyntheticEvent, NativeScrollEvent, View, Pressable, Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import { useEffect, useState } from "react";
import { blogApi, communityApi, userApi } from "@/config/backend";
import { useUserStore } from "@/lib/store/user";
import { Button } from "@/components/ui/button";
import HtmlRenderText from "../common/HtmlRenderText";
import PostTags from "../home/post-editor/PostTag";

// Extended Blog type to support both SDK and local Blog types
interface BlogWithIPFS {
  id?: string;
  title: string;
  slug: string;
  content: string;
  subtitle?: string;
  tags?: string[];
  createdAt?: Date | string;
  modifiedAt?: Date;
  authorId: string;
  coverPhoto?: string;
  draft?: boolean;
  communityId: string;
  postId?: string;
  authorProfilePic?: string;
  ipfsHash?: string;
}

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: BlogWithIPFS | null;
  communityName?: string;
}

export function BlogDetailModal({
  isOpen,
  onClose,
  blog,
  communityName,
}: BlogDetailModalProps) {
  const user = useUserStore((state) => state.user);

  const [authorName, setAuthorName] = useState<string | null>(null);
  const [communityPhoto, setCommunityPhoto] = useState<string | null>(null);
  const [communityTitle, setCommunityTitle] = useState<string | null>(null);
  const [readProgress, setReadProgress] = useState(0);
  const [IPFSSuccess, setIPFSSuccess] = useState(false);
  const [cid, setCid] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommunityInfo = async () => {
      if (blog?.communityId) {
        try {
          const res = await communityApi.communityById({
            communityId: blog.communityId,
          });
          setCommunityPhoto(res.image ?? "");
          setCommunityTitle(res.title ?? "");
        } catch (error) {
          console.error("Error fetching community:", error);
        }
      }
    };

    const fetchAuthorInfo = async () => {
      if (blog?.authorId) {
        try {
          const res = await userApi.getUserById({ userId: blog.authorId });
          setAuthorName(res.username ?? "");
        } catch (error) {
          console.error("Error fetching author:", error);
          setAuthorName("Unknown Author");
        }
      }
    };

    fetchCommunityInfo();
    fetchAuthorInfo();
  }, [blog?.communityId, blog?.authorId]);

  // Reset progress when modal opens/closes or blog changes
  useEffect(() => {
    if (!isOpen) {
      setReadProgress(0);
    }
  }, [isOpen, blog?.slug]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const scrollViewHeight = layoutMeasurement.height;
    const contentHeight = contentSize.height;

    // Calculate the maximum scrollable distance
    const maxScroll = contentHeight - scrollViewHeight;

    if (maxScroll > 0) {
      // Calculate percentage (0-100)
      const percentage = Math.min(100, Math.max(0, (scrollPosition / maxScroll) * 100));
      setReadProgress(Math.round(percentage));
    } else {
      // Content fits in view, already 100% read
      setReadProgress(100);
    }
  };

  const handleIPFS = async () => {
    try {
      const response = await blogApi.uploadToIPFS({ blog: blog as any });
      console.log("Uploaded to IPFS:", response);
      setCid(response);
      setIPFSSuccess(true);
    } catch (error) {
      console.error("Error uploading to IPFS:", error);
    }
  };

  if (!blog) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalBackdrop />
      <ModalContent className="h-[95%] mt-auto mb-0 rounded-t-3xl rounded-b-none">
        <ModalHeader className="border-b border-gray-200 pb-3">
          <VStack space="xs" className="w-full">
            <HStack className="justify-between items-center w-full">
              <Text className="text-lg font-semibold flex-1">{blog.title ? blog.title : "Blog"}</Text>
              <ModalCloseButton onPress={onClose}>
                <Ionicons name="close" size={28} color="black" />
              </ModalCloseButton>
            </HStack>

            {/* Reading Progress Bar */}
            <View className="w-full">
              <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
                <View
                  style={{ width: `${readProgress}%` }}
                  className="h-full bg-green-600"
                />
              </View>
              <Text className="text-xs text-gray-500 mt-1 text-right">
                {readProgress}% read
              </Text>
            </View>
          </VStack>
        </ModalHeader>

        <ModalBody onScroll={handleScroll} scrollEventThrottle={16} className="p-0">
          <View style={{ flex: 1, position: 'relative' }}>
            <VStack space="md" className="p-4">
              {/* Forever this Blog Button */}
              {user && user.id === blog?.authorId && (
                <View style={{ alignItems: "flex-end" }}>
                  <Button onPress={handleIPFS} variant="outline">
                    Forever this Blog
                  </Button>
                </View>
              )}

              {/* Community Name and Photo */}
              <Text className="text-green-800 font-bold italic">
                Community: {communityTitle || communityName}
              </Text>

              {communityPhoto && communityPhoto.trim() !== "" && (
                <Image
                  source={{ uri: communityPhoto }}
                  style={{ width: "100%", height: 100, borderRadius: 8 }}
                  resizeMode="cover"
                />
              )}

              {/* Author Info */}
              <HStack space="sm" className="items-center">
                {blog.authorProfilePic && blog.authorProfilePic.trim() !== "" && (
                  <Image
                    source={{ uri: blog.authorProfilePic }}
                    style={{ width: 40, height: 40, borderRadius: 20, borderWidth: 2, borderColor: "#581c87" }}
                  />
                )}
                <VStack>
                  <Text className="font-medium">{authorName || "Unknown Author"}</Text>
                  <Text className="text-gray-500 text-xs">
                    {blog.createdAt && new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </VStack>
              </HStack>

              {/* IPFS Hash Display */}
              {user && user.id === blog?.authorId && (cid || blog.ipfsHash) && (
                <VStack className="p-4 bg-gray-50 rounded-lg">
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

              {/* Title and Subtitle */}
              <VStack space="xs">
                <Text className="font-bold text-2xl">{blog.title}</Text>
                {blog.subtitle && (
                  <Text className="text-gray-600 text-base">{blog.subtitle}</Text>
                )}
              </VStack>

              {/* Tags */}
              <PostTags tags={blog?.tags ?? []} />

              {/* Cover Photo */}
              {blog?.coverPhoto && (
                <Image
                  source={{ uri: blog.coverPhoto }}
                  style={{ width: "100%", height: 256, borderRadius: 8 }}
                  resizeMode="cover"
                />
              )}

              {/* Blog Content */}
              <Box className="mt-4">
                <HtmlRenderText source={blog?.content ?? ""} />
              </Box>
            </VStack>
          </View>
        </ModalBody>
      </ModalContent>

      {/* IPFS Success Modal */}
      <Modal isOpen={IPFSSuccess} onClose={() => setIPFSSuccess(false)}>
        <ModalBackdrop />
        <ModalContent>
          <ModalBody>
            <VStack space="md" className="p-4">
              <Text className="text-2xl font-bold">IPFS Upload Successful</Text>
              <Text className="text-xl font-bold">
                Your post uploaded to IPFS! 🎉
              </Text>
              <Text>
                Now you can always access your writings regardless of
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
              <Button onPress={() => setIPFSSuccess(false)}>Close</Button>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Modal>
  );
}
