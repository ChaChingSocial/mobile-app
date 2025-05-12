import { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Image,
  Linking,
} from "react-native";
import { FontAwesome5 } from "@expo/vector-icons";
import { Timestamp } from "firebase/firestore";
import dayjs from "dayjs";
import { Post as PostType } from "@/types/post";
import {
  checkUserRSVP,
  updateEventRSVP,
  updatePostEvent,
} from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import {
  Avatar,
  AvatarFallbackText,
  AvatarGroup,
  AvatarImage,
} from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
} from "@/components/ui/checkbox";
import { Badge, BadgeText } from "@/components/ui/badge";
import SelectComponent from "@/components/common/SelectInput";
import { CheckIcon } from "@/components/ui/icon";
import HtmlRenderText from "@/components/common/HtmlRenderText";
import PostTags from "../post-editor/PostTag";

interface EventPostProps {
  post: PostType;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}

export const EventPost = ({
  post,
  editing,
  onEditingChange,
}: EventPostProps) => {
  const { session: currentUser } = useSession();
  const userId = currentUser?.uid;

  const userData = {
    localId: userId,
    email: currentUser?.email,
    displayName: currentUser?.displayName,
    photoUrl: currentUser?.profilePic,
  };

  // Memoize firebase dates
  const firebaseStartTimeDate = useMemo(() => {
    return post.event?.startTimeDate
      ? new Timestamp(
          post.event.startTimeDate.seconds,
          post.event.startTimeDate.nanoseconds
        )
      : null;
  }, [post.event?.startTimeDate]);

  const firebaseEndTimeDate = useMemo(() => {
    return post.event?.endTimeDate
      ? new Timestamp(
          post.event.endTimeDate.seconds,
          post.event.endTimeDate.nanoseconds
        )
      : null;
  }, [post.event?.endTimeDate]);

  // State for edited event details
  const [editedStartTimeDate, setEditedStartTimeDate] = useState(
    firebaseStartTimeDate
      ? new Date(firebaseStartTimeDate.seconds * 1000)
      : new Date()
  );
  const [editedEndTimeDate, setEditedEndTimeDate] = useState(
    firebaseEndTimeDate
      ? new Date(firebaseEndTimeDate.seconds * 1000)
      : new Date()
  );
  const [editedTitle, setEditedTitle] = useState(post.event?.title || "");
  const [editedDescription, setEditedDescription] = useState(
    post.event?.description || ""
  );
  const [editedTimezone, setEditedTimezone] = useState(
    post.event?.timezone || "UTC"
  );
  const [editedPrice, setEditedPrice] = useState(post.event?.price || 0);
  const [editedPrivacy, setEditedPrivacy] = useState(
    post.event?.privacy || "PUBLIC"
  );
  const [editedEventType, setEditedEventType] = useState(
    post.event?.eventType || "LIVE_STREAM"
  );
  const [editedRecorded, setEditedRecorded] = useState<boolean>(
    post.event?.recorded || false
  );
  const [editedCommentsEnabled, setEditedCommentsEnabled] = useState<boolean>(
    post.event?.commentsEnabled || true
  );
  const [editedLinks, setEditedLinks] = useState({
    link1: post.event?.link1 || "",
    link2: post.event?.link2 || "",
    link3: post.event?.link3 || "",
  });
  const [editedLumaWidget, setEditedLumaWidget] = useState(
    post.event?.lumaWidget || ""
  );
  const [rsvpStatus, setRsvpStatus] = useState(false);

  // Format dates for display
  const formattedStartDate = dayjs(editedStartTimeDate).isValid()
    ? dayjs(editedStartTimeDate).format("YYYY-MM-DD")
    : "Invalid Date";
  const formattedEndDate = dayjs(editedEndTimeDate).isValid()
    ? dayjs(editedEndTimeDate).format("YYYY-MM-DD")
    : "Invalid Date";
  const formattedStartTime = dayjs(editedStartTimeDate).isValid()
    ? dayjs(editedStartTimeDate).format("HH:mm")
    : "Invalid Time";
  const formattedEndTime = dayjs(editedEndTimeDate).isValid()
    ? dayjs(editedEndTimeDate).format("HH:mm")
    : "Invalid Time";

  useEffect(() => {
    if (post.event?.startTimeDate) {
      setEditedStartTimeDate(new Date(post.event.startTimeDate.seconds * 1000));
    }
    if (post.event?.endTimeDate) {
      setEditedEndTimeDate(new Date(post.event.endTimeDate.seconds * 1000));
    }
  }, [post.event?.startTimeDate, post.event?.endTimeDate]);

  useEffect(() => {
    if (userId && post.id) {
      checkUserRSVP(post.id, userId).then((rsvp) => setRsvpStatus(rsvp));
    }
  }, [userId, post.id]);

  const handleSave = () => {
    if (post.id) {
      updatePostEvent({
        postId: post.id,
        editedTitle,
        editedDescription,
        editedStartTimeDate,
        editedEndTimeDate,
        editedTimezone,
        editedPrice,
        editedPrivacy,
        editedEventType,
        editedRecorded,
        editedCommentsEnabled,
        editedLinks,
        editedLumaWidget,
      }).then(() => onEditingChange(false));
    }
  };

  const handleCancel = () => onEditingChange(false);

  const handleRsvpToggle = async () => {
    setRsvpStatus((prev) => !prev);
    if (post?.id && userData.localId) {
      await updateEventRSVP(
        post.id,
        userData as {
          localId: string;
          email: string;
          displayName: string;
          photoUrl: string;
        }
      );
    } else {
      console.error("User ID is undefined. Cannot update RSVP.");
    }
  };

  const renderRsvpAvatars = () => {
    const rsvps = post.event?.rsvps || [];
    return (
      <View className="flex-row items-center -space-x-2">
        <AvatarGroup>
          {rsvps.slice(0, 3).map(
            (user, index) =>
              user && (
                <Avatar size="sm" key={index}>
                  <AvatarFallbackText>{user.displayName}</AvatarFallbackText>
                  <AvatarImage source={{ uri: user.photoUrl }} />
                </Avatar>
              )
          )}
          {rsvps.length > 3 && (
            <Avatar size="sm">
              <AvatarFallbackText>
                {"+ " + (rsvps.length - 3)}
              </AvatarFallbackText>
            </Avatar>
          )}
        </AvatarGroup>
      </View>
    );
  };

  const handleLinkPress = (url: string) => {
    Linking.openURL(url);
  };

  if (editing) {
    return (
      <ScrollView className="p-2">
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Title"
          value={editedTitle}
          onChangeText={setEditedTitle}
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white min-h-[100px] text-top"
          placeholder="Description"
          value={editedDescription}
          onChangeText={setEditedDescription}
          multiline
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Timezone"
          value={editedTimezone}
          onChangeText={setEditedTimezone}
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Price"
          value={String(editedPrice)}
          onChangeText={(val) => setEditedPrice(Number(val) || 0)}
          keyboardType="numeric"
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white min-h-[100px] text-top"
          placeholder="Embed Luma Event Page"
          value={editedLumaWidget}
          onChangeText={setEditedLumaWidget}
          multiline
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Link 1"
          value={editedLinks.link1}
          onChangeText={(val) =>
            setEditedLinks((prev) => ({ ...prev, link1: val }))
          }
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Link 2"
          value={editedLinks.link2}
          onChangeText={(val) =>
            setEditedLinks((prev) => ({ ...prev, link2: val }))
          }
        />
        <TextInput
          className="border border-gray-300 rounded p-3 mb-4 bg-white"
          placeholder="Link 3"
          value={editedLinks.link3}
          onChangeText={(val) =>
            setEditedLinks((prev) => ({ ...prev, link3: val }))
          }
        />

        <SelectComponent
          options={[
            { label: "Public", value: "PUBLIC" },
            { label: "Invite Only", value: "INVITE_ONLY" },
            { label: "Paid Members", value: "PAID_MEMBERS" },
          ]}
          value={editedPrivacy}
          onValueChange={setEditedPrivacy}
          placeholder="Privacy"
          triggerClassName="w-full border-gray-300"
          contentClassName="bg-white"
          inputClassName="text-sm"
          iconClassName="mr-3"
        />

        <SelectComponent
          options={[
            { label: "Live Stream", value: "LIVE_STREAM" },
            { label: "Webinar", value: "PRE_RECORDED" },
            { label: "Normal Event", value: "NORMAL_EVENT" },
          ]}
          value={editedEventType}
          onValueChange={setEditedEventType}
          placeholder="Event Type"
          triggerClassName="w-full border-gray-300"
          contentClassName="bg-white"
          inputClassName="text-sm"
          iconClassName="mr-3"
        />
        {editedEventType === "LIVE_STREAM" && (
          <View className="mb-4">
            <Checkbox
              size="md"
              isInvalid={false}
              isDisabled={false}
              value={String(editedRecorded)}
              onChange={() => setEditedRecorded(!editedRecorded)}
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel>Record this event</CheckboxLabel>
            </Checkbox>
            <Checkbox
              size="md"
              isInvalid={false}
              isDisabled={false}
              value={String(editedCommentsEnabled)}
              onChange={() => setEditedCommentsEnabled(!editedCommentsEnabled)}
            >
              <CheckboxIndicator>
                <CheckboxIcon as={CheckIcon} />
              </CheckboxIndicator>
              <CheckboxLabel>Enable Comments</CheckboxLabel>
            </Checkbox>
          </View>
        )}
        <View className="flex-row gap-4 mt-4">
          <Button onPress={handleSave} className="flex-1">
            <Text className="text-white font-medium">Save</Text>
          </Button>
          <Button
            onPress={handleCancel}
            variant="outline"
            className="flex-1 bg-transparent border border-gray-300"
          >
            <Text className="font-medium">Cancel</Text>
          </Button>
        </View>
      </ScrollView>
    );
  }

  return (
    <View className="p-2 my-2">
      {post.title && (
        <Text className="text-2xl font-semibold text-gray-800 mb-4">
          {post.title}
        </Text>
      )}

      <View className="flex-col md:flex-row flex-wrap">
        <View className="w-full mb-4">
          {post.event &&
            post.event.eventType !== "PRE_RECORDED" &&
            post.event.images &&
            post.event.images.length > 0 &&
            post.event.images[0] && (
              <Image
                source={{ uri: post.event.images[0] }}
                className="w-full h-48 rounded-lg"
                resizeMode="cover"
              />
            )}

          {post.event && post.event.video && (
            <View className="w-full h-48 bg-gray-100 justify-center items-center rounded-lg">
              <Text>Video player would appear here</Text>
            </View>
          )}
        </View>

        <View className="w-full">
          <View className="p-2">
            {!post.event?.lumaWidget && (
              <>
                <Text className="text-sm font-semibold text-pink-500 uppercase mb-1">
                  {formattedStartDate} - {formattedEndDate}
                </Text>
                <Text className="text-sm text-gray-500 mb-3">
                  {formattedStartTime} - {formattedEndTime}{" "}
                  {post.event?.timezone}
                </Text>
              </>
            )}

            <Text className="text-gray-500 my-2">
              {post.event?.description && (
                <HtmlRenderText source={post.event?.description} />
              )}
            </Text>

            {post.event?.eventType === "IN_PERSON" &&
              post.event.address &&
              post.event.address.address && (
                <TouchableOpacity
                  onPress={() =>
                    Linking.openURL(
                      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                        post.event?.address?.address || ""
                      )}`
                    )
                  }
                >
                  <Text className="text-sm text-blue-500 underline mt-2">
                    {post.event.address.address}
                  </Text>
                </TouchableOpacity>
              )}

            <View className="mt-0">
              {post.event?.link1 && (
                <TouchableOpacity
                  className="flex-row items-center mb-2"
                  onPress={() =>
                    post.event?.link1 && handleLinkPress(post.event.link1)
                  }
                >
                  <FontAwesome5 name="link" size={16} color="#3b82f6" />
                  <Text className="text-sm text-blue-500 underline ml-2">
                    {post.event.link1}
                  </Text>
                </TouchableOpacity>
              )}
              {post.event?.link2 && (
                <TouchableOpacity
                  className="flex-row items-center mb-2"
                  onPress={() =>
                    post.event?.link2 && handleLinkPress(post.event.link2)
                  }
                >
                  <FontAwesome5 name="link" size={16} color="#3b82f6" />
                  <Text className="text-sm text-blue-500 underline ml-2">
                    {post.event.link2}
                  </Text>
                </TouchableOpacity>
              )}
              {post.event?.link3 && (
                <TouchableOpacity
                  className="flex-row items-center mb-2"
                  onPress={() =>
                    post.event?.link3 && handleLinkPress(post.event.link3)
                  }
                >
                  <FontAwesome5 name="link" size={16} color="#3b82f6" />
                  <Text className="text-sm text-blue-500 underline ml-2">
                    {post.event.link3}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {post.event?.lumaWidget === "" && (
            <View className="p-2 flex-col gap-4">
              <View className="flex-row justify-between items-center">
                <Text className="font-bold text-base">Attendees:</Text>
                {renderRsvpAvatars()}
              </View>

              <Button
                onPress={handleRsvpToggle}
                variant={rsvpStatus ? "solid" : "outline"}
                className={`w-32 flex-row items-center justify-center ${
                  rsvpStatus ? "bg-green-500" : "border-violet-500"
                }`}
              >
                <Text
                  className={`font-medium ${
                    rsvpStatus ? "text-white" : "text-violet-500"
                  }`}
                >
                  {rsvpStatus ? "RSVP'ed" : "RSVP"}
                </Text>
                {rsvpStatus && (
                  <FontAwesome5
                    name="check"
                    size={16}
                    color="white"
                    className="ml-2"
                  />
                )}
              </Button>
            </View>
          )}
        </View>
      </View>

      {post.tags && post.tags.length > 0 && <PostTags tags={post.tags} />}
    </View>
  );
};
