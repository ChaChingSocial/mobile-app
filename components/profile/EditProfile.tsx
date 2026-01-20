import { User } from "@/_sdk/models/User";
import {
  Avatar,
  AvatarFallbackText,
  AvatarImage,
} from "@/components/ui/avatar";
import { Box } from "@/components/ui/box";
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
} from "@/components/ui/form-control";
import { Heading } from "@/components/ui/heading";
import { Input, InputField } from "@/components/ui/input";
import { Textarea, TextareaInput } from "@/components/ui/textarea";
import { VStack } from "@/components/ui/vstack";
import { Text } from "@/components/ui/text";
import { userApi } from "@/config/backend";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getDownloadURL, getStorage, listAll, ref, uploadBytes } from "firebase/storage";
import { useEffect, useState } from "react";
import { Alert, ScrollView, TouchableOpacity, View } from "react-native";
import NotifyModal from "../NotifyModal";
import { Button, ButtonText } from "../ui/button";
import { useSession } from "@/lib/providers/AuthContext";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";

async function fetchAllAvatars() {
  try {
    const folderRef = ref(getStorage(), "/app-images/avatars");
    const result = await listAll(folderRef);

    const imageUrls = await Promise.all(
      result.items.map(async (itemRef) => {
        return await getDownloadURL(itemRef);
      })
    );

    return imageUrls;
  } catch (error) {
    console.error("Error fetching images from folder:", error);
    throw error;
  }
}

