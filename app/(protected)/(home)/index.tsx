import MainNewsfeed from "@/components/home/MainNewsFeed";
import SideBar from "@/components/profile/SideBar";
import { Box } from "@/components/ui/box";
import { AddIcon } from "@/components/ui/icon";
import {
  Modal,
  ModalBackdrop,
  ModalBody,
  ModalContent,
} from "@/components/ui/modal";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { useSession } from "@/lib/providers/AuthContext";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import { usePostStore } from "@/lib/store/post";
import {
  Entypo,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as MediaLibrary from "expo-media-library";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Animated, Easing, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";

type PostOption = {
  title: string;
  icon: JSX.Element;
  route: string;
};

export default function HomeScreen() {
  const { open, setOpen } = useContext(DrawerContext);
  const { session } = useSession();
  const router = useRouter();

  const [showOptions, setShowOptions] = useState(false);

  const setCreatedPostImage = usePostStore(
    (state) => state.setCreatedPostImage
  );
  const setCreatedPostVideo = usePostStore(
    (state) => state.setCreatedPostVideo
  );

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const postOptions: PostOption[] = [
    {
      title: "Video Link",
      icon: <FontAwesome5 name="video" size={18} color="white" />,
      route: "/(protected)/(create-post)/new-link-post",
    },
    {
      title: "Images",
      icon: <Entypo name="image" size={20} color="white" />,
      route: "/(protected)/(create-post)/new-image-post",
    },
    {
      title: "Podcast",
      icon: <FontAwesome5 name="spotify" size={18} color="white" />,
      route: "/(protected)/(create-post)/new-podcast-post",
    },
    {
      title: "Event",
      icon: <Ionicons name="ticket-outline" size={20} color="white" />,
      route: "/(protected)/(create-post)/new-event-post",
    },
  ];

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
        setCreatedPostVideo(video);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to pick video");
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
          setCreatedPostImage(pictures);
        }
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const handleOptionPress = async (
    route:
      | "/(protected)/(create-post)/new-link-post"
      | "/(protected)/(create-post)/new-image-post"
      | "/(protected)/(create-post)/new-podcast-post"
      | "/(protected)/(create-post)/new-event-post"
  ) => {
    setShowOptions(false);
  
    if (route === "/(protected)/(create-post)/new-image-post") {
      await pickImage();
    } else if (route === "/(protected)/(create-post)/new-link-post") {
      await pickVideo();
    }
  
    router.push(route);
  };

  return (
    <Box className="flex-1 relative">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="bg-white"
      >
        <MainNewsfeed />
        <SideBar open={open} onOpenChange={setOpen} />
      </ScrollView>

      {/* Floating Action Button */}
      <Animated.View
        style={{
          position: "absolute",
          bottom: 28,
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
                <Box
                  key={index}
                  className="flex-row-reverse items-center pl-2 py-2"
                >
                  <TouchableOpacity
                    onPress={() => handleOptionPress(option.route)}
                  >
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
                  router.push("/(protected)/(create-post)");
                }}
              >
                <View className="h-16 w-16 bg-secondary-0 rounded-full justify-center items-center ml-2">
                  <MaterialCommunityIcons
                    name="feather"
                    size={24}
                    color="white"
                  />
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
