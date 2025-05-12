import { Badge, BadgeText } from "@/components/ui/badge";
import { HStack } from "@/components/ui/hstack";

export default function PostTags({ tags }: { tags: string[] }) {
  if (!tags || tags.length === 0) return null;
  return (
    <HStack className="flex-row flex-wrap mt-1 gap-2">
      {tags.map((tag: string, index: number) => (
        <Badge key={index} className="bg-primary-0 px-3 py-1 rounded-xl">
          <BadgeText className="text-white text-xs font-bold">{tag}</BadgeText>
        </Badge>
      ))}
    </HStack>
  );
}
