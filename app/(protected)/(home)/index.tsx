import MainNewsfeed from "@/components/home/MainNewsFeed";
import SideBar from "@/components/profile/SideBar";
import { Box } from "@/components/ui/box";
import { AddIcon } from "@/components/ui/icon";
import { Text } from "@/components/ui/text";
import { DrawerContext } from "@/lib/providers/DrawerContext";
import {
  Entypo,
  Feather,
  FontAwesome5,
  Ionicons,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useContext, useEffect, useRef, useState } from "react";
import { Alert, Easing, TouchableOpacity, View } from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import {
  Modal,
  ModalBackdrop,
  ModalContent,
  ModalCloseButton,
  ModalHeader,
  ModalBody,
} from "@/components/ui/modal";
import { VStack } from "@/components/ui/vstack";
import { Animated } from "react-native";
import * as ImagePicker from "expo-image-picker";
import { usePostStore } from "@/lib/store/post";
import { Picture } from "@/types/post";

export default function HomeScreen() {
  const { open, setOpen } = useContext(DrawerContext);
  const router = useRouter();
  const [showOptions, setShowOptions] = useState(false);

  const setCreatedPostImage = usePostStore(
    (state) => state.setCreatedPostImage
  );

  const pickImage = async () => {
    // Request media library permissions
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permission required",
        "Sorry, we need camera roll permissions to make this work!"
      );
      return;
    }

    // Launch image picker with multiple selection enabled
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false, // Disable editing when selecting multiple
      allowsMultipleSelection: true, // Enable multiple selection
      aspect: [4, 3],
      quality: 1,
      selectionLimit: 10, // Optional: Set a limit (0 means no limit)
    });

    if (!result.canceled) {
      // Get array of all selected image URIs
      const selectedImages: Picture[] = result.assets.map((asset, idx) => ({
        id: asset.assetId ?? `${idx}-${asset.fileName}`,
        url: asset.uri,
        description: asset.fileName ?? "",
        createdAt: new Date(),
        modifiedAt: new Date(),
      }));

      setCreatedPostImage(selectedImages);
    }
  };

  const postOptions = [
    {
      title: "Link & Video",
      icon: <FontAwesome5 name="link" size={18} color="white" />,
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

  const handleOptionPress = async (route: any) => {
    setShowOptions(false);

    if (route === "/(protected)/(create-post)/new-image-post") {
      await pickImage();
    }
    router.push(route);
  };

  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showOptions) {
      // Animate when modal opens
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate when modal closes
      Animated.parallel([
        Animated.timing(rotationAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [showOptions]);

  const rotation = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "45deg"],
  });

  const scale = scaleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Box className="flex-1 relative">
      <ScrollView
        contentInsetAdjustmentBehavior="automatic"
        className="bg-white"
      >
        <MainNewsfeed />
        <SideBar open={open} onOpenChange={setOpen} />
      </ScrollView>

      {/* Main Floating Button */}
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

      <Modal
        isOpen={showOptions}
        onClose={() => setShowOptions(false)}
        className=""
      >
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
