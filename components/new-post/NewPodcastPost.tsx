import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { createPost } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { usePostStore } from "@/lib/store/post";
import { Picture, Post as PostType, SpotifyEmbed } from "@/types/post";
import { AntDesign, FontAwesome5, Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
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
import PostTags from "../home/post-editor/PostTag";
import TagInput from "../TagInput";
import { Avatar, AvatarFallbackText, AvatarImage } from "../ui/avatar";
import { Button, ButtonText } from "../ui/button";
import {
  Drawer,
  DrawerBackdrop,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
} from "../ui/drawer";
import { Heading } from "../ui/heading";
import { HStack } from "../ui/hstack";
import { Input, InputField } from "../ui/input";

export default function NewPodcastPost() {
  const { session: user } = useSession();

  const createdPostCommunityData = usePostStore(
    (state) => state.createdPostCommunityData
  );
  const setCreatedPost = usePostStore((state) => state.setCreatedPost);

  const navigation = useNavigation();
  const router = useRouter();
  const richText = useRef<RichEditor | null>(null);

  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [spotifyLink, setSpotifyLink] = useState("");
  const [oEmbedData, setOEmbedData] = useState<SpotifyEmbed | null>(null);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [tagDrawerVisible, setTagDrawerVisible] = useState(false);

  // Get the navigation state
  const state = navigation.getState();
  console.log("Navigation state:", state);

  // The previous route is the second last entry in the routes array
  const previousRoute = state?.routes[0];
  console.log("Previous route:", previousRoute?.name);

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

  useEffect(() => {
    if (spotifyLink) {
      fetch(
        `https://open.spotify.com/oembed?url=${encodeURIComponent(spotifyLink)}`
      )
        .then((response) => {
          if (!response.ok) {
            throw new Error("Failed to fetch oEmbed data");
          }
          console.log("OEmbed response:", response);
          return response.json();
        })
        .then((data) => {
          setOEmbedData(data);
        })
        .catch((error) => {
          console.error("Error fetching oEmbed data:", error);
        });
    }
  }, [spotifyLink]);

  const handlePost = async () => {
    try {
      const contentHtml = await richText.current?.getContentHtml();
      console.log("Post content:", contentHtml);
      console.log("Post title:", newPostTitle);
      console.log("Post community ID:", createdPostCommunityData?.id);

      const pictures: Picture[] = [
        {
          id: "picture-0",
          url: oEmbedData?.thumbnail_url || "",
          description:
            oEmbedData?.title || contentHtml || "Picture on ChaChing Social",
          createdAt: new Date(),
          modifiedAt: new Date(),
        },
      ];

      if (user?.uid) {
        const post: PostType = {
          posterUserId: user?.uid,
          posterName: user?.displayName || "Anonymous",
          posterPic: user?.profilePic || "",
          post: contentHtml || "",
          title: newPostTitle || "Podcast Post - ChaChing Social",
          createdAt: new Date(),
          modifiedAt: new Date(),
          podcast: spotifyLink,
          likes: [],
          comments: [],
          tags,
          pictures,
          documents: [],
          linkPreview: null,
          category: "podcast",
          newsfeedId: createdPostCommunityData?.id,
        };
        console.log("Post object created:", post);
        setCreatedPost(post);
        createPost(post)
          .then((createdPost) => {
            console.log("Post created successfully:", createdPost);

            navigation.goBack();
          })
          .catch((error) => {
            console.error("Error creating podcast post:", error);
          });
      }
    } catch (e) {
      console.log(e);
    }
  };

  console.log("New Community ID:", createdPostCommunityData?.id);
  console.log("New Post Title:", newPostTitle);
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

        <TouchableOpacity
          className="bg-gray-300 rounded-full px-4 flex-row items-center gap-1 "
          onPress={() => router.push("/(protected)/search-community")}
        >
          {createdPostCommunityData ? (
            <HStack space="md" className="py-1 flex items-center w-fit">
              <Avatar className="bg-indigo-600" size="sm">
                <AvatarFallbackText className="text-white">
                  {createdPostCommunityData.title}
                </AvatarFallbackText>
                <AvatarImage
                  source={{
                    uri: createdPostCommunityData.image,
                  }}
                />
              </Avatar>

              <Heading size="sm">{createdPostCommunityData.title}</Heading>
            </HStack>
          ) : (
            <Text className="text-gray-900 my-2.5 font-bold w-fit">
              Select a community
            </Text>
          )}
          <Ionicons name="chevron-expand-outline" size={24} color="black" />
        </TouchableOpacity>

        <Box className="w-full">
          <TextInput
            value={newPostTitle}
            onChangeText={(value) => setNewPostTitle(value)}
            multiline={true}
            numberOfLines={2}
            className="font-bold max-h-[300px] text-2xl"
            placeholder="Title"
          />

          <TouchableOpacity
            className="bg-gray-300 rounded-full px-4 flex-row items-center gap-1"
            onPress={() => setTagDrawerVisible(!tagDrawerVisible)}
          >
            {tags.length > 0 ? (
              <HStack space="md" className="py-1 flex items-center w-fit">
                <PostTags tags={tags} />
                <FontAwesome5 name="edit" size={16} color="black" />
              </HStack>
            ) : (
              <Text className="text-gray-900 my-2.5 font-bold w-fit">
                Add a tag (optional)
              </Text>
            )}
          </TouchableOpacity>

          {previousRoute?.name === "new-podcast-post" && (
            <Input
              variant="outline"
              size="md"
              isInvalid={false}
              className="mt-3 rounded-3xl"
            >
              <InputField
                placeholder="Enter Spotify Link"
                value={spotifyLink}
                onChangeText={(value) => setSpotifyLink(value)}
              />
            </Input>
          )}
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
        // className="bg-white border-t border-gray-300 -ml-2 -mr-2"
        style={{
          backgroundColor: "#fff",
          borderColor: "#ddd",
          borderTopWidth: 1,
          marginLeft: -10,
          marginRight: -10,
        }}
      />

      <Drawer
        isOpen={tagDrawerVisible}
        onClose={() => {
          setTagDrawerVisible(false);
        }}
        size="sm"
        anchor="bottom"
      >
        <DrawerBackdrop />
        <DrawerContent>
          <DrawerBody>
            <Text size="xl" className="text-typography-800">
              Tag your post (optional)
            </Text>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder='Press "Enter" to add a tag'
              className="border border-gray-300 rounded-lg mt-2"
            />
          </DrawerBody>
          <DrawerFooter>
            <Button
              onPress={() => {
                setTagDrawerVisible(false);
              }}
              className="flex-1 bg-primary-50"
            >
              <ButtonText>Done</ButtonText>
            </Button>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </KeyboardAvoidingView>
  );
}
