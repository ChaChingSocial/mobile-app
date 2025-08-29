import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { useEffect, useRef, useState } from "react";
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView
} from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

const PostEditor = () => {
  const richText = useRef<RichEditor | null>(null);

  const [newPostContent, setNewPostContent] = useState("");
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

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
      keyboardVerticalOffset={Platform.OS === "ios" ? 80 : 0}
    >
      <ScrollView>
        <Box
          className="w-full flex-1 rounded-3xl h-full space-between border-t border-gray-300 bg-white"
          style={{ marginBottom: keyboardHeight }}
        >
          <RichEditor
            ref={richText}
            onChange={(text) => setNewPostContent(text)}
            placeholder="What's on your mind?"
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
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          // actions.insertImage,
          // actions.insertVideo,
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
};

export default PostEditor;
