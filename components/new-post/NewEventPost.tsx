import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";


type PostEventModalNativeProps = {
  visible: boolean;
  onClose: () => void;
};

export default function NewEventPost({
  visible,
  onClose,
}: PostEventModalNativeProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone
  );
  const [price, setPrice] = useState("0");
  const [addLinks, setAddLinks] = useState(false);
  const [link1, setLink1] = useState("");
  const [link2, setLink2] = useState("");
  const [link3, setLink3] = useState("");
  const [privacy, setPrivacy] = useState<
    "PUBLIC" | "INVITE_ONLY" | "PAID_MEMBERS"
  >("PUBLIC");
  const [eventType, setEventType] = useState<
    "LIVE_STREAM" | "PRE_RECORDED" | "IN_PERSON"
  >("LIVE_STREAM");
  const [recorded, setRecorded] = useState(false);
  const [commentsEnabled, setCommentsEnabled] = useState(true);
  const [address, setAddress] = useState("");

  const pickImage = async () => {
    if (images.length >= 3) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImages([...images, result.assets[0].uri]);
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const pickVideo = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Videos,
      quality: 0.8,
    });
    if (!result.canceled) {
      setVideoUri(result.assets[0].uri);
    }
  };

  const handleSubmit = () => {
    // TODO: integrate uploadItemImages, uploadItemVideo, form submission logic
    onClose();
  };

  return (

      <View className="bg-white p-4 rounded-2xl max-h-[90%]">
        <Text className="text-xl font-bold mb-4 text-center">Post Event</Text>
        <ScrollView className="space-y-4">
          {/* Title */}
          <TextInput
            className="border border-gray-300 rounded p-2"
            placeholder="Title"
            value={title}
            onChangeText={setTitle}
          />

          {/* Description */}
          <TextInput
            className="border border-gray-300 rounded p-2 h-24 text-top"
            placeholder="Description"
            multiline
            value={description}
            onChangeText={setDescription}
          />

          {/* Image Picker */}
          <TouchableOpacity
            onPress={pickImage}
            className="bg-blue-500 py-2 rounded items-center"
          >
            <Text className="text-white">Pick Images ({images.length}/3)</Text>
          </TouchableOpacity>
          <View className="flex-row flex-wrap">
            {images.map((uri, idx) => (
              <View key={idx} className="relative mr-2 mb-2">
                <Image source={{ uri }} className="w-24 h-24 rounded" />
                <TouchableOpacity
                  onPress={() => removeImage(idx)}
                  className="absolute top-0 right-0 bg-red-600 rounded-full p-1"
                >
                  <Text className="text-white text-xs">X</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Video Picker */}
          {eventType === "PRE_RECORDED" && (
            <>
              <TouchableOpacity
                onPress={pickVideo}
                className="bg-green-500 py-2 rounded items-center"
              >
                <Text className="text-white">Pick Video</Text>
              </TouchableOpacity>
              {videoUri && (
                <Video
                  source={{ uri: videoUri }}
                  className="w-full h-48 mt-2"
                  useNativeControls
                />
              )}
            </>
          )}

          {/* Date Pickers */}
          <TouchableOpacity onPress={() => setShowStartPicker(true)}>
            <Text className="p-2 border border-gray-300 rounded">
              Start: {startDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {showStartPicker && (
            <DateTimePicker
              value={startDate}
              mode="datetime"
              display="default"
              onChange={(e, d) => {
                setShowStartPicker(false);
                d && setStartDate(d);
              }}
            />
          )}

          <TouchableOpacity onPress={() => setShowEndPicker(true)}>
            <Text className="p-2 border border-gray-300 rounded">
              End: {endDate.toLocaleString()}
            </Text>
          </TouchableOpacity>
          {showEndPicker && (
            <DateTimePicker
              value={endDate}
              mode="datetime"
              display="default"
              onChange={(e, d) => {
                setShowEndPicker(false);
                d && setEndDate(d);
              }}
            />
          )}

          {/* Timezone */}
          <Picker
            selectedValue={timezone}
            onValueChange={setTimezone}
            className="border border-gray-300 rounded"
          >
            {Intl.supportedValuesOf("timeZone").map((tz) => (
              <Picker.Item key={tz} label={tz} value={tz} />
            ))}
          </Picker>

          {/* Price */}
          <TextInput
            className="border border-gray-300 rounded p-2"
            placeholder="Price"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          {/* Add Links */}
          <View className="flex-row items-center">
            <Switch value={addLinks} onValueChange={setAddLinks} />
            <Text className="ml-2">Add Links</Text>
          </View>
          {addLinks && (
            <>
              <TextInput
                className="border border-gray-300 rounded p-2"
                placeholder="Link 1"
                value={link1}
                onChangeText={setLink1}
              />
              <TextInput
                className="border border-gray-300 rounded p-2"
                placeholder="Link 2"
                value={link2}
                onChangeText={setLink2}
              />
              <TextInput
                className="border border-gray-300 rounded p-2"
                placeholder="Link 3"
                value={link3}
                onChangeText={setLink3}
              />
            </>
          )}

          {/* Privacy */}
          <Picker
            selectedValue={privacy}
            onValueChange={(v) => setPrivacy(v as any)}
            className="border border-gray-300 rounded"
          >
            <Picker.Item label="Public" value="PUBLIC" />
            <Picker.Item label="Invite Only" value="INVITE_ONLY" />
            <Picker.Item label="Paid Members" value="PAID_MEMBERS" />
          </Picker>

          {/* Event Type */}
          <Picker
            selectedValue={eventType}
            onValueChange={(v) => setEventType(v as any)}
            className="border border-gray-300 rounded"
          >
            <Picker.Item label="Live Stream" value="LIVE_STREAM" />
            <Picker.Item label="Pre-Recorded" value="PRE_RECORDED" />
            <Picker.Item label="In Person" value="IN_PERSON" />
          </Picker>

          {/* Live Stream Options */}
          {eventType === "LIVE_STREAM" && (
            <>
              <View className="flex-row items-center">
                <Switch value={recorded} onValueChange={setRecorded} />
                <Text className="ml-2">Record this event</Text>
              </View>
              <View className="flex-row items-center">
                <Switch
                  value={commentsEnabled}
                  onValueChange={setCommentsEnabled}
                />
                <Text className="ml-2">Enable Comments</Text>
              </View>
            </>
          )}

          {/* In-Person Address */}
          {eventType === "IN_PERSON" && (
            <TextInput
              className="border border-gray-300 rounded p-2"
              placeholder="Address"
              value={address}
              onChangeText={setAddress}
            />
          )}
        </ScrollView>
        {/* Actions */}
        <View className="flex-row justify-end space-x-2 mt-4">
          <TouchableOpacity
            onPress={onClose}
            className="px-4 py-2 rounded bg-gray-300"
          >
            <Text>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={handleSubmit}
            className="px-4 py-2 rounded bg-blue-600"
          >
            <Text className="text-white">Submit</Text>
          </TouchableOpacity>
        </View>
      </View>

  );
}
