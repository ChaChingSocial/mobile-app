import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from "react-native";
import { ReactNode, useEffect, useState } from "react";
import { Icon } from "./ui/icon";
import { AntDesign, EvilIcons } from "@expo/vector-icons";
export const { width: WIDTH, height: HEIGHT } = Dimensions.get("window");

type TagInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  subComponent?: () => ReactNode;
  placeholder?: string;
  textInputStyle?: object;
  tagItemStyle?: object;
  suggestionData?: { value: string; label?: string }[];
  Avatar?: React.ComponentType<{ value: string }>;
  className?: string;
};

export default function TagInput({
  value = [],
  onChange,
  subComponent,
  placeholder,
  textInputStyle,
  tagItemStyle,
  suggestionData,
  Avatar,
  className: ClassName,
}: TagInputProps) {
  const [inputPosition, setInputPosition] = useState(0);
  const [tagInput, setTagInput] = useState("");
  const [removeTagItem, setRemoveTagItem] = useState<string | null>(null);
  const [tags, setTags] = useState<string[]>(value);

  useEffect(() => {
    onChange(tags);
  }, [tags]);

  const tagFilter = () => {
    return suggestionData?.filter((item) => {
      return item?.value?.toLowerCase()?.includes(tagInput?.toLowerCase());
    });
  };

  const handleAddTag = () => {
    if (tagInput.trim()) {
      // Check if tag already exists
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
        setTagInput("");
      }
    }
  };

  return (
    <>
      <View className={ClassName}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "flex-start",
            flexWrap: "wrap",
            gap: 2,
            rowGap: 10,
            // marginVertical: tags.length > 0 ? 6 : 0,
          }}
        >
          {tags.map((tag) => (
            <View
              className="flex flex-row items-center justify-center ml-1 py-1 px-3 rounded-2xl h-fit"
              style={[
                {
                  backgroundColor:
                    removeTagItem === tag ? "#00bf63" : "#7e22ce",
                },
                tagItemStyle,
              ]}
              key={tag}
            >
              <Text className="color-white font-semibold">{tag}</Text>
              <TouchableOpacity
                onPress={() => {
                  setTags((_tags) => _tags.filter((item) => item !== tag));
                  setRemoveTagItem(null);
                }}
                className="pl-1"
              >
                <AntDesign name="closecircle" size={16} color="white" />
              </TouchableOpacity>
            </View>
          ))}

          <TextInput
            // className="max-h-5"
            onLayout={(event) => {
              const layout = event.nativeEvent.layout;
              setInputPosition(layout.y + layout.height);
            }}
            onChangeText={(text) => {
              setRemoveTagItem(null);
              setTagInput(text);
            }}
            onKeyPress={({ nativeEvent }) => {
              if (nativeEvent.key === "Backspace") {
                if (tagInput.length === 0) {
                  if (removeTagItem) {
                    setTags((_tags) =>
                      _tags.filter((item) => item !== removeTagItem)
                    );
                    setRemoveTagItem(null);
                  } else {
                    setRemoveTagItem(tags[tags.length - 1]);
                  }
                }
              } else if (nativeEvent.key === "Enter") {
                handleAddTag();
              }
            }}
            onSubmitEditing={handleAddTag}
            blurOnSubmit={false}
            style={[
              textInputStyle,
              //   tags.length > 0 ? { padding: 0, marginLeft: 10 } : {},
            ]}
            placeholder={placeholder}
            autoCapitalize="none"
            autoCorrect={false}
            value={tagInput}
            returnKeyType="done"
          />
        </View>

        {/* {tagInput.length > 0 && (
          <View
            style={{
              width: "100%",
              maxHeight: 50, // Add max height
              position: "absolute", // Position absolutely
              top: inputPosition, // Position below the input
              zIndex: 1000, // Ensure it appears above other elements
              backgroundColor: "white", // Add background
              elevation: 3, // Add shadow on Android
              shadowColor: "#000", // Add shadow on iOS
              shadowOffset: { width: 0, height: 2 },
              shadowOpacity: 0.1,
              shadowRadius: 2,
            }}
          >
            <ScrollView>
              {tagFilter()?.length === 0 && (
                <TouchableOpacity onPress={handleAddTag}>
                  <View
                    style={{
                      flexDirection: "row",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: "#ccc",
                      padding: 8,
                      alignItems: "center",
                    }}
                  >
                    {Avatar && <Avatar value={tagInput} />}

                    <View style={{ marginLeft: 8 }}>
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          marginTop: 2,
                        }}
                      >
                        {tagInput}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              )}

              {tagFilter()?.map((item) => (
                <TouchableOpacity
                  key={item.value}
                  onPress={() => {
                    if (!tags.includes(item.value)) {
                      setTags([...tags, item.value]);
                    }
                    setTagInput("");
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      borderWidth: StyleSheet.hairlineWidth,
                      borderColor: "#ccc",
                      padding: 8,
                      alignItems: "center",
                    }}
                  >
                    {Avatar && <Avatar value={item.value} />}

                    <View style={{ marginLeft: 8 }}>
                      {item.label && (
                        <Text style={{ fontSize: 16, fontWeight: "bold" }}>
                          {item.label}
                        </Text>
                      )}
                      <Text
                        style={{
                          fontSize: 15,
                          fontWeight: "600",
                          marginTop: 2,
                        }}
                      >
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )} */}
      </View>
      {tagInput.length === 0 && subComponent?.()}
    </>
  );
}
