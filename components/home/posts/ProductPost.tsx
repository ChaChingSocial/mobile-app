import { Badge } from "@/components/ui/badge";
import { Box } from "@/components/ui/box";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Select } from "@/components/ui/select";
import { statesInUS } from "@/lib/address";
import {
    createMarketplaceOrder,
    deleteProduct,
    likeProduct,
    unlikeProduct,
} from "@/lib/api/marketplace";
import { updatePost } from "@/lib/api/newsfeed";
import { useSession } from "@/lib/providers/AuthContext";
import { Address } from "@/types/address";
import { Post } from "@/types/post";
import React, { useState } from "react";
import {
    Alert,
    Image,
    ScrollView,
    Text
} from "react-native";

export function ProductPost({
  post,
  editing,
  onEditingChange,
}: {
  post: Post;
  editing: boolean;
  onEditingChange: (editing: boolean) => void;
}) {
  const { session } = useSession();
  const currentUserId = session?.uid;

  const [editedContent, setEditedContent] = useState(post.post);
  const [isLikedByCurrentUser, setIsLikedByCurrentUser] = useState(false);
  const [productLike, setProductLike] = useState(
    post.product?.userLikes?.length || 0
  );
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [address1, setAddress1] = useState("");
  const [address2, setAddress2] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipcode, setZipcode] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [dialogContent, setDialogContent] = useState("");

  const handleSave = () => {
    updatePost({ postId: post.id, editedContent }).then(() => {
      onEditingChange(false);
      post.post = editedContent;
    });
  };

  const handleCancel = () => {
    setEditedContent(post.post);
    onEditingChange(false);
  };

  const handleLike = async (id: string) => {
    try {
      if (isLikedByCurrentUser) {
        await unlikeProduct(currentUserId, id, currentUserId);
        setProductLike(productLike - 1);
      } else {
        await likeProduct(currentUserId, id, currentUserId);
        setProductLike(productLike + 1);
      }
      setIsLikedByCurrentUser(!isLikedByCurrentUser);
    } catch (error) {
      console.error("Error liking/unliking product:", error);
    }
  };

  const handleDelete = (id: string) => {
    deleteProduct(id).then(() => onEditingChange(false));
  };

  const handleCheckout = async () => {
    setLoading(true);
    try {
      const address: Address = {
        address1,
        address2,
        city,
        state,
        zipcode,
      };

      const orderId = await createMarketplaceOrder(
        currentUserId,
        post.product?.creatorUserId,
        post.product,
        email,
        address
      );

      if (!orderId) {
        console.error("Failed to create order");
        setLoading(false);
        return;
      }

      if (post.product?.price === 0) {
        Alert.alert(
          "Order Confirmed",
          "Your free product will be delivered shortly"
        );
        setLoading(false);
        return;
      }

      // For paid products, you would integrate with your payment processor here
      Alert.alert("Payment Required", "Redirecting to payment processor...");
    } catch (error) {
      console.error("Checkout error:", error);
      Alert.alert("Error", "There was an error processing your order");
    } finally {
      setLoading(false);
    }
  };

  const handleBuyClick = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setEmail("");
    setAddress1("");
    setAddress2("");
    setCity("");
    setState("");
    setZipcode("");
    setModalVisible(false);
  };

  const handleModalSubmit = () => {
    setModalVisible(false);
    const contactInfo = post.product?.isDigital
      ? `Email: ${email}`
      : `Address: ${address1}, ${address2}, ${city}, ${state}, ${zipcode}`;

    setDialogContent(
      `${post.posterName} will be sending you ${post.product?.title} shortly.\n${contactInfo}\nNote: Please give the user some time to respond.`
    );
    setDialogVisible(true);
    handleCheckout();
  };

  return (
    <Box className="p-4">
      {post.title && (
        <Text className="text-xl font-bold mb-2">{post.title}</Text>
      )}

      <Box className="flex-row items-center mb-4">
        {post.product?.images?.[0] && (
          <Image
            source={{ uri: post.product.images[0] }}
            className="w-40 h-40 rounded-lg mr-4"
            resizeMode="cover"
          />
        )}

        <Box className="flex-1">
          <Text className="text-lg font-bold">{post.product?.title}</Text>
          <Text className="text-gray-600">{post.product?.description}</Text>
          <Text className="text-gray-500">{`Price: $${post.product?.price}`}</Text>

          <Button onPress={handleBuyClick} className="mt-4" disabled={loading}>
            {loading ? "Processing..." : "Buy"}
          </Button>
        </Box>
      </Box>

      {post.product?.tags?.length > 0 && (
        <Box className="flex-row flex-wrap gap-2 mb-4">
          {post.product.tags.map((tag, index) => (
            <Badge key={index} className="bg-gray-200 px-2 py-1 rounded-full">
              <Text className="text-sm">{tag}</Text>
            </Badge>
          ))}
        </Box>
      )}

      {/* Checkout Modal */}
      <Modal
        visible={modalVisible}
        onClose={handleModalClose}
        title={
          post.product?.isDigital
            ? "Enter your email"
            : "Enter your shipping address"
        }
      >
        <ScrollView className="max-h-80">
          {post.product?.isDigital ? (
            <Input
              label="Email"
              placeholder="Your email"
              value={email}
              onChangeText={setEmail}
              required
              className="mb-4"
            />
          ) : (
            <>
              <Input
                label="Street Address"
                placeholder="Street address"
                value={address1}
                onChangeText={setAddress1}
                required
                className="mb-4"
              />
              <Input
                label="Address 2"
                placeholder="Address 2"
                value={address2}
                onChangeText={setAddress2}
                className="mb-4"
              />
              <Input
                label="City"
                placeholder="City"
                value={city}
                onChangeText={setCity}
                required
                className="mb-4"
              />
              <Select
                label="State"
                placeholder="Select state"
                items={statesInUS.map((state) => ({
                  label: state,
                  value: state,
                }))}
                selectedValue={state}
                onValueChange={setState}
                className="mb-4"
              />
              <Input
                label="Zip Code"
                placeholder="Zip Code"
                value={zipcode}
                onChangeText={setZipcode}
                required
                keyboardType="numeric"
                className="mb-4"
              />
            </>
          )}
        </ScrollView>

        <Box className="flex-row justify-end mt-4 gap-2">
          <Button variant="outline" onPress={handleModalClose}>
            Cancel
          </Button>
          <Button onPress={handleModalSubmit}>Submit</Button>
        </Box>
      </Modal>

      {/* Order Confirmation Dialog */}
      <Modal
        visible={dialogVisible}
        onClose={() => setDialogVisible(false)}
        title="Order Confirmation"
      >
        <Text className="text-gray-700">{dialogContent}</Text>
        <Button onPress={() => setDialogVisible(false)} className="mt-4">
          Close
        </Button>
      </Modal>
    </Box>
  );
}
