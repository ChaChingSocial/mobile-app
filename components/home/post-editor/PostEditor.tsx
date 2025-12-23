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

type PostEditorProps = {
  message: string;
  setContent: (html: string) => void;
  editorType?: "post" | "comment";
};

const PostEditor = ({ message, setContent, editorType }: PostEditorProps) => {
  const richText = useRef<RichEditor | null>(null);

  const [newPostContent, setNewPostContent] = useState(message ?? "");
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const isComment = editorType === "comment";

  useEffect(() => {
    setNewPostContent(message ?? "");
    // Also clear the RichEditor content
    if (richText.current && message === "") {
      richText.current.setContentHTML("");
    }
  }, [message]);

  useEffect(() => {
    if (isComment) return; // don't push UI for small inline editors
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
  }, [isComment]);

  const handleChange = (text: string) => {
    setNewPostContent(text);
    setContent(text);
  };

  // avoids ScrollView/flex growth and margin pushes.
  if (isComment) {
    return (
      <Box className="w-full rounded-3xl border-t border-gray-300 bg-white">
        <RichEditor
          ref={richText}
          onChange={handleChange}
          placeholder="What's on your mind?"
          initialContentHTML={newPostContent}
            editorStyle={{
            backgroundColor: "transparent",
            color: "#000",
            placeholderColor: "gray",
            cssText: `
                     * {
                       font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
                       font-size: 16px;
                       line-height: 1.5;
                     }
                   `,
          }}
          useContainer={true}
          initialHeight={40}
        />
      </Box>
    );
  }

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
            onChange={handleChange}
            placeholder="What's on your mind?"
            initialContentHTML={newPostContent}
            editorStyle={{
              backgroundColor: "transparent",
              color: "#000",
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
      {editorType !== "comment" && (
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
      )}
    </KeyboardAvoidingView>
  );
};

export default PostEditor;
