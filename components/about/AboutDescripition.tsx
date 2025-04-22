import TypeWriter from "@/components/TypeWriter";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Image, Text } from "react-native";

export default function AboutDescription() {
  return (
    <Box>
      <TypeWriter
        textArray={["Let's Talk Money ..."]}
        loop
        speed={150}
        delay={50}
        textStyle="text-4xl text-purple-600 font-bold bg-clip-text text-center mb-8"
        cursorStyle="text-4xl text-green-600"
      />

      <Box className="flex justify-between items-center">
        <Image
          source={require("@/assets/images/group-image.png")}
          alt="ChaChing Social About Image"
          className="w-full h-60 mb-8"
          resizeMode="contain"
        />

        <VStack space="md" className="w-full md:w-1/2 text-left">
          <Text className="text-2xl font-extrabold text-gray-500 italic">
            We&#39;re breaking the social taboo and addressing the elephant in
            the room: money. It shapes our lives, influences our decisions, and
            defines opportunities.
          </Text>

          <Text className="text-2xl text-green-900">
            <Text>ChaChing Social</Text> fosters conversations about personal
            finance. Share your wins and lessons with a like-minded community,
            learn from real-life experiences, and take control of your financial
            future. A thriving community means financial freedom for all.
          </Text>
        </VStack>
      </Box>
    </Box>
  );
}
