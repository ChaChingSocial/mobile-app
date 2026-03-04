import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";
import { useRouter } from "expo-router";
import { LinkPreview } from "@/types/post";
import { stripHtml } from "@/lib/utils/stripHtml";

export function LinkPreviewCard({ linkPreview }: { linkPreview: LinkPreview }) {
  const router = useRouter();

  let domain = "";
  try {
    domain = new URL(linkPreview.url).hostname.replace("www.", "");
  } catch {}

  const openLink = () => {
    if (!linkPreview.url) return;
    router.push({
      pathname: "/(protected)/webview",
      params: { url: linkPreview.url, title: linkPreview.title || domain },
    });
  };

  return (
    <TouchableOpacity
      onPress={openLink}
      activeOpacity={0.8}
      className="border border-gray-200 rounded-xl overflow-hidden mt-2"
    >
      {linkPreview.image ? (
        <Image
          source={{ uri: linkPreview.image }}
          className="w-full h-44"
          resizeMode="cover"
        />
      ) : null}

      <View className="p-3 gap-1 bg-gray-50">
        {domain ? (
          <Text className="text-xs text-gray-400 uppercase tracking-wide">
            {domain}
          </Text>
        ) : null}

        {linkPreview.title ? (
          <Text
            className="font-semibold text-sm text-gray-900"
            numberOfLines={2}
          >
            {linkPreview.title}
          </Text>
        ) : null}

        {linkPreview.description ? (
          <Text className="text-xs text-gray-500" numberOfLines={2}>
            {stripHtml(linkPreview.description)}
          </Text>
        ) : null}
      </View>
    </TouchableOpacity>
  );
}
