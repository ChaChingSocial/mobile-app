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
import { userApi } from "@/config/backend";
import { useLocalSearchParams } from "expo-router";
import { getDownloadURL, getStorage, listAll, ref } from "firebase/storage";
import { useEffect, useState } from "react";
import { ScrollView, TouchableOpacity, View } from "react-native";
import NotifyModal from "../NotifyModal";
import { Button, ButtonText } from "../ui/button";
import { useSession } from "@/lib/providers/AuthContext";

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
  const { session } = useSession();

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

  useEffect(() => {
    loadAvatars();
  }, []);

  const loadAvatars = async () => {
    try {
      const avatarUrls = await fetchAllAvatars();
      setAvatars(avatarUrls);
    } catch (error) {
      console.error("Error loading avatars:", error);
    }
  };

  const handleSubmit = async () => {
    try {
      const user = {
        id: userInfo?.id,
        username: formData.username,
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
    } catch (error) {
      console.error("Error updating profile:", error);
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

  return (
    <Box className="">
      <Heading size="xl" className="mb-6 text-typography-black">
        Edit Profile
      </Heading>

      {/* Profile Picture Section */}
      <TouchableOpacity onPress={pickImage} className="mb-6 self-center">
        <Avatar size="2xl" className="border-2 border-black rounded-full">
          <AvatarFallbackText>{formData?.username}</AvatarFallbackText>
          <AvatarImage
            key={formData?.profilePic}
            source={{
              uri: formData?.profilePic,
            }}
          />
        </Avatar>
      </TouchableOpacity>

      {showAvatarCarousel && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mb-4"
          contentContainerStyle={{ paddingHorizontal: 10 }}
        >
          <View className="flex-row space-x-4">
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
              <FormControlLabelText className="text-typography-black">
                Username
              </FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Bio</FormControlLabelText>
            </FormControlLabel>
            <Textarea className="">
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
              <FormControlLabelText>Industry</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
              <InputField
                type="text"
                placeholder="Industry"
                value={formData.industry}
                onChangeText={(text) => updateField("industry", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <Heading size="md" className="mt-4">
          Social Links
        </Heading>

        <VStack space="xs">
          <FormControl>
            <FormControlLabel>
              <FormControlLabelText>Facebook</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Twitter</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Instagram</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>LinkedIn</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>TikTok</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>YouTube</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Twitch</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Snapchat</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Discord</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Medium</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Website</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Website 2</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
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
              <FormControlLabelText>Website 3</FormControlLabelText>
            </FormControlLabel>
            <Input className="my-1 w-full" size="sm">
              <InputField
                type="text"
                placeholder="Tertiary website URL"
                value={formData.website3}
                onChangeText={(text) => updateField("website3", text)}
              />
            </Input>
          </FormControl>
        </VStack>

        <Button
          className="bg-[#077f5f] rounded-lg mt-4"
          onPress={() => setShowModal(true)}
        >
          <ButtonText className="text-center text-white font-semibold">
            Save Changes
          </ButtonText>
        </Button>
      </VStack>
      <NotifyModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        handleSubmit={handleSubmit}
      />
    </Box>
  );
}
