import BlogListing from "@/components/blog/BlogListing";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";

export default function BlogScreen() {
  return (
    <ParallaxScrollView>
      <Box className="bg-[#077f5f] flex-1">
        <BlogListing />
      </Box>
    </ParallaxScrollView>
  );
}
