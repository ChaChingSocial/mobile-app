import { SingleBlog } from "@/components/blog/SingleBlog";
import { useLocalSearchParams } from "expo-router";

export default function SingleBlogPage() {
  const { slug } = useLocalSearchParams();

  return <SingleBlog slug={slug as string} />;
}
