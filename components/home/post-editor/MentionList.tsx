import React, {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";
import { View, TouchableOpacity, Text, ScrollView } from "react-native";
import { Box } from "@/components/ui/box";

export const MentionList = forwardRef((props, ref) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  const selectItem = (index) => {
    const item = props.items[index];
    if (item) {
      props.command({ id: item.userId, label: item.displayName });
    }
  };

  const upHandler = () => {
    setSelectedIndex(
      (selectedIndex + props.items.length - 1) % props.items.length
    );
  };

  const downHandler = () => {
    setSelectedIndex((selectedIndex + 1) % props.items.length);
  };

  const enterHandler = () => {
    selectItem(selectedIndex);
  };

  useEffect(() => setSelectedIndex(0), [props.items]);

  useImperativeHandle(ref, () => ({
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        upHandler();
        return true;
      }

      if (event.key === "ArrowDown") {
        downHandler();
        return true;
      }

      if (event.key === "Enter") {
        enterHandler();
        return true;
      }

      return false;
    },
  }));

  return (
    <View className="bg-white border border-gray-300 rounded-lg flex-col overflow-hidden p-2">
      {props.items.length ? (
        <ScrollView>
          {props.items.map((item, index) => (
            <TouchableOpacity
              key={index}
              className={`w-full p-2 ${
                index === selectedIndex ? "bg-gray-200" : ""
              }`}
              onPress={() => selectItem(index)}
            >
              <Text className="text-left">{item.displayName}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      ) : (
        <Box className="p-2">
          <Text>No result</Text>
        </Box>
      )}
    </View>
  );
});
