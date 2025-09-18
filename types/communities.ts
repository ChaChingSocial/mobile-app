export interface StoryAvatarListProps {
  stories: InstagramStoryProps[];
  loadingStory: StoryAvatarProps["loadingStory"];
  seenStories: StoryAvatarProps["seenStories"];
  colors: StoryAvatarProps["colors"];
  seenColors: StoryAvatarProps["seenColors"];
  showName: InstagramStoriesProps["showName"];
  nameTextStyle: InstagramStoriesProps["nameTextStyle"];
  nameTextProps: InstagramStoriesProps["nameTextProps"];
  avatarListContainerStyle: InstagramStoriesProps["avatarListContainerStyle"];
  avatarListContainerProps: InstagramStoriesProps["avatarListContainerProps"];
  onPress: (id: string) => void;
}

export interface InstagramStoryProps {
  id: string;
  name: string;
  imageUrl: string;
  stories: StoryAvatarProps[];
}

export interface StoryAvatarProps {
  id: string;
  avatarSource: { uri: string } | number;
  name: string;
  stories: { id: string }[];
  loadingStory: (string | null) & React.MutableRefObject<string | null>;
  seenStories: Record<string, string>;
  onPress: () => void;
  colors: string[];
  seenColors: string[];
  size: number;
  showName?: boolean;
  nameTextStyle?: object;
  nameTextProps?: object;
  renderAvatar?: (seen: boolean) => React.ReactNode;
  avatarBorderRadius?: number;
}