import Linking from "expo-linking";
import { Box } from "../ui/box";
import { Text } from "../ui/text";
import { TouchableOpacity } from "react-native";
import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { VStack } from "../ui/vstack";

interface ContactIconProps
  extends Omit<React.ComponentPropsWithoutRef<typeof Box>, "title"> {
  icon: string;
  title: React.ReactNode;
  description: React.ReactNode;
  url: string;
}

function ContactIcon({ icon, title, description, url }: ContactIconProps) {
  return (
    <TouchableOpacity
      onPress={() => Linking.openURL(url)}
      className="flex flex-row items-center mb-4"
    >
      <Box className="mr-4">
        <FontAwesome5
          name={icon as React.ComponentProps<typeof FontAwesome>["name"]}
          size={16}
          color={"white"}
          style={{ marginRight: 4 }}
        />
      </Box>

      <Box>
        <Text size="xs" className="text-white">
          {title}
        </Text>
        <Text bold className="text-white">
          {description}
        </Text>
      </Box>
    </TouchableOpacity>
  );
}

const MOCKDATA = [
  {
    title: "Email",
    description: "support@chachingsocial.io",
    icon: "envelope",
    url: "mailto:support@chachingsocial.io",
  },
  {
    title: "TikTok",
    description: "@chachingsocial",
    icon: "tiktok",
    url: "https://www.tiktok.com/@chachingsocial",
  },
  {
    title: "LinkedIn",
    description: "ChaChing Social",
    icon: "linkedin",
    url: "https://www.linkedin.com/company/chachingsocial",
  },
];

export function ContactIconsList() {
  const items = MOCKDATA.map((item, index) => (
    <ContactIcon key={index} {...item} />
  ));
  return <VStack>{items}</VStack>;
}
