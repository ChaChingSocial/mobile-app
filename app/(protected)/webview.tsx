import { useLocalSearchParams, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity,
  View,
  Text,
} from "react-native";
import WebView from "react-native-webview";
import { AntDesign } from "@expo/vector-icons";

export default function WebViewScreen() {
  const router = useRouter();
  const { url, title } = useLocalSearchParams<{ url: string; title?: string }>();
  const [loading, setLoading] = useState(true);

  if (!url) {
    return (
      <SafeAreaView className="flex-1 items-center justify-center">
        <Text className="text-gray-500">No URL provided.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-white">
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-gray-200 gap-3">
        <TouchableOpacity onPress={() => router.back()} hitSlop={8}>
          <AntDesign name="close" size={22} color="black" />
        </TouchableOpacity>
        <Text className="flex-1 font-semibold text-sm text-gray-800" numberOfLines={1}>
          {title ?? url}
        </Text>
      </View>

      {/* Loading bar */}
      {loading && (
        <View className="absolute top-[56px] left-0 right-0 z-10 items-center py-4 bg-white">
          <ActivityIndicator size="small" color="#6b7280" />
        </View>
      )}

      <WebView
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        javaScriptEnabled
        domStorageEnabled
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        startInLoadingState={false}
        style={{ flex: 1 }}
      />
    </SafeAreaView>
  );
}
