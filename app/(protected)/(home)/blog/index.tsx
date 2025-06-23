import BlogListing from "@/components/blog/BlogListing";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";

export default function BlogScreen() {
  return (
    <ParallaxScrollView>
      <Box className="bg-[#E6F8F1] flex-1">
        <BlogListing />
      </Box>
    </ParallaxScrollView>
  );
}