export default function EditProfileComponent() {
  const params = useLocalSearchParams() as Record<string, string | undefined>;
  const userInfo = params?.userInfo
    ? (JSON.parse(params.userInfo) as User)
    : undefined;
  const { session, updateSession } = useSession();
  const router = useRouter();
  const [formData, setFormData] = useState({
    profilePic: session?.profilePic,
    username: userInfo?.username,
    bio: userInfo?.bio,
    industry: userInfo?.industry,
    facebook: userInfo?.socials?.facebook,
    twitter: userInfo?.socials?.twitter,
    instagram: userInfo?.socials?.instagram,
    linkedin: userInfo?.socials?.linkedin,
    tiktok: userInfo?.socials?.tiktok,
    youtube: userInfo?.socials?.youtube,
    twitch: userInfo?.socials?.twitch,
    snapchat: userInfo?.socials?.snapchat,
    discord: userInfo?.socials?.discord,
    medium: userInfo?.socials?.medium,
    website: userInfo?.socials?.website,
    website2: userInfo?.socials?.website2,
    website3: userInfo?.socials?.website3,
  });
  const [showModal, setShowModal] = useState(false);
  const [avatars, setAvatars] = useState<string[]>([]);
  const [showAvatarCarousel, setShowAvatarCarousel] = useState(false);
  const [showSocialLinks, setShowSocialLinks] = useState(false);

  useEffect(() => {
    loadAvatars();
  }, []);

  // Always prefills the latest values when opening this screen
  useEffect(() => {
    const bootstrap = async () => {
      try {
        const latest = session?.uid
          ? await userApi.getUserById({ userId: session.uid })
          : undefined;
        const seed: any = latest || userInfo;
        if (seed) {
          setFormData({
            profilePic: seed.profilePic ?? session?.profilePic,
            username: seed.username ?? session?.displayName,
            bio: seed.bio ?? null,
            industry: seed.industry ?? null,
            facebook: seed.socials?.facebook ?? null,
            twitter: seed.socials?.twitter ?? null,
            instagram: seed.socials?.instagram ?? null,
            linkedin: seed.socials?.linkedin ?? null,
            tiktok: seed.socials?.tiktok ?? null,
            youtube: seed.socials?.youtube ?? null,
            twitch: seed.socials?.twitch ?? null,
            snapchat: seed.socials?.snapchat ?? null,
            discord: seed.socials?.discord ?? null,
            medium: seed.socials?.medium ?? null,
            website: seed.socials?.website ?? null,
            website2: seed.socials?.website2 ?? null,
            website3: seed.socials?.website3 ?? null,
          });
        }
      } catch {}
    };
    bootstrap();
  }, [session?.uid, params?.userInfo]);

  const loadAvatars = async () => {
    try {
      const avatarUrls = await fetchAllAvatars();
      setAvatars(avatarUrls);
    } catch (error) {
      console.error("Error loading avatars:", error);
    }
  };

  const handleSubmit = async (): Promise<boolean> => {
    const trimmedName = (formData.username ?? "").trim();
    if (!trimmedName) {
      Alert.alert("Username required", "Please enter a username to continue.");
      return false;
    }
    try {
      const user = {
        id: userInfo?.id || session?.uid,
        username: trimmedName,
        bio: formData.bio,
        industry: formData.industry,
        profilePic: formData.profilePic,
        social: {
          facebook: formData.facebook,
          twitter: formData.twitter,
          instagram: formData.instagram,
          linkedin: formData.linkedin,
          tiktok: formData.tiktok,
          youtube: formData.youtube,
          twitch: formData.twitch,
          snapchat: formData.snapchat,
          discord: formData.discord,
          medium: formData.medium,
          website: formData.website,
          website2: formData.website2,
          website3: formData.website3,
        },
      };
      await userApi.updateUser({ user });
      // Update in-memory session so avatar/header and posts refresh immediately
      updateSession?.({
        displayName: trimmedName,
        profilePic: formData.profilePic ?? session?.profilePic ?? null,
        bio: formData.bio ?? null,
      });
      return true;
    } catch (error) {
      console.error("Error updating profile:", error);
      return false;
    }
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const pickImage = async () => {
    setShowAvatarCarousel(!showAvatarCarousel);
  };

  const selectAvatar = (avatarUrl: string) => {
    setFormData((prev) => ({ ...prev, profilePic: avatarUrl }));
    setShowAvatarCarousel(false);
  };

  const uploadImageToStorage = async (localUri: string) => {
    const storage = getStorage();
    const filename = `/app-images/avatars/custom/${session?.uid ?? "anon"}_${Date.now()}.jpg`;
    const storageRef = ref(storage, filename);
    const resp = await fetch(localUri);
    const blob = await resp.blob();
    await uploadBytes(storageRef, blob);
    const url = await getDownloadURL(storageRef);
    return url;
  };

  const uploadCustomAvatar = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.9,
      });
      if (!result.canceled && result.assets?.length) {
        const uri = result.assets[0].uri;
        const downloadUrl = await uploadImageToStorage(uri);
        setFormData((prev) => ({ ...prev, profilePic: downloadUrl }));
        setShowAvatarCarousel(false);
      }
    } catch (e) {
      console.error("Error picking custom avatar:", e);
    }
  };

  return (
    <Box className="">
<Heading size="xl" className="mb-6 text-white">
        Edit Profile
      </Heading>

      {/* Profile Picture Section */}
      <TouchableOpacity onPress={pickImage} className="mb-6 self-center">
        <View className="relative rounded-full overflow-hidden">
          <Avatar size="2xl" className="border-2 border-black rounded-full">
            <AvatarFallbackText>{formData?.username}</AvatarFallbackText>
            <AvatarImage
              key={formData?.profilePic}
              source={{
                uri: formData?.profilePic,
              }}
            />
          </Avatar>
          {/* Bottom banner overlay to indicate change action */}
          <View className="absolute bottom-0 left-0 right-0 bg-black/60 py-2 rounded-b-full items-center">
            <Text size="sm" className="text-white font-semibold">Change</Text>
          </View>
        </View>
      </TouchableOpacity>

      {showAvatarCarousel && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <View className="flex-row space-x-4">
            {/* Custom upload option as first circle */}
            <TouchableOpacity onPress={uploadCustomAvatar} className="p-1">
              <Avatar size="xl" className="bg-gray-200 border border-gray-300">
                <Ionicons name="cloud-upload-outline" size={28} color="#111827" />
              </Avatar>
            </TouchableOpacity>
            {avatars.map((avatar, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => selectAvatar(avatar)}
                className={`p-1 ${
                  formData.profilePic === avatar
                    ? "border-2 border-green-500 rounded-full"
                    : ""
                }`}
              >
                <Avatar size="xl">
                  <AvatarImage source={{ uri: avatar }} />
                </Avatar>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      )}

      <VStack space="xl">
        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">
                Username
              </FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                className="text-typography-black"
                type="text"
                placeholder="Username"
                value={formData.username}
                onChangeText={(text) => updateField("username", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Bio</FormControlLabelText>
            </FormControlLabel>
<Textarea className="bg-white">
              <TextareaInput
                placeholder="Tell us about yourself"
                value={formData.bio}
                onChangeText={(text) => updateField("bio", text)}
              />
            </Textarea>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Industry</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Industry"
                value={formData.industry}
                onChangeText={(text) => updateField("industry", text)}
              />
            </Input>
          </FormControl>
        </VStack>

<View className="mt-4 flex-row items-center justify-between">
          <Heading size="md" className="text-white">Social Links</Heading>
          <TouchableOpacity onPress={() => setShowSocialLinks((prev) => !prev)}>
            <Ionicons
              name={showSocialLinks ? "chevron-down" : "chevron-up"}
              size={22}
              color="white"
            />
          </TouchableOpacity>
        </View>

        {showSocialLinks && (
          <>
        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Facebook</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Facebook profile URL"
                value={formData.facebook}
                onChangeText={(text) => updateField("facebook", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Twitter</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Twitter profile URL"
                value={formData.twitter}
                onChangeText={(text) => updateField("twitter", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Instagram</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Instagram profile URL"
                value={formData.instagram}
                onChangeText={(text) => updateField("instagram", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">LinkedIn</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="LinkedIn profile URL"
                value={formData.linkedin}
                onChangeText={(text) => updateField("linkedin", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">TikTok</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="TikTok profile URL"
                value={formData.tiktok}
                onChangeText={(text) => updateField("tiktok", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">YouTube</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="YouTube channel URL"
                value={formData.youtube}
                onChangeText={(text) => updateField("youtube", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Twitch</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Twitch profile URL"
                value={formData.twitch}
                onChangeText={(text) => updateField("twitch", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Snapchat</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Snapchat profile URL"
                value={formData.snapchat}
                onChangeText={(text) => updateField("snapchat", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Discord</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Discord profile URL"
                value={formData.discord}
                onChangeText={(text) => updateField("discord", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Medium</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Medium profile URL"
                value={formData.medium}
                onChangeText={(text) => updateField("medium", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Website</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Primary website URL"
                value={formData.website}
                onChangeText={(text) => updateField("website", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Website 2</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Secondary website URL"
                value={formData.website2}
                onChangeText={(text) => updateField("website2", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
<FormControlLabelText className="text-white">Website 3</FormControlLabelText>
            </FormControlLabel>
<Input className="my-1 w-full bg-white" size="sm">
              <InputField
                type="text"
                placeholder="Tertiary website URL"
                value={formData.website3}
                onChangeText={(text) => updateField("website3", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        </>
        )}
        
        <Button
className={`bg-white rounded-lg ${showSocialLinks ? "mt-4" : "mt-16"}`}
          onPress={async () => {
            const ok = await handleSubmit();
            if (ok) router.back();
          }}
        >
<ButtonText className="text-center text-black font-semibold">
            Save Changes
          </ButtonText>
        </Button>
        {/* Filler space to push content and ensure background fills to tab bar when links are hidden */}
        {!showSocialLinks && <View className="h-24" />}
      </VStack>
      <NotifyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
}
