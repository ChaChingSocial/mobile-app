import BlogListing from "@/components/blog/BlogListing";
import ParallaxScrollView from "@/components/ParallaxScrollView";
import { Box } from "@/components/ui/box";
import {Colors} from "@/lib/constants/Colors";

export default function BlogScreen() {
  return (
      <Box className="flex-1" style={{backgroundColor: Colors.dark.tint}}>
        <BlogListing />
      </Box>
  );
}
