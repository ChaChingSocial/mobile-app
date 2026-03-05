import { Community } from "@/_sdk";
import NewsfeedList from "@/components/home/NewsfeedList";
import { Box } from "@/components/ui/box";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { getSingleCommunityBySlug } from "@/lib/api/communities";
import { getPostsByNewsfeedIdPaged } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { usePostStore } from "@/lib/store/post";
import { stripHtml } from "@/lib/utils/stripHtml";
import { Post } from "@/types/post";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Image,
  ScrollView,
  View,
  RefreshControl,
  Animated,
  Easing,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Entypo,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import {Colors} from "@/lib/constants/Colors";

export default function SingleCommunity() {
  const params = useLocalSearchParams();
  const { slug, communityId } = params;
  const { session } = useSession();
  const router = useRouter();
  const PAGE_SIZE = 3;

  // FAB state/animation copied from HomePage for consistency
  const [showOptions, setShowOptions] = useState(false);
  const insets = useSafeAreaInsets();
  const fabBottom = Platform.OS === "ios" ? insets.bottom + 16 : 28;

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animations = [
      Animated.timing(rotationAnim, {
        toValue: showOptions ? 1 : 0,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: showOptions ? 0 : 1,
        duration: 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: showOptions ? 1 : 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ];

    Animated.parallel(animations).start();
  }, [showOptions]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  // const routes = navigate.getState()?.routes;
  // const prevRoute = routes[routes.length - 2];

  const [communityData, setCommunityData] = useState<Community | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [initialLoading, setInitialLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  // Post store setters for preselecting/locking community and passing media
  const setCreatedPostImage = usePostStore((state) => state.setCreatedPostImage);
  const setCreatedPostVideo = usePostStore((state) => state.setCreatedPostVideo);
  const setCreatedPostCommunityData = usePostStore(
    (state) => state.setCreatedPostCommunityData
  );
  const setCreatedPostCommunityId = usePostStore(
    (state) => state.setCreatedPostCommunityId
  );
  const setLockCommunitySelection = usePostStore(
    (state) => state.setLockCommunitySelection
  );

  const fetchMore = async () => {
    if (!communityId || !lastDoc || loadingMore) return;
    setLoadingMore(true);
    const { posts: more, lastDoc: next } = await getPostsByNewsfeedIdPaged(
      Array.isArray(communityId) ? communityId[0] : (communityId as string),
      lastDoc,
      PAGE_SIZE
    );
    setPosts((prev) => {
      const seen = new Set(prev.map((p) => p.id));
      const deduped = [...prev, ...more.filter((p) => !seen.has(p.id))];
      return deduped;
    });
    setLastDoc(next);
    setLoadingMore(false);
  };

  const onScrollNearBottom = (e: any) => {
    try {
      const { layoutMeasurement, contentOffset, contentSize } = e.nativeEvent || {};
      if (!layoutMeasurement || !contentOffset || !contentSize) return;
      const distanceFromBottom = contentSize.height - (contentOffset.y + layoutMeasurement.height);
      if (distanceFromBottom < 200 && !loadingMore && lastDoc) {
        fetchMore();
      }
    } catch {}
  };

  const fetchCommunityData = async () => {
    try {
      // const res = await communityApi.communityBySlugName({
      //   slugName: Array.isArray(slug) ? slug[0] : slug,
      // });
      const res = await getSingleCommunityBySlug(
        Array.isArray(slug) ? slug[0] : slug
      );
      // console.log("slug comm", res[0]);

      if (res) {
        setCommunityData(res);
      }
    } catch (error) {
      console.error("Error fetching community data:", error);
    }
  };

  useEffect(() => {
    if (!communityId) {
      console.error("No communityId provided in params");
      return;
    }

    fetchCommunityData();
    // Initial page with fetched 3 posts
    setInitialLoading(true);
    getPostsByNewsfeedIdPaged(
      Array.isArray(communityId) ? communityId[0] : (communityId as string),
      null,
      PAGE_SIZE
    ).then(({ posts: first, lastDoc: ld }) => {
      setPosts(first);
      setLastDoc(ld);
    }).finally(() => setInitialLoading(false));
  }, [communityId]);

  if (!communityData) {
    return (
      <View className="flex-1 items-center justify-center">
        <Center className="flex-1">
          <Spinner color="green" size="large" />
          <Text size="md">Please Wait...</Text>
        </Center>
      </View>
    );
  }

  // const createdAt = communityData.createdAt
  //   ? format(new Date(communityData.createdAt), "MMM d, yyyy")
  //   : "Unknown date";

  const onRefresh = async () => {
    if (!communityId) return;
    setRefreshing(true);
    const { posts: fresh, lastDoc: ld } = await getPostsByNewsfeedIdPaged(
      Array.isArray(communityId) ? communityId[0] : (communityId as string),
      null,
      PAGE_SIZE
    );
    setPosts(fresh);
    setLastDoc(ld);
    setRefreshing(false);
  };

  // Helper: media permissions + pickers (same as HomePage)
  const requestMediaPermissions = async (mediaType: "photo" | "video") => {
    const [mediaLibraryStatus, imagePickerStatus] = await Promise.all([
      MediaLibrary.requestPermissionsAsync(),
      ImagePicker.requestMediaLibraryPermissionsAsync(),
    ]);

    if (
      mediaLibraryStatus.status !== "granted" ||
      imagePickerStatus.status !== "granted"
    ) {
      Alert.alert(
        "Permission required",
        `Sorry, we need access to your media library to select ${
          mediaType === "photo" ? "images" : "videos"
        }!`
      );
      return false;
    }
    return true;
  };

  const pickVideo = async () => {
    if (!(await requestMediaPermissions("video"))) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Videos,
        allowsEditing: false,
        allowsMultipleSelection: false,
        quality: 1,
      });
      if (!result.canceled && result.assets) {
        const pickedVideo = result.assets[0];
        const video = {
          url: pickedVideo.uri,
          description: pickedVideo.fileName ?? "",
          title: pickedVideo.fileName ?? "Untitled Video",
          image: pickedVideo.uri,
          tags: [],
          publisher: session?.displayName || "Anonymous",
          publisherPicUrl: session?.profilePic || "",
        };
        setCreatedPostVideo(video as any);
      }
    } catch (error) {
      console.error("Error picking video:", error);
    }
  };

  const pickImage = async () => {
    if (!(await requestMediaPermissions("photo"))) return;
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: false,
        allowsMultipleSelection: true,
        quality: 1,
        selectionLimit: 10,
      });
      if (!result.canceled && result.assets) {
        const pictures = result.assets.map((asset, idx) => ({
          id: asset.assetId ?? `${idx}-${asset.fileName}`,
          url: asset.uri,
          description: asset.fileName ?? "",
          createdAt: new Date(),
          modifiedAt: new Date(),
        }));
        if (pictures.length > 0) {
          setCreatedPostImage(pictures as any);
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
    }
  };

  const postOptions = [
    {
      title: "Article",
      icon: <FontAwesome5 name="newspaper" size={18} color="white" />,
      route: "/(protected)/create-post/new-article-post" as const,
    },
    {
      title: "Video Link",
      icon: <FontAwesome5 name="video" size={18} color="white" />,
      route: "/(protected)/create-post/new-link-post" as const,
    },
    {
      title: "Images",
      icon: <Entypo name="image" size={20} color="white" />,
      route: "/(protected)/create-post/new-image-post" as const,
    },
    {
      title: "Podcast",
      icon: <FontAwesome5 name="spotify" size={18} color="white" />,
      route: "/(protected)/create-post/new-podcast-post" as const,
    },
    // Event option intentionally commented out to match HomePage
  ];

  const selectedCommunityId = Array.isArray(communityId)
    ? (communityId[0] as string)
    : (communityId as string);

  const prepareCommunitySelection = () => {
    if (communityData?.id) {
      setCreatedPostCommunityData(communityData);
    }
    if (selectedCommunityId) setCreatedPostCommunityId(selectedCommunityId);
    setLockCommunitySelection(true);
  };

  const handleOptionPress = async (
    route:
      | "/(protected)/create-post/new-article-post"
      | "/(protected)/create-post/new-link-post"
      | "/(protected)/create-post/new-image-post"
      | "/(protected)/create-post/new-podcast-post"
      | "/(protected)/create-post/new-event-post"
  ) => {
    setShowOptions(false);
    prepareCommunitySelection();

    if (route === "/(protected)/create-post/new-image-post") {
      await pickImage();
    } else if (route === "/(protected)/create-post/new-link-post") {
      await pickVideo();
    }

    router.push(route);
  };

  return (
    <Box className="flex-1 relative">
      {/* Content */}
      <ScrollView
        className="flex-1"
        style={{backgroundColor: communityData.themeDarkColor || Colors.dark.tint}}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onScroll={onScrollNearBottom}
        scrollEventThrottle={32}
      >
        {communityData.image && (
          <View className="w-full h-60 overflow-hidden">
            <Image
              source={{ uri: communityData.image }}
              className="w-full h-full"
              resizeMode="cover"
            />
          </View>
        )}
        <View className="p-4">
          <View className="flex-row justify-between items-start mb-2">
            <Text className="text-2xl font-bold flex-1 mr-2 text-white">
              {communityData.title}
            </Text>
          </View>
          {communityData.featured && (
            <View className="bg-amber-400 self-start px-2 py-1 rounded-full mb-3">
              <Text className="text-green-900 text-xs font-medium">
                Featured Community
              </Text>
            </View>
          )}
          <Text className="text-gray-500 text-sm mb-4"></Text>
          <View className="mb-6">
            <Text className="text-base text-white" numberOfLines={isExpanded ? undefined : 3}>
              {stripHtml(communityData?.description ?? "")}
            </Text>
            <Text
              className="text-white mt-2 underline"
              onPress={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? "Show less" : "Show more"}
            </Text>
          </View>

          {communityData.interests && communityData.interests.length > 0 && (
            <View className="mb-6">
              <View className="flex-row flex-wrap">
                {communityData.interests.map((interest, index) => (
                  <View
                    key={index}
                    className="px-3 py-1 rounded-full mr-2 mb-2"
                    style={{ backgroundColor: communityData.themeLightColor || Colors.light.tint }}
                  >
                    <Text
                        style={{ color: communityData.themeDarkColor || Colors.dark.tint }}
                    >
                        {interest}
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>
        <NewsfeedList
          posts={posts}
          communityPage={true}
          isUserCommunityAdmin={session?.uid === communityData.adminUserId}
        />
        {(initialLoading || loadingMore) && (
          <Image
            source={require("@/assets/images/logo-inverted.png")}
            alt="Loading..."
            resizeMode="contain"
            className="w-full"
          />
        )}
        <View style={{ height: 24 }} />
      </ScrollView>

      {/* Floating Action Button (same as HomePage) */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: fabBottom,
          right: 12,
          zIndex: 50,
          transform: [{ rotate: rotation }, { scale }],
          opacity: scaleAnim,
        }}
      >
        <TouchableOpacity
          className="p-3 h-16 w-16 bg-secondary-0 shadow-2xl rounded-full items-center justify-center"
          onPress={() => setShowOptions(true)}
        >
          <AddIcon color="white" className="p-5 w-2 h-2" />
        </TouchableOpacity>
      </Animated.View>

      {/* Post Options Modal */}
      <Modal isOpen={showOptions} onClose={() => setShowOptions(false)}>
        <ModalBackdrop style={{ backgroundColor: "black" }} />
        <ModalContent className="w-fit absolute bg-transparent -right-4 bottom-10 border-0">
          <ModalBody className="p-0">
            <VStack className="space-y-2 mr-2">
              {postOptions.map((option, index) => (
                <Box key={index} className="flex-row-reverse items-center pl-2 py-2">
                  <TouchableOpacity onPress={() => handleOptionPress(option.route)}>
                    <View className="w-12 h-12 bg-blue-500 rounded-full justify-center items-center ml-2">
                      {option.icon}
                    </View>
                  </TouchableOpacity>
                  <Text size="sm" className="text-white font-medium">
                    {option.title}
                  </Text>
                </Box>
              ))}
            </VStack>

            <Animated.View style={{ opacity: opacityAnim }}>
              <TouchableOpacity
                className="flex-row-reverse items-center rounded-full pl-2 py-2 mr-1"
                onPress={() => {
                  setShowOptions(false);
                  prepareCommunitySelection();
                  router.push("/(protected)/create-post");
                }}
              >
                <View className="h-16 w-16 bg-secondary-0 rounded-full justify-center items-center ml-2">
                  <MaterialCommunityIcons name="feather" size={24} color="white" />
                </View>
                <Text size="md" className="text-white font-semibold">
                  Create a Post
                </Text>
              </TouchableOpacity>
            </Animated.View>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
