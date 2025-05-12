import React, { useEffect, useState } from "react";
import {
  Text,
  Pressable,
} from "react-native";
import { Button } from "@/components/ui/button";

import { BlurView } from "expo-blur";
import { Post as PostType } from "@/types/post";
import { useSession } from "@/lib/providers/AuthContext";
import { Comment } from "./Comment";
import { Box } from "@/components/ui/box";

export const PostComments = ({
  post,
  showAllComments,
}: {
  post: PostType;
  showAllComments: boolean;
}) => {
  const { session: user } = useSession();

  const [showComments, setShowComments] = useState(showAllComments);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [canViewComments, setCanViewComments] = useState(false);

  useEffect(() => {
    setCanViewComments(!!user);
  }, [user]);

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    setCanViewComments(true);
  };

  // Sort comments by likes and then timestamp
  const sortedComments = [...(post.comments || [])].sort((a, b) => {
    if ((b.likes?.length || 0) === (a.likes?.length || 0)) {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    }
    return (b.likes?.length || 0) - (a.likes?.length || 0);
  });

  return (
    <Box >
      {sortedComments.length > 0 && (
        <Box className="mt-4 relative ">
          <Comment comment={sortedComments[0]} post={post} />
          {!canViewComments && (
            <Pressable
              className="absolute top-0 left-0 w-full h-full items-center justify-center rounded-xl overflow-hidden"
              onPress={() => setIsAuthModalOpen(true)}
              style={{ zIndex: 10 }}
            >
              <BlurView
                intensity={30}
                tint="dark"
                className="absolute top-0 left-0 w-full h-full"
              />
              <Button
                onPress={() => setIsAuthModalOpen(true)}
                className="bg-purple-700 px-6 py-2 rounded-lg"
              >
                <Text className="text-white text-base font-semibold">
                  Login to view more comments
                </Text>
              </Button>
            </Pressable>
          )}
          {canViewComments &&
            showComments &&
            sortedComments.slice(1).map((comment, index) => (
              <Box key={index} className="mt-6 mb-6">
                <Comment comment={comment} post={post} />
              </Box>
            ))}
        </Box>
      )}
    </Box>
  );
};
