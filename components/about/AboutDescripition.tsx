import TypeWriter from "@/components/TypeWriter";
import { Box } from "@/components/ui/box";
import { VStack } from "@/components/ui/vstack";
import { Image, Text } from "react-native";
import { Table } from "@/components/ui/table";

export default function AboutDescription() {
  return (
    <Box>
      <TypeWriter
        textArray={["Consume, Connect, Create"]}
        loop
        speed={150}
        delay={50}
        textStyle="text-4xl text-white font-bold bg-clip-text text-center mb-8"
        cursorStyle="text-4xl text-green-600"
      />

      <Box className="flex justify-between items-center">
        {/*<Image*/}
        {/*  source={require("@/assets/images/group-image.png")}*/}
        {/*  alt="ChaChing Social About Image"*/}
        {/*  className="w-full h-60 mb-8"*/}
        {/*  resizeMode="contain"*/}
        {/*/>*/}

        <VStack space="md" className="w-full md:w-1/2 text-left">
          <Text className="text-2xl font-extrabold text-white italic">
              The social network that helps you invest in yourself using the digital & IRL world

              ChaChing Social helps you grow financially, socially, and emotionally by delivering you educational content you can consume 📚, fostering communities you can connect 🧑🧑 with, and providing you the tools to create ✍️ content.
          </Text>
            <Box className="bg-white rounded-lg shadow-md p-6">
                <VStack space="lg">
                    <Text className="text-3xl font-bold text-purple-950">
                        How are we improving our world 🌎?
                    </Text>
                    <Text className="text-xl text-gray-800">
                        We have more social tech but feel less connected
                    </Text>

                    <Box className="border border-gray-200 rounded-lg overflow-hidden">
                        {/* Row 1 */}
                        <Box className="flex-row border-b border-gray-200 bg-[#a3e4d2]">
                            <Box className="flex-1 p-4 border-r border-gray-200">
                                <Text className="text-base">
                                    <Text className="font-bold">1.</Text> Building community is taxing
                                </Text>
                            </Box>
                            <Box className="flex-1 p-4">
                                <Text className="text-base">
                                    <Text className="text-green-600">✓</Text> Give creators ownership and monetary incentives to sustain the communities they build
                                </Text>
                            </Box>
                        </Box>

                        {/* Row 2 */}
                        <Box className="flex-row border-b border-gray-200">
                            <Box className="flex-1 p-4 border-r border-gray-200">
                                <Text className="text-base">
                                    <Text className="font-bold">2.</Text> Traditional platforms foster "networking" not "friendships"
                                </Text>
                            </Box>
                            <Box className="flex-1 p-4">
                                <Text className="text-base">
                                    <Text className="text-green-600">✓</Text> Bridge IRL and digital interactions
                                </Text>
                            </Box>
                        </Box>

                        {/* Row 3 */}
                        <Box className="flex-row bg-[#a3e4d2]">
                            <Box className="flex-1 p-4 border-r border-gray-200">
                                <Text className="text-base">
                                    <Text className="font-bold">3.</Text> Lack of access to proper tools
                                </Text>
                            </Box>
                            <Box className="flex-1 p-4">
                                <Text className="text-base">
                                    <Text className="text-green-600">✓</Text> Create hyper-localized and specific communities
                                </Text>
                            </Box>
                        </Box>
                    </Box>
                </VStack>
            </Box>

        </VStack>
      </Box>
    </Box>
  );
}
