import React, { useRef, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import {
  RichEditor,
  RichToolbar,
  actions,
} from "react-native-pell-rich-editor";

interface PostEditorProps {
  message: string;
  setContent: (content: string) => void;
  id?: string;
  editorType?: "blog" | "post" | "comment" | "community" | "rules";
}

const CHARACTER_LIMITS = {
  blog: 50000,
  rules: 50000,
  post: 600,
  comment: 600,
  community: 600,
};

export default function PostEditor({
  message,
  setContent,
  id,
  editorType = "post",
}: PostEditorProps) {
  const richText = useRef<RichEditor>(null);

  const limit = CHARACTER_LIMITS[editorType] || 600;

  // Set initial content
  useEffect(() => {
    if (richText.current && message) {
      richText.current.setContentHTML(message);
    }
  }, [message]);

  // Handler for content change
  const handleChange = (html: string) => {
    setContent(html);
  };

  // Character count logic
  const getCharCount = (html: string) => {
    // Remove HTML tags and count characters
    return html.replace(/<[^>]+>/g, "").length;
  };

  // Word count logic
  const getWordCount = (html: string) => {
    return html
      .replace(/<[^>]+>/g, "")
      .split(/\s+/)
      .filter(Boolean).length;
  };

  return (
    <View style={styles.container}>
      <RichToolbar
        editor={richText}
        actions={[
          actions.setBold,
          actions.setItalic,
          actions.setUnderline,
          actions.heading2,
          actions.heading3,
          actions.insertBulletsList,
          actions.insertOrderedList,
          actions.insertLink,
          actions.setStrikethrough,
          actions.undo,
          actions.redo,
          actions.removeFormat,
        ]}
        style={styles.toolbar}
      />
      <RichEditor
        ref={richText}
        initialContentHTML={message}
        placeholder={
          editorType === "blog"
            ? "Write your blog here!"
            : "Your thoughts here! Tag with @"
        }
        onChange={handleChange}
        editorStyle={{
          backgroundColor: "#fff",
          color: "#222",
          placeholderColor: "#aaa",
          contentCSSText: "font-size: 16px; min-height: 120px;",
        }}
        style={styles.editor}
        // Optionally set a maxLength (not enforced by the lib, so you can handle in onChange)
      />
      {/* Character/Word Count */}
      <View style={styles.counter}>
        <Text
          style={{
            color: getCharCount(message) > limit ? "#ef4444" : "#6d28d9",
            fontSize: 12,
          }}
        >
          {getCharCount(message)} / {limit} characters
        </Text>
        <Text style={{ color: "#6d28d9", fontSize: 12, marginLeft: 8 }}>
          {getWordCount(message)} words
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  toolbar: {
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginBottom: 8,
  },
  editor: {
    minHeight: 120,
    fontSize: 16,
    borderRadius: 8,
    padding: 8,
    backgroundColor: "#fff",
  },
  counter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 6,
  },
});
