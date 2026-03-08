import React, { useEffect, useState } from "react";
import { Text, Pressable } from "react-native";
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

  // keep local state in sync with parent toggle
  useEffect(() => {
    setShowComments(showAllComments);
  }, [showAllComments]);

  const handleLoginSuccess = () => {
    setIsAuthModalOpen(false);
    setCanViewComments(true);
  };

  // Sort comments by likes and then timestamp (robust to Date | number | Firestore Timestamp)
  const toMillis = (t: any) => {
    try {
      if (!t) return 0;
      if (typeof t === "number") return t;
      if (typeof t === "string") return new Date(t).getTime() || 0;
      // Firestore Timestamp shape
      if (typeof t.seconds === "number") {
        return t.seconds * 1000 + (t.nanoseconds ? t.nanoseconds / 1e6 : 0);
      }
      const ms = new Date(t).getTime();
      return Number.isFinite(ms) ? ms : 0;
    } catch {
      return 0;
    }
  };

  const sortedComments = [...(post.comments || [])].sort((a, b) => {
    const byLikes = (b.likes?.length || 0) - (a.likes?.length || 0);
    if (byLikes !== 0) return byLikes;
    return toMillis(b.timestamp) - toMillis(a.timestamp);
  });


  return (
    <Box>
      {sortedComments.length > 0 && (
        <Box className="mt-4 relative ">
          {/*{!canViewComments && (*/}
          {/*  <Pressable*/}
          {/*    className="absolute top-0 left-0 w-full h-full items-center justify-center rounded-xl overflow-hidden"*/}
          {/*    onPress={() => setIsAuthModalOpen(true)}*/}
          {/*    style={{ zIndex: 10 }}*/}
          {/*  >*/}
          {/*    <BlurView*/}
          {/*      intensity={30}*/}
          {/*      tint="dark"*/}
          {/*      className="absolute top-0 left-0 w-full h-full"*/}
          {/*    />*/}
          {/*    <Button*/}
          {/*      onPress={() => setIsAuthModalOpen(true)}*/}
          {/*      className="bg-purple-700 px-6 py-2 rounded-lg"*/}
          {/*    >*/}
          {/*      <Text className="text-white text-base font-semibold">*/}
          {/*        Login to view more comments*/}
          {/*      </Text>*/}
          {/*    </Button>*/}
          {/*  </Pressable>*/}
          {/*)}*/}
          {showComments ? (
            sortedComments.map((comment, index) => (
              <Box key={index} className="mt-3 mb-3">
                <Comment comment={comment} post={post} />
              </Box>
            ))
          ) : (
            <Comment comment={sortedComments[0]} post={post} />
          )}
        </Box>
      )}
    </Box>
  );
};
