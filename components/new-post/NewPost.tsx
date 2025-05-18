import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useSession } from "@/lib/providers/AuthContext";
import { AntDesign, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

export default function NewPost() {
  const { session } = useSession();

  const navigation = useNavigation();
  const router = useRouter();
  const richText = useRef<RichEditor | null>(null);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [communityName, setCommunityName] = useState<string | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);

  useEffect(() => {
    const showSubscription = Keyboard.addListener("keyboardDidShow", (e) => {
      setKeyboardHeight(e.endCoordinates.height);
    });
    const hideSubscription = Keyboard.addListener("keyboardDidHide", () => {
      setKeyboardHeight(0);
    });

    return () => {
      showSubscription.remove();
      hideSubscription.remove();
    };
  }, []);

  const handlePost = async () => {
    try {
      // Get the HTML content from the editor
      const contentHtml = await richText.current?.getContentHtml();
      console.log("Post content:", contentHtml);

      // Here you would typically send the content to your backend
      // navigation.goBack();
    } catch (e) {
      console.log(e);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <Box className="p-4 flex-1 w-full gap-4">
        <Box className="w-full flex-row justify-between">
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <AntDesign name="close" size={30} color="black" />
          </TouchableOpacity>
          <TouchableOpacity
            className="bg-blue-500 rounded-full"
            onPress={handlePost}
          >
            <Text className="px-5 py-2 text-white font-bold text-base">
              Post
            </Text>
          </TouchableOpacity>
        </Box>

        <Box className="">
          <TouchableOpacity
            className="bg-gray-300 rounded-full px-4 flex-row items-center gap-1"
            onPress={() => router.push("/(protected)/search-community")}
          >
            <Text className="text-gray-900 my-2.5 font-bold w-fit">
              Select a community
            </Text>
            <Ionicons name="chevron-expand-outline" size={24} color="black" />
          </TouchableOpacity>
        </Box>

        <Box className="w-full">
          <TextInput
            value={newPostTitle}
            onChangeText={(value) => setNewPostTitle(value)}
            multiline={true}
            numberOfLines={2}
            className="font-bold max-h-[300px] text-2xl"
            placeholder="Title"
          />
        </Box>

        <ScrollView>
          <Box
            className="w-full flex-1 rounded-3xl h-full space-between"
            style={{ marginBottom: keyboardHeight }}
          >
            <RichEditor
              ref={richText}
              onChange={(text) => setNewPostContent(text)}
              placeholder="body text"
              initialContentHTML={newPostContent}
              editorStyle={{
                backgroundColor: "transparent",
                color: "gray",
                placeholderColor: "gray",
                cssText: `
                    * {
                      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                      font-size: 16px;
                      line-height: 1.5;
                    }
                  `,
              }}
              className="flex-1"
              useContainer={true}
            />
          </Box>
        </ScrollView>
      </Box>

      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          actions.insertImage,
          actions.insertVideo,
        ]}
        iconMap={{
          [actions.heading1]: ({ tintColor }: { tintColor?: string }) => (
            <Text style={[{ color: tintColor }]}>H1</Text>
          ),
          [actions.heading2]: ({ tintColor }: { tintColor?: string }) => (
            <Text style={[{ color: tintColor }]}>H2</Text>
          ),
        }}
        style={{
          backgroundColor: "#fff",
          borderColor: "#ddd",
          borderTopWidth: 1,
          marginLeft: -10,
          marginRight: -10,
        }}
      />
    </KeyboardAvoidingView>
  );
}
