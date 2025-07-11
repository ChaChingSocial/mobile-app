import { useSession } from "@/lib/providers/AuthContext";
import { likePost, unlikePost } from "@/lib/api/newsfeed";
import { Button, Text, View } from "react-native";
import Toast from "react-native-toast-message";
import { useState } from "react";

export default function LikeNotificationTest() {
  const { session } = useSession();
  const [isLiking, setIsLiking] = useState(false);
  const [isUnliking, setIsUnliking] = useState(false);

  const testPostId = "LmIKxO40dMHY0R72qYTm";
  const testPostOwnerId = "QEen0tAjEKcBXDIuTIGTA46tnd53"; // Different from current user

  const handleLikePost = async () => {
    if (!session?.uid) {
      Toast.show({
        text1: "No user session found",
        type: "error",
      });
      return;
    }

    setIsLiking(true);
    try {
      await likePost(testPostId, session.uid, "like");
      
      Toast.show({
        text1: "Post liked successfully!",
        text2: "Notification should be sent to post owner",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Failed to like post",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleUnlikePost = async () => {
    if (!session?.uid) {
      Toast.show({
        text1: "No user session found",
        type: "error",
      });
      return;
    }

    setIsUnliking(true);
    try {
      await unlikePost(testPostId, session.uid);
      
      Toast.show({
        text1: "Post unliked successfully!",
        type: "success",
      });
    } catch (error) {
      Toast.show({
        text1: "Failed to unlike post",
        text2: error instanceof Error ? error.message : "Unknown error",
        type: "error",
      });
    } finally {
      setIsUnliking(false);
    }
  };

  return (
    <View
      style={{ 
        padding: 20,
        backgroundColor: "#f0f8ff",
        borderRadius: 8,
        margin: 16
      }}
    >
      <Text style={{ fontSize: 18, fontWeight: "bold", marginBottom: 10 }}>
        Like Notification Workflow Test
      </Text>
      
      <Text style={{ textAlign: "center", marginBottom: 20 }}>
        This component tests the complete like notification workflow:
        {"\n"}1. User likes a post
        {"\n"}2. Notification is sent to post owner
        {"\n"}3. Push notification is sent through Go backend
      </Text>

      <Text style={{ marginBottom: 10 }}>
        Current User: {session?.uid || "Not logged in"}
      </Text>

      <Text style={{ marginBottom: 10, fontSize: 12 }}>
        Test Post ID: {testPostId}
      </Text>

      <Text style={{ marginBottom: 10, fontSize: 12 }}>
        Post Owner ID: {testPostOwnerId}
      </Text>

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isLiking ? "Liking..." : "Like Post (Send Notification)"}
          onPress={handleLikePost}
          disabled={isLiking || !session?.uid}
        />
      </View>

      <View style={{ marginBottom: 15 }}>
        <Button
          title={isUnliking ? "Unliking..." : "Unlike Post"}
          onPress={handleUnlikePost}
          disabled={isUnliking || !session?.uid}
        />
      </View>

      <Text style={{ fontSize: 12, color: "#666", textAlign: "center", marginTop: 10 }}>
        Check the post owner's device for push notifications!
      </Text>
    </View>
  );
} 