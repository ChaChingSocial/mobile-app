import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Box } from "@/components/ui/box";
import { Heading } from "@/components/ui/heading";
import { ChevronLeftIcon, ChevronRightIcon } from "@/components/ui/icon";
import { VStack } from "@/components/ui/vstack";
import { Post as PostType } from "@/types/post";
import { useRef, useState } from "react";
import {
  Dimensions,
  Image,
  Modal,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import PagerView from "react-native-pager-view";

export function PicturePost({ post }: { post: PostType }) {
  const [opened, setOpened] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const pagerRef = useRef<PagerView>(null);
  const modalPagerRef = useRef<PagerView>(null);
  const width = Dimensions.get("window").width;
  const imageHeight = width * 0.6; // Maintain aspect ratio

  const handleImageClick = (index: number) => {
    setCurrentImageIndex(index);
    setOpened(true);
  };

  const goNext = () => {
    if (!post.pictures || post.pictures.length === 0) return;

    const nextIndex = (currentImageIndex + 1) % post.pictures.length;
    setCurrentImageIndex(nextIndex);

    if (pagerRef.current) {
      pagerRef.current.setPage(nextIndex);
    }

    if (modalPagerRef.current) {
      modalPagerRef.current.setPage(nextIndex);
    }
  };

  const goPrev = () => {
    if (!post.pictures || post.pictures.length === 0) return;

    const prevIndex =
      (currentImageIndex - 1 + post.pictures.length) % post.pictures.length;
    setCurrentImageIndex(prevIndex);

    if (pagerRef.current) {
      pagerRef.current.setPage(prevIndex);
    }

    if (modalPagerRef.current) {
      modalPagerRef.current.setPage(prevIndex);
    }
  };

  const handlePageSelected = (e: any) => {
    if (e && e.nativeEvent && typeof e.nativeEvent.position === "number") {
      setCurrentImageIndex(e.nativeEvent.position);
    } else {
      console.error("Invalid event data:", e);
    }
  };

  const showPrevButton = currentImageIndex > 0;
  const showNextButton = currentImageIndex < (post.pictures?.length ?? 0) - 1;

  return (
    <Box className="p-4">
      {post.title && (
        <Heading size="md" className="mb-2">
          {post.title}
        </Heading>
      )}

      {post.post && (
        <ScrollView className="mb-3">
          <HtmlRenderText source={post.post} />
        </ScrollView>
      )}

      <VStack className="items-center relative">
        {post.pictures && post.pictures.length > 1 && (
          <View className="absolute top-6 right-2 bg-black/60 rounded-full px-2 py-1 z-10">
            <Text className="text-white text-xs">
              {currentImageIndex + 1}/{post.pictures.length}
            </Text>
          </View>
        )}
        <PagerView
          ref={pagerRef}
          style={{
            width: width * 0.8,
            height: imageHeight,
          }}
          initialPage={0}
          onPageSelected={handlePageSelected}
        >
          {(post.pictures || []).map((picture, index) => {
            const uri = typeof picture === "string" ? picture : picture.url;
            return (
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => handleImageClick(index)}
                className="flex-1"
                key={index}
              >
                <Image
                  source={{ uri }}
                  className="w-full h-full"
                  resizeMode="contain"
                  onError={(e) =>
                    console.log("Image error:", e.nativeEvent.error)
                  }
                />
              </TouchableOpacity>
            );
          })}
        </PagerView>

        {post.pictures && post.pictures.length > 1 && (
          <View className="flex-row justify-center">
            {post.pictures.map((_, index) => (
              <View
                key={index}
                className={`w-2 h-2 rounded-full mx-1 ${
                  index === currentImageIndex ? "bg-primary-500" : "bg-gray-300"
                }`}
              />
            ))}
          </View>
        )}
      </VStack>

      <Modal
        visible={opened}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setOpened(false)}
      >
        <View className="relative flex-1 bg-black/90 justify-center items-center">
          {post.pictures && post.pictures.length > 1 && (
            <View className="absolute top-1/3 right-2 bg-black/60 rounded-full px-2 py-1 z-10">
              <Text className="text-white text-xs">
                {currentImageIndex + 1}/{post.pictures.length}
              </Text>
            </View>
          )}
          <PagerView
            ref={modalPagerRef}
            style={{ width: "100%", height: "100%" }}
            initialPage={currentImageIndex}
            onPageSelected={handlePageSelected}
          >
            {(post.pictures || []).map((picture, index) => {
              const uri = typeof picture === "string" ? picture : picture.url;
              return (
                <View key={index} className="flex-1">
                  <Image
                    source={{ uri }}
                    style={{
                      width: "100%",
                      height: "100%",
                      resizeMode: "contain",
                    }}
                  />
                </View>
              );
            })}
          </PagerView>
          {post.pictures && post.pictures.length > 1 && (
            <View className="absolute bottom-1/3 flex-row justify-center">
              {post.pictures.map((_, index) => (
                <View
                  key={index}
                  className={`w-2 h-2 rounded-full mx-1 ${
                    index === currentImageIndex
                      ? "bg-primary-500"
                      : "bg-gray-300"
                  }`}
                />
              ))}
            </View>
          )}

          {showPrevButton && (
            <TouchableOpacity
              className="absolute left-5 top-1/2 -translate-y-1/2 bg-black/40 rounded-full w-12 h-12 justify-center items-center"
              onPress={goPrev}
            >
              <ChevronLeftIcon width={32} height={32} color="white" />
            </TouchableOpacity>
          )}

          {showNextButton && (
            <TouchableOpacity
              className="absolute right-5 top-1/2 -translate-y-1/2 bg-black/40 rounded-full w-12 h-12 justify-center items-center"
              onPress={goNext}
            >
              <ChevronRightIcon width={32} height={32} color="white" />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            className="absolute top-14 right-5 bg-black/40 rounded-full w-10 h-10 justify-center items-center"
            onPress={() => setOpened(false)}
          >
            <Text className="text-white text-xl font-bold">✕</Text>
          </TouchableOpacity>
        </View>
      </Modal>
    </Box>
  );
}
