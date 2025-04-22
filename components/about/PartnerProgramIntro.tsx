import { Image, TouchableOpacity } from "react-native";
import TypeWriter from "../TypeWriter";
import { Box } from "../ui/box";
import { Heading } from "../ui/heading";
import { Text } from "../ui/text";
import Linking from "expo-linking";
import { FlatList } from "react-native";
import { View } from "react-native";

const data = [
  {
    id: "1",
    emoji: "📌",
    text: "Centralize all your social content in one place.",
  },
  {
    id: "2",
    emoji: "💸",
    text: "Earn revenue with paid subscriptions and digital products.",
  },
  {
    id: "3",
    emoji: "💬",
    text: "Grow & engage your following with community discussions.",
  },
  {
    id: "4",
    emoji: "🤝",
    text: "Join an exclusive network of trusted finfluencers.",
  },
  {
    id: "5",
    emoji: "📊",
    text: "Access powerful financial tools to deliver impactful content.",
  },
];

const renderItem = ({
  item,
}: {
  item: { id: string; emoji: string; text: string };
}) => (
  <View className="flex-row items-start mb-4">
    <Text className="text-xl mr-2">{item.emoji}</Text>
    <Text className="text-base flex-1">
      <Text className="font-extrabold">{item.text.split(" ")[0]}</Text>{" "}
      {item.text.split(" ").slice(1).join(" ")}
    </Text>
  </View>
);

export function PartnerProgramIntro() {
  return (
    <Box className=" bg-gradient-to-b from-white to-gray-100 rounded-lg mt-12">
      <Heading size="2xl" className="mb-4 text-center">
        🚀 Partner Creator Program
      </Heading>
      <TypeWriter
        textArray={[
          "Join our exclusive network of trusted finfluencers and monetize your content!",
        ]}
        loop={false}
        speed={100}
        delay={50}
        textStyle="text-2xl text-purple-600 font-bold bg-clip-text text-center mb-8"
        cursorStyle="text-2xl text-green-600"
      />

      <Box className="">
        <Heading className="text-lg font-bold">What?</Heading>
        <Text size="lg">
          All partners have an option to{" "}
          <Text highlight size="lg">
            monetize
          </Text>{" "}
          their content through <Text highlight>subscriptions</Text>, selling{" "}
          <Text highlight size="lg">
            products
          </Text>{" "}
          (i.e.notion pages, templates, books, etc.), and{" "}
          <Text highlight size="lg">
            event access
          </Text>{" "}
          (i.e. live-streams, webinars, IRL), get to own their own{" "}
          <Text highlight size="lg">
            {" "}
            community forums.
          </Text>
        </Text>
        <Heading size="2xl" className="text-lg font-bold mt-6">
          Why?
        </Heading>
        <Text size="lg">
          The finance space is crowded with information, making it hard to find
          credible voices. That’s why we’re building a vetted community of
          financial influencers—finfluencers. We can guarantee quality content
          because{" "}
          <Text highlight size="lg">
            our partners are financially incentivized
          </Text>
          , and want to build content that&#39;s engaging to their audience.{" "}
          <Text highlight size="lg">
            Content creators are the blood and sweat of social media, and
            deserve to win when social media platforms win.
          </Text>
        </Text>

        <Heading size="2xl" className="text-lg font-bold mt-6">
          🎯 Who?
        </Heading>
        <Text size="lg">
          We’re looking for financial influencers who are passionate about{" "}
          <Text highlight size="lg">
            democratizing financial literacy
          </Text>{" "}
          and want to{" "}
          <Text highlight size="lg">
            bust open the gate of finance know-hows
          </Text>
          . If you’re a content creator, financial advisor, or educator, we want
          you!
        </Text>
        <Heading size="2xl" className="font-bold mt-6">
          🔥 Perks of Joining
        </Heading>

        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          className="mt-4"
          scrollEnabled={false}
        />

        <Heading size="xl" className="font-semibold mt-6 mb-2">
          ❓ Questions?
        </Heading>
        <Text size="lg">
          📩 Contact us at:
          <TouchableOpacity
            onPress={() =>
              Linking.openURL("mailto:partnerprogram@chachingsocial.io")
            }
          >
            <Text className="text-blue-500 underline">
              partnerprogram@chachingsocial.io
            </Text>
          </TouchableOpacity>
        </Text>

        <TouchableOpacity
          className="bg-[#00bf63] rounded-lg p-2 my-4"
          onPress={() =>
            Linking.openURL("https://form.jotform.com/243044897447164")
          }
        >
          <Text className="text-white text-center" bold>
            🚀 Apply Now
          </Text>
        </TouchableOpacity>
      </Box>
    </Box>
  );
}
