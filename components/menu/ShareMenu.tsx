import { useState } from "react";
import { Menu, MenuItem, MenuItemLabel } from "../ui/menu";
import { TouchableOpacity, Alert, Linking } from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import * as Clipboard from "expo-clipboard";

interface ShareMenuProps {
  url: string;
  title: string;
  communityTitle: string;
  tags?: string[];
  text?: string;
}

export const ShareMenu = ({
  url,
  title,
  communityTitle,
  tags,
  text,
}: ShareMenuProps) => {
  const [copiedUrl, setCopiedUrl] = useState("");

  // Function to strip HTML tags from the title
  const stripHtmlTags = (html: string) => html.replace(/<\/?[^>]+(>|$)/g, "");
  const cleanTitle = title ? stripHtmlTags(title) : "";
  const cleanText = text ? stripHtmlTags(text) : "";
  const encodedTitle = encodeURIComponent(
    `${cleanTitle} shared by ${communityTitle || "ChaChing Social"}`
  );
  const encodedUrl = encodeURIComponent(url);
  const hashtags = tags
    ? tags.map((ht) => `#${ht.replace(/\s+/g, "")}`).join(" ")
    : ""; // Remove spaces from hashtags

  const handleCopyLink = async () => {
    await Clipboard.setStringAsync(url);
    setCopiedUrl(url);
    Alert.alert("Copied!", "Link copied to clipboard");
  };

  const shareOnX = () => {
    Linking.openURL(
      `https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}&hashtags=${hashtags}&via=ChaChingSocial`
    );
  };

  const shareOnLinkedIn = () => {
    Linking.openURL(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}&title=${encodedTitle}`
    );
  };

  const shareOnFacebook = () => {
    Linking.openURL(
      `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedTitle}`
    );
  };

  const shareOnBlueSky = () => {
    const hashtagsStr = tags
      ? tags.map((ht) => `#${ht.replace(/\s+/g, "")}`).join(" ")
      : "";
    const textBluesky = `${title} ${url} shared by ${
      communityTitle || "ChaChing Social"
    } ${hashtagsStr}`;
    const encodedText = encodeURIComponent(textBluesky);

    Linking.openURL(`https://bsky.app/intent/compose?text=${encodedText}`);
  };

  const shareOnTelegram = () => {
    const textTelegram = `${title} ${url} shared by ${
      communityTitle || "ChaChing Social"
    }`;
    const encodedText = encodeURIComponent(textTelegram);

    Linking.openURL(
      `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`
    );
  };

  const shareOnDiscord = () => {
    const textDiscord = `${title} ${url} shared by ${
      communityTitle || "ChaChing Social"
    }`;
    const encodedText = encodeURIComponent(textDiscord);

    Linking.openURL(`https://discord.com/channels/@me?text=${encodedText}`);
  };

  const shareOnReddit = () => {
    Linking.openURL(
      `https://www.reddit.com/submit?url=${encodedUrl}&title=${encodedTitle}`
    );
  };

  return (
    <Menu
      trigger={({ ...triggerProps }) => {
        return (
          <TouchableOpacity {...triggerProps}>
            <FontAwesome5 name="share" size={20} color="black" />
          </TouchableOpacity>
        );
      }}
    >
      <MenuItem key="CopyLink" textValue="Copy link" onPress={handleCopyLink}>
        <FontAwesome5 name="link" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Copy link</MenuItemLabel>
      </MenuItem>

      <MenuItem key="ShareOnX" textValue="Share on X" onPress={shareOnX}>
        <FontAwesome5 name="twitter" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Share on X</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnLinkedIn"
        textValue="Share on LinkedIn"
        onPress={shareOnLinkedIn}
      >
        <FontAwesome5
          name="linkedin"
          size={20}
          color="black"
          className="mr-2"
        />
        <MenuItemLabel size="sm">Share on LinkedIn</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnFacebook"
        textValue="Share on Facebook"
        onPress={shareOnFacebook}
      >
        <FontAwesome5
          name="facebook"
          size={20}
          color="black"
          className="mr-2"
        />
        <MenuItemLabel size="sm">Share on Facebook</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnReddit"
        textValue="Share on Reddit"
        onPress={shareOnReddit}
      >
        <FontAwesome5 name="reddit" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Share on Reddit</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnBlueSky"
        textValue="Share on BlueSky"
        onPress={shareOnBlueSky}
      >
        <FontAwesome5
          name="skyatlas"
          size={20}
          color="black"
          className="mr-2"
        />
        <MenuItemLabel size="sm">Share on BlueSky</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnTelegram"
        textValue="Share on Telegram"
        onPress={shareOnTelegram}
      >
        <FontAwesome5
          name="telegram"
          size={20}
          color="black"
          className="mr-2"
        />
        <MenuItemLabel size="sm">Share on Telegram</MenuItemLabel>
      </MenuItem>

      <MenuItem
        key="ShareOnDiscord"
        textValue="Share on Discord"
        onPress={shareOnDiscord}
      >
        <FontAwesome5 name="discord" size={20} color="black" className="mr-2" />
        <MenuItemLabel size="sm">Share on Discord</MenuItemLabel>
      </MenuItem>
    </Menu>
  );
};
