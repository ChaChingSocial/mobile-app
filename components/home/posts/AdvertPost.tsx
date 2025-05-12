import { Button } from "@/components/ui/button";
import { updatePostAdvert } from "@/lib/api/newsfeed";
import { convertFirestoreTimestampToDate } from "@/lib/utils/dates";
import { Post as PostType } from "@/types/post";
import { Timestamp } from "firebase/firestore";
import { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  TextInput,
  TouchableOpacity,
} from "react-native";
import PostTags from "../post-editor/PostTag";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import { Checkbox } from "@/components/ui/checkbox";
import { Text } from "@/components/ui/text";
import { Box } from "@/components/ui/box";

export function AdvertPost({
  post,
  editing,
  onEditingChange,
}: {
  post: PostType;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  if (!post.advert) {
    throw new Error("Advert post does not have an advert");
  }

  const firebaseEndTimeDate = new Timestamp(
    post.advert.endTimeDate.seconds,
    post.advert.endTimeDate.nanoseconds
  );
  const firebaseStartTimeDate = new Timestamp(
    post.advert.startTimeDate.seconds,
    post.advert.startTimeDate.nanoseconds
  );

  const [editedContent, setEditedContent] = useState(post.post ?? "");
  const [editedLink, setEditedLink] = useState(post.advert.link ?? "");
  const [editedTitle, setEditedTitle] = useState(post.advert.title ?? "");
  const [editedDescription, setEditedDescription] = useState(
    post.advert.description ?? ""
  );
  const [editedStartTimeDate, setEditedStartTimeDate] = useState<Date>(
    convertFirestoreTimestampToDate(firebaseStartTimeDate) ?? new Date()
  );
  const [editedEndTimeDate, setEditedEndTimeDate] = useState<Date>(
    convertFirestoreTimestampToDate(firebaseEndTimeDate) ?? new Date()
  );
  const [editedPricePerClick, setEditedPricePerClick] = useState<number>(
    post.advert.pricePerClick ?? 0
  );
  const [editedCommentable, setEditedCommentable] = useState(
    post.advert.commentable ?? false
  );
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState(false);

  const handleSave = () => {
    if (!post.id) {
      throw new Error("Post ID is missing");
    }

    updatePostAdvert({
      postId: post.id,
      editedTitle,
      editedDescription,
      editedContent,
      editedLink,
      editedStartTimeDate,
      editedEndTimeDate,
      editedPricePerClick,
      editedCommentable,
    }).then(() => {
      onEditingChange(false);
      post.post = editedContent;

      if (post.advert) {
        post.advert.content = editedContent;
        post.advert.link = editedLink;
        post.advert.title = editedTitle;
        post.advert.description = editedDescription;
        post.advert.startTimeDate = editedStartTimeDate;
        post.advert.endTimeDate = editedEndTimeDate;
        post.advert.pricePerClick = editedPricePerClick;
        post.advert.commentable = editedCommentable;
      }
    });
  };

  const handleCancel = () => {
    setEditedContent(post.post ?? "");
    if (post.advert) {
      setEditedLink(post.advert.link ?? "");
      setEditedTitle(post.advert.title ?? "");
      setEditedDescription(post.advert.description ?? "");
      setEditedStartTimeDate(
        convertFirestoreTimestampToDate(firebaseStartTimeDate) ?? new Date()
      );
      setEditedEndTimeDate(
        convertFirestoreTimestampToDate(firebaseEndTimeDate) ?? new Date()
      );
      setEditedPricePerClick(post.advert.pricePerClick ?? 0);
      setEditedCommentable(post.advert.commentable ?? false);
    }
    onEditingChange(false);
  };

  const navigateToLink = () => {
    if (!post.advert?.link) {
      throw new Error("Advert link is missing");
    }

    Linking.openURL(post.advert.link);
  };

  return (
    <Box className="bg-white p-4 rounded-lg">
      {editing ? (
        <ScrollView>
          <TextInput
            className="border border-gray-300 p-2 rounded mb-2"
            multiline
            value={editedContent}
            onChangeText={setEditedContent}
            placeholder="Post content"
          />

          <TextInput
            className="border border-gray-300 p-2 rounded mb-2"
            value={editedTitle}
            onChangeText={setEditedTitle}
            placeholder="Title"
          />

          <TextInput
            className="border border-gray-300 p-2 rounded mb-2 h-24"
            multiline
            value={editedDescription}
            onChangeText={setEditedDescription}
            placeholder="Description"
          />

          <TextInput
            className="border border-gray-300 p-2 rounded mb-2"
            value={editedLink}
            onChangeText={setEditedLink}
            placeholder="Link"
          />

          <TouchableOpacity
            className="border border-gray-300 p-2 rounded mb-2"
            onPress={() => setShowStartDatePicker(true)}
          >
            <Text>
              Start: {editedStartTimeDate.toLocaleDateString()}{" "}
              {editedStartTimeDate.toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
          {/* {showStartDatePicker && (
            <DateTimePicker
              value={editedStartTimeDate}
              mode="datetime"
              onChange={(event, date) => {
                setShowStartDatePicker(false);
                if (date) setEditedStartTimeDate(date);
              }}
            />
          )} */}

          <TouchableOpacity
            className="border border-gray-300 p-2 rounded mb-2"
            onPress={() => setShowEndDatePicker(true)}
          >
            <Text>
              End: {editedEndTimeDate.toLocaleDateString()}{" "}
              {editedEndTimeDate.toLocaleTimeString()}
            </Text>
          </TouchableOpacity>
          {/* {showEndDatePicker && (
            <DateTimePicker
              value={editedEndTimeDate}
              mode="datetime"
              onChange={(event, date) => {
                setShowEndDatePicker(false);
                if (date) setEditedEndTimeDate(date);
              }}
            />
          )} */}

          <TextInput
            className="border border-gray-300 p-2 rounded mb-2"
            value={editedPricePerClick.toString()}
            onChangeText={(text) => setEditedPricePerClick(Number(text))}
            placeholder="Price Per Click"
            keyboardType="numeric"
          />

          <Box className="flex-row items-center mb-4">
            <Checkbox
              value={String(editedCommentable)}
              onChange={setEditedCommentable}
              className="mr-2"
            />
            <Text>Enable Comments</Text>
          </Box>

          <Box className="flex-row justify-between">
            <Button onPress={handleSave} className="flex-1 mr-2">
              <Text className="text-white">Save</Text>
            </Button>
            <Button onPress={handleCancel} variant="outline" className="flex-1">
              <Text>Cancel</Text>
            </Button>
          </Box>
        </ScrollView>
      ) : (
        <>
          {post.post && <HtmlRenderText source={post.post} />}

          <TouchableOpacity
            onPress={navigateToLink}
            className="mt-4 flex-row items-center border border-gray-200 rounded-lg overflow-hidden"
          >
            {post.advert?.images?.length > 0 && (
              <Image
                source={{ uri: post.advert.images[0] }}
                className="w-24 h-24"
                resizeMode="cover"
              />
            )}

            <Box className="flex-1 p-3">
              <Text className="text-lg font-bold">{post.advert?.title}</Text>
              {post.advert?.description && (
                <Text className="text-gray-600 mt-1" numberOfLines={3}>
                  {post.advert.description.slice(0, 300)}...
                </Text>
              )}
            </Box>
          </TouchableOpacity>

          {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
        </>
      )}
    </Box>
  );
}
