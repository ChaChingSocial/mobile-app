import { Modal, ModalBackdrop, ModalContent, ModalBody, ModalCloseButton, ModalHeader } from "@/components/ui/modal";
import { Blog } from "@/types/blog";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { HStack } from "@/components/ui/hstack";
import { ScrollView, Image, Dimensions } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import RenderHtml from "react-native-render-html";

interface BlogDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  blog: Blog | null;
  authorName?: string;
  communityName?: string;
}

export function BlogDetailModal({
  isOpen,
  onClose,
  blog,
  authorName,
  communityName,
}: BlogDetailModalProps) {
  const { width } = Dimensions.get("window");

  if (!blog) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="full">
      <ModalBackdrop />
      <ModalContent className="h-[95%] mt-auto mb-0 rounded-t-3xl rounded-b-none">
        <ModalHeader className="border-b border-gray-200 pb-3">
          <HStack className="justify-between items-center w-full">
            <Text className="text-lg font-semibold flex-1">{blog.title ? blog.title : "Blog"}</Text>
            <ModalCloseButton onPress={onClose}>
              <Ionicons name="close" size={28} color="black" />
            </ModalCloseButton>
          </HStack>
        </ModalHeader>

        <ModalBody className="p-0">
          <ScrollView className="flex-1">
            <VStack space="md" className="p-4">
              {/* Community Name */}
              {communityName && (
                <Text className="text-green-800 font-bold">{communityName}</Text>
              )}

              {/* Cover Photo */}
              {blog.coverPhoto && (
                <Image
                  source={{ uri: blog.coverPhoto }}
                  style={{ width: "100%", height: 200, borderRadius: 8 }}
                  resizeMode="cover"
                />
              )}

              {/* Title and Subtitle */}
              <VStack space="xs">
                <Text className="font-bold text-2xl">{blog.title}</Text>
                {blog.subtitle && (
                  <Text className="text-gray-600 text-base">{blog.subtitle}</Text>
                )}
              </VStack>

              {/* Author Info */}
              <HStack space="sm" className="items-center">
                {blog.authorProfilePic && (
                  <Image
                    source={{ uri: blog.authorProfilePic }}
                    style={{ width: 40, height: 40, borderRadius: 20 }}
                  />
                )}
                <VStack>
                  <Text className="font-medium">{authorName || "Unknown Author"}</Text>
                  <Text className="text-gray-500 text-xs">
                    {new Date(blog.createdAt).toLocaleDateString("en-US", {
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                </VStack>
              </HStack>

              {/* Tags */}
              {blog.tags && blog.tags.length > 0 && (
                <HStack space="xs" className="flex-wrap">
                  {blog.tags.map((tag, idx) => (
                    <Box
                      key={idx}
                      className="bg-green-100 px-3 py-1 rounded-full mb-2"
                    >
                      <Text className="text-green-800 text-xs">#{tag}</Text>
                    </Box>
                  ))}
                </HStack>
              )}

              {/* Blog Content */}
              <Box className="mt-4">
                <RenderHtml
                  contentWidth={width - 32}
                  source={{ html: blog.content }}
                  tagsStyles={{
                    body: { fontSize: 16, lineHeight: 24 },
                    p: { marginBottom: 12 },
                    h1: { fontSize: 24, fontWeight: "bold", marginBottom: 8 },
                    h2: { fontSize: 20, fontWeight: "bold", marginBottom: 8 },
                    h3: { fontSize: 18, fontWeight: "bold", marginBottom: 8 },
                    img: { borderRadius: 8 },
                  }}
                />
              </Box>
            </VStack>
          </ScrollView>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

