import { useEffect, useState } from "react";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { Switch } from "../ui/switch";

const defaultSettings = {
  newsletters: true,
  community: true,
  comments: true,
  targetAds: true,
  updates: true,
};

const data = [
  {
    id: "newsletters",
    title: "Newsletters",
    description:
      "Monthly analysis of your financials, information specific to your goals, badges, and comments on your post.",
  },
  {
    id: "community",
    title: "Community",
    description: "Weekly review of the communities you're part of.",
  },
  {
    id: "comments",
    title: "Comments",
    description: "Daily digest with comments and reactions to your posts.",
  },
  {
    id: "targetAds",
    title: "Targeted Advertising",
    description:
      "Enable or disable targeted advertisements based on your app activity and preferences.",
  },
  {
    id: "updates",
    title: "Updates & Changes",
    description:
      "Receive updates about terms, conditions, and features of the app.",
  },
];

export function SettingsComponent() {
  //   const userId = getCurrentUser()?.uid;
  const [settings, setSettings] = useState<{ [key: string]: boolean }>({
    community: true,
    updates: true,
    targetAds: true,
    newsletters: true,
    comments: true,
  });

  //   useEffect(() => {
  //     const fetchOrInitializeSettings = async () => {
  //       try {
  //         if (userId) {
  //           const userSettings = await fetchUserSettings(userId);

  //           if (Object.keys(userSettings).length === 0) {
  //             await saveUserSettings(userId, defaultSettings);
  //             setSettings(defaultSettings);
  //           } else {
  //             setSettings(userSettings);
  //           }
  //         }
  //       } catch (error) {
  //         console.error("Error loading user settings:", error);
  //       }
  //     };

  //     fetchOrInitializeSettings();
  //   }, [userId]);

  const handleSwitchChange = async (id: string, value: boolean) => {
    const updatedSettings = { ...settings, [id]: value };
    setSettings(updatedSettings);

    // if (userId) {
    try {
      // await saveUserSettings(userId, updatedSettings);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    // }
  };

  return (
    <Box className="p-8 rounded-md">
      <Text size="2xl" className="font-extrabold">
        Configure Account Settings
      </Text>
      <Text size="lg" className="mt-1 mb-6 text-gray-600">
        Manage your preferences for emails and other notifications
      </Text>
      {data.map((item) => (
        <Box key={item.id} className="flex flex-row justify-between text-wrap mb-4">
          <Box className="max-w-[80%]">
            <Text size="lg" className="font-semibold">
              {item.title}
            </Text>
            <Text size="xs" className="text-gray-600">
              {item.description}
            </Text>
          </Box>
          <Switch
            // checked={settings[item.id]}
            // onChange={(e) =>
            //   handleSwitchChange(item.id, e.currentTarget.checked)
            // }
            className=""
            size="lg"
            isDisabled={false}
            trackColor={{
              false: "#767577",
              true: "#00bf63",
            }}
            thumbColor={"#fff"}
            ios_backgroundColor={"#3e3e3e"}
          />
        </Box>
      ))}
    </Box>
  );
}
