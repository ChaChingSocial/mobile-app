import { HStack } from "@/components/ui/hstack";
import { Text } from "@/components/ui/text";
import { blogApi } from "@/config/backend";
import { checkIfFinFluencer } from "@/lib/api/user";
import { useSession } from "@/lib/providers/AuthContext";
import { Blog } from "@/types/blog";
import { useEffect, useState } from "react";
import { TouchableOpacity } from "react-native";
import { BlogArticleCard } from "./BlogCard";
import { Input, InputField, InputIcon, InputSlot } from "@/components/ui/input";
import { SearchIcon } from "@/components/ui/icon";
import { Ionicons } from "@expo/vector-icons";
import { Box } from "@/components/ui/box";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Center } from "@/components/ui/center";
import { Spinner } from "@/components/ui/spinner";
import { Fab, FabIcon } from "@/components/ui/fab";
import { BlogDetailModal } from "./BlogDetailModal";
import {Colors} from "@/lib/constants/Colors";

export default function BlogListing() {
  const { session: user } = useSession();

  const [allPublishedBlogs, setAllPublishedBlogs] = useState<Blog[]>([]);
  const [filteredBlogs, setFilteredBlogs] = useState<Blog[]>([]);
  const [, setIsFinfluencer] = useState(false);
  const [showSearchBox, setShowSearchBox] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [timeoutToClear, setTimeoutToClear] = useState<ReturnType<typeof setTimeout>>();
  const [loading, setLoading] = useState(true);
  const [selectedBlog, setSelectedBlog] = useState<Blog | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

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
    setLoading(true);
    try {
      const blogs = await blogApi.getPublishedBlogs();
      if (blogs) {
        setAllPublishedBlogs(blogs as any);
        setFilteredBlogs(blogs as any);
      }
    } finally {
      setLoading(false);
    }
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

  const applyFilters = (text: string, tag: string | null, blogs: Blog[] = allPublishedBlogs) => {
    const normalizedText = text.trim().toLowerCase();
    const normalizedTag = tag?.trim().toLowerCase() || null;

    const filtered = blogs.filter((blog) => {
      const matchesSearch =
        normalizedText.length === 0 ||
        blog.title.toLowerCase().includes(normalizedText) ||
        blog.subtitle?.toLowerCase().includes(normalizedText) ||
        blog.content.toLowerCase().includes(normalizedText) ||
        blog.tags?.some((blogTag) => blogTag.toLowerCase().includes(normalizedText));

      const matchesTag =
        !normalizedTag ||
        blog.tags?.some((blogTag) => blogTag.toLowerCase() === normalizedTag);

      return matchesSearch && matchesTag;
    });

    setFilteredBlogs(filtered);
  };

  const setSearchTextAlways = (text: string) => {
    setSearchText(text);
  };

  const filterBlogs = (text: string) => {
    applyFilters(text, selectedTag);
  };

  const debouncedFilterBlogs = debounce(
    filterBlogs,
    setSearchTextAlways,
    300
  );

  const handleBlogSelect = (blog: Blog) => {
    setSelectedBlog(blog);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedBlog(null);
  };

  const handleTagPress = (tag: string) => {
    const nextTag = selectedTag?.toLowerCase() === tag.toLowerCase() ? null : tag;
    setSelectedTag(nextTag);
    applyFilters(searchText, nextTag);
  };

  const clearTagFilter = () => {
    setSelectedTag(null);
    applyFilters(searchText, null);
  };

  return (
    <Box className="flex-1" style={{backgroundColor: Colors.dark.tint}}>
      {/* Floating search box - Sticky to top */}
      {showSearchBox && (
        <Box className="absolute top-0 left-0 right-0 z-50 pt-2 pb-2">
          <Box className="mx-4 bg-white rounded-lg shadow-lg p-2">
            <HStack className="items-center gap-2">
              <TouchableOpacity
                onPress={() => {
                  setShowSearchBox(false);
                  setSearchText("");
                  applyFilters("", selectedTag);
                }}
              >
                <Ionicons name="close" size={24} color="black" />
              </TouchableOpacity>
              <Input size="md" className="flex-1">
                <InputSlot className="pl-3">
                  <InputIcon as={SearchIcon} size="lg" />
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
          <FabIcon as={Ionicons} name="search-outline" size="lg" className="text-black" />
        </Fab>
      )}

      <ParallaxScrollView classNames="flex-1">
        <Box className="flex-1">
          {loading ? (
            <Center className="flex-1">
              <Spinner color={Colors.light.tint} size="large" />
            </Center>
          ) : (
            <Box className="gap-5 flex p-4 mt-16 mb-24">
              {filteredBlogs.length === 0 && allPublishedBlogs.length === 0 ? (
                <Text>No blogs available right now.</Text>
              ) : filteredBlogs.length === 0 ? (
                <Text>
                  {selectedTag
                    ? `No blogs found for #${selectedTag}${searchText ? " with this search." : "."}`
                    : "No blogs found matching your search."}
                </Text>
              ) : (
                filteredBlogs.map((blog, idx) => (
                  <BlogArticleCard
                    key={idx}
                    blog={blog}
                    onPress={() => handleBlogSelect(blog)}
                    onTagPress={handleTagPress}
                  />
                ))
              )}
            </Box>
          )}
        </Box>
      </ParallaxScrollView>

      {/* Blog Detail Modal */}
      <BlogDetailModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        blog={selectedBlog}
      />

      {selectedTag && (
        <Box className="absolute top-14 left-0 right-0 z-40 px-4">
          <Box className="self-start relative">
            <Box className="rounded-full bg-emerald-100 px-3 py-1 pr-7">
              <Text className="text-emerald-900 text-xs">{selectedTag}</Text>
            </Box>

            <TouchableOpacity
              onPress={clearTagFilter}
              className="absolute -top-1 -right-1 h-5 w-5 items-center justify-center rounded-full bg-red-500"
            >
              <Ionicons name="close" size={12} color="white"/>
            </TouchableOpacity>
          </Box>
        </Box>
      )}
    </Box>
  );
}
