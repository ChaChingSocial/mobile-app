import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { VStack } from "@/components/ui/vstack";
import { blogApi } from "@/config/backend";
import { checkIfFinFluencer } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Blog } from "@/types/blog";
import { useEffect, useState } from "react";
import { Linking, ScrollView, View } from "react-native";
import { Button, ButtonText } from "../ui/button";
import { BlogArticleCard } from "./BlogCard";

export default function BlogListing() {
  const { session: user } = useSession();

  const [allPublishedBlogs, setAllPublishedBlogs] = useState<Blog[]>([]);
  const [isFinfluencer, setIsFinfluencer] = useState(false);

  useEffect(() => {
    fetchBlogs();
    if (user) {
      const fetchFinFluencerStatus = async () => {
        const isFinFluencer = await checkIfFinFluencer(user?.uid);
        setIsFinfluencer(isFinFluencer);
      };

      fetchFinFluencerStatus();
    }
  }, [user?.uid]);

  const fetchBlogs = async () => {
    const blogs = await blogApi.getPublishedBlogs();

    if (blogs) {
      setAllPublishedBlogs(blogs);
    }
  };

  return (
    <View className="flex-1 mt-10">
      {isFinfluencer && (
        <HStack className="justify-end mb-5 px-4">
          <Button
            onPress={() =>
              Linking.openURL("https://www.chaching.social/blog/write")
            }
            className="mr-2 bg-[#40c057]"
          >
            <ButtonText>✏️ Write Blog</ButtonText>
          </Button>
        </HStack>
      )}

      <ScrollView className="flex-1">
        <VStack space="md" className="p-4">
          {allPublishedBlogs.length === 0 ? (
            <Text>Loading Posts...</Text>
          ) : (
            allPublishedBlogs.map((blog, idx) => (
              <BlogArticleCard key={idx} blog={blog} />
            ))
          )}
        </VStack>
      </ScrollView>
    </View>
  );
}
