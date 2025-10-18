import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { blogApi } from "@/config/backend";
import { checkIfFinFluencer } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Blog } from "@/types/blog";
import { useEffect, useState } from "react";
import { Linking, TouchableOpacity } from "react-native";
import { Button, ButtonText } from "../ui/button";
import { BlogArticleCard } from "./BlogCard";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Fab, FabIcon, FabLabel } from "@/components/ui/fab";

export default function BlogListing() {
  const { session: user } = useSession();

  const [allPublishedBlogs, setAllPublishedBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [isFinfluencer, setIsFinfluencer] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
    if (user) {
      const fetchFinFluencerStatus = async () => {
        const isFinFluencer = await checkIfFinFluencer(user?.uid);
        setIsFinfluencer(isFinFluencer);
      };

      fetchFinFluencerStatus();
    }

    return () => {
      if (timeoutToClear) {
        clearTimeout(timeoutToClear);
      }
    };
  }, [user?.uid]);

  const fetchBlogs = async () => {
    const blogs = await blogApi.getPublishedBlogs();
    setLoading(true);

    if (blogs) {
      setAllPublishedBlogs(blogs as any);
      setFilteredBlogs(blogs as any);
    }
    setLoading(false);
  };

  const debounce = (
    callback: (text: string) => void,
    alwaysCall: (text: string) => void,
    delay: number
  ) => {
    return (text: string) => {
      alwaysCall(text);
      if (timeoutToClear) {
        clearTimeout(timeoutToClear);
      }
      setTimeoutToClear(
        setTimeout(() => {
          callback(text);
        }, delay)
      );
    };
  };

  const setSearchTextAlways = (text: string) => {
    setSearchText(text);
  };

  const filterBlogs = (text: string) => {
    if (text === "") {
      setFilteredBlogs(allPublishedBlogs);
      return;
    }

    const filtered = allPublishedBlogs.filter((blog: Blog) => {
      const matchesTitle = blog.title.toLowerCase().includes(text.toLowerCase());
      const matchesSubtitle = blog.subtitle?.toLowerCase().includes(text.toLowerCase());
      const matchesContent = blog.content.toLowerCase().includes(text.toLowerCase());
      const matchesTags = blog.tags?.some((tag) =>
        tag.toLowerCase().includes(text.toLowerCase())
      );

      return matchesTitle || matchesSubtitle || matchesContent || matchesTags;
    });

    setFilteredBlogs(filtered);
  };

  const debouncedFilterBlogs = debounce(
    filterBlogs,
    setSearchTextAlways,
    300
  );

  return (
    <Box className="flex-1 bg-[#077f5f]">
      {/* Floating search box - Sticky to top */}
      {showSearchBox && (
        <Box className="absolute top-0 left-0 right-0 z-50 bg-[#077f5f] pt-2 pb-2">
          <Box className="mx-4 bg-white rounded-lg shadow-lg p-2">
            <HStack className="items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setShowSearchBox(false);
                  setSearchText("");
                  setFilteredBlogs(allPublishedBlogs);
                }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Input size="md" className="flex-1">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} />
                </InputSlot>
                <InputField
                  placeholder="Search blogs..."
                  onChangeText={debouncedFilterBlogs}
                  value={searchText}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoFocus
                />
              </Input>
            </HStack>
          </Box>
        </Box>
      )}

      {/* FAB for search */}
      {!showSearchBox && (
        <Fab
          size="md"
          placement="top right"
          onPress={() => setShowSearchBox(true)}
          className="bg-white shadow-lg"
        >
          <FabIcon as={Ionicons} name="search-outline" size={24} className="text-black" />
        </Fab>
      )}

      {/* FAB for Write Blog */}
      <Fab
        size="lg"
        placement="bottom right"
        onPress={() => Linking.openURL("https://www.chaching.social/blog/write")}
        className="bg-[#40c057] shadow-lg"
      >
        <FabIcon as={Ionicons} name="create-outline" size={24} className="text-white" />
        <FabLabel className="text-white">✏️ Write</FabLabel>
      </Fab>

      <ParallaxScrollView classNames="flex-1">
        <Box className="bg-[#077f5f] flex-1">
          {loading && (
            <Center className="flex-1">
              <Spinner color="green" size="large" />
              <Text size="md">Please Wait...</Text>
            </Center>
          )}
          <Box className="gap-5 flex p-4  mt-16 mb-24">
            {filteredBlogs.length === 0 && allPublishedBlogs.length === 0 ? (
              <Text>Loading Posts...</Text>
            ) : filteredBlogs.length === 0 ? (
              <Text>No blogs found matching your search.</Text>
            ) : (
              filteredBlogs.map((blog, idx) => (
                <BlogArticleCard key={idx} blog={blog} />
              ))
            )}
          </Box>
        </Box>
      </ParallaxScrollView>
    </Box>
  );
}
