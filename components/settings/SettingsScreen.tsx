import { useEffect, useState } from "react";
import { Box } from "@/components/ui/box";
import { Text } from "@/components/ui/text";
import { Switch } from "@/components/ui/switch";
import { Button, ButtonText } from "@/components/ui/button";
import { HStack } from "@/components/ui/hstack";
import { VStack } from "@/components/ui/vstack";
import { useSession } from "@/lib/providers/AuthContext";
import { useBlockedUsers } from "@/lib/providers/BlockedUsersContext";
import { fetchUserSettings, saveUserSettings } from "@/lib/api/user";
import { Feather, FontAwesome5, MaterialIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { TouchableOpacity } from "react-native";

const defaultSettings = {
  community: true,
  events: true,
  updates: true,
  shareEmail: true,
  targetAds: true,
};

const data = [
  {
    id: "community",
    title: (
      <Text size="lg" className="font-semibold flex items-center">
        <FontAwesome5 name="users" size={18} color="black" />
        <Text className="text-typography-black"> Community Notifications</Text>
      </Text>
    ),
    description:
      "Digest of community activity including comments, likes, follows, and community invites.",
  },
  {
    id: "events",
    title: (
      <Text size="lg" className="font-semibold flex items-center">
        <FontAwesome5 name="calendar-alt" size={18} color="black" />
        <Text className="text-typography-black">  Event Notifications</Text>
      </Text>
    ),
    description:
      "Event confirmations, reminders, updates, and thank you messages.",
  },
  {
    id: "updates",
    title: (
      <Text size="lg" className="font-semibold flex items-center">
        <MaterialIcons name="refresh" size={18} color="black" />
        <Text className="text-typography-black">  Product Updates</Text>
      </Text>
    ),
    description: "Important updates about app features, terms, and conditions.",
  },
  {
    id: "shareEmail",
    title: (
      <Text
        size="lg"
        className="font-semibold flex items-center gap-2 justify-center"
      >
        <Feather name="mail" size={18} color="black" className="mr-2" />
        <Text className="text-typography-black">  Share Email</Text>
      </Text>
    ),
    description:
      "Share your email with community owners to receive important notifications.",
  },
  {
    id: "targetAds",
    title: (
      <Text size="lg" className="font-semibold">
        <Feather name="target" size={18} color="black" className="m-4" />
        <Text className="text-typography-black">  Targeted Advertising</Text>
      </Text>
    ),
    description:
      "Enable or disable targeted advertisements based on your activity.",
  },
];

export function SettingsComponent() {
  const { session } = useSession();
  const { blockedUsers } = useBlockedUsers();
  const router = useRouter();
  const userId = session?.uid;

  const [settings, setSettings] = useState<{ [key: string]: boolean } | null>(
    null
  );

  useEffect(() => {
    const fetchOrInitializeSettings = async () => {
      try {
        if (userId) {
          const userSettings = await fetchUserSettings(userId);

          if (Object.keys(userSettings).length === 0) {
            await saveUserSettings(userId, defaultSettings);
            setSettings(defaultSettings);
          } else {
            setSettings(userSettings);
          }
        } else {
          // If no userId yet, set default settings to avoid infinite loading
          setSettings(defaultSettings);
        }
      } catch (error) {
        console.error("Error loading user settings:", error);
        setSettings(defaultSettings);
      }
    };

    fetchOrInitializeSettings();
  }, [userId]);

  const handleSwitchChange = async (id: string, value: boolean) => {
    if (!settings) return;

    const updatedSettings = { ...settings, [id]: value };
    setSettings(updatedSettings);

    if (userId) {
      try {
        await saveUserSettings(userId, updatedSettings);
      } catch (error) {
        console.error("Error saving settings:", error);
      }
    }
  };

  return (
    <VStack space="lg" className="text-white">
      <Box>
        <Text size="2xl" className="font-extrabold text-typography-black">
          Configure Account Settings
        </Text>
        <Text size="lg" className="mt-1 mb-6 text-gray-600">
          Manage your preferences for emails and other notifications
        </Text>
      </Box>

      {/* Privacy & Safety Section */}
      <Box className="mb-6">
        <Text size="xl" className="font-bold text-typography-black mb-4">
          Privacy & Safety
        </Text>
        <TouchableOpacity
          onPress={() => router.push("/(protected)/blocked-users")}
          className="bg-white rounded-lg p-4 shadow-sm border border-gray-200"
        >
          <HStack space="md" className="items-center justify-between">
            <HStack space="md" className="items-center flex-1">
              <Box className="bg-red-100 p-2 rounded-full">
                <FontAwesome5 name="ban" size={20} color="#dc2626" />
              </Box>
              <VStack className="flex-1">
                <Text size="lg" className="font-semibold text-typography-black">
                  Blocked Users
                </Text>
                <Text size="sm" className="text-gray-600">
                  {blockedUsers.length} {blockedUsers.length === 1 ? "user" : "users"} blocked
                </Text>
              </VStack>
            </HStack>
            <FontAwesome5 name="chevron-right" size={16} color="#9ca3af" />
          </HStack>
        </TouchableOpacity>
      </Box>

      {/* Notification Settings */}
      <Box>
        <Text size="xl" className="font-bold text-typography-black mb-4">
          Notification Preferences
        </Text>
      </Box>
      {data.map((item) => (
        <Box
          key={item.id}
          className="flex flex-row justify-between text-wrap mb-4"
        >
          <Box className="max-w-[80%]">
            {item?.title}

            <Text size="sm" className="text-gray-600">
              {item.description}
            </Text>
          </Box>
          <Switch
            value={settings ? settings[item.id] : true}
            onToggle={(e) =>
              handleSwitchChange(item.id, e)
            }
            size="lg"
            trackColor={{
              false: "#767577",
              true: "#00bf63",
            }}
            thumbColor={"#fff"}
            ios_backgroundColor={"#3e3e3e"}
          />
        </Box>
      ))}
    </VStack>
  );
}
