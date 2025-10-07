import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  query,
  where,
  getFirestore,
  getDoc,
  deleteDoc,
  setDoc,
  onSnapshot,
  orderBy,
  limit,
  startAfter,
  DocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { Like, Comment, Post } from "@/types/post";
import { app, auth } from "@/config/firebase";
import { sendNotification } from "./notifications";
import { usePostStore } from "../store/post";

const db = getFirestore(app);
const user = auth.currentUser;

// Post on the newsfeed
export async function createPost(newsfeedPost: Post) {
  console.log("Creating post:", newsfeedPost);
  console.log("User session:", user);
  if (!user) {
    throw new Error("User not authenticated");
  }

  try {
    // Create a document reference to get an ID first
    const docRef = doc(collection(db, "posts"));

    // Add the post data with the document ID included
    await setDoc(docRef, { ...newsfeedPost, id: docRef.id });

    if (user && user?.displayName && newsfeedPost.newsfeedId) {
      await sendNotification(
        user.uid,
        newsfeedPost.newsfeedId,
        user.displayName,
        "COMMUNITY_UPDATE",
        "POST"
      );
    }

    if (
      user &&
      user?.displayName &&
      newsfeedPost.newsfeedId &&
      newsfeedPost.taggedUsers
    ) {
      await sendNotification(
        user.uid,
        newsfeedPost.newsfeedId,
        user.displayName,
        "TAGGED",
        "POST"
      );
    }

    if (newsfeedPost.likes === undefined) {
      newsfeedPost.likes = [];
    }

    if (newsfeedPost.comments === undefined) {
      newsfeedPost.comments = [];
    }

    console.log("Document written with ID:", docRef.id);
    return { id: docRef.id, ...newsfeedPost };
  } catch (error) {
    console.error("Error creating post:", error);
    throw error; // rethrow the error after logging it
  }
}

export async function deletePost(postId: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    await deleteDoc(postDoc);
  } catch (error) {
    console.error("Error deleting post:", error);
  }
}

export async function deleteComment(postId: string, commentId: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const comment = findComment(postData.comments, commentId);

      if (comment) {
        const updatedComments = postData.comments.filter(
          (c: { id: string }) => c.id !== commentId
        );
        await updateDoc(postDoc, { comments: updatedComments });
        console.log(`Comment ${commentId} deleted from post ${postId}`);
      } else {
        console.error(`Comment ${commentId} does not exist in post ${postId}`);
      }
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error deleting comment:", error);
  }
}

export async function updatePost(
  postId: string | "",
  newContent: any | undefined,
  newTags: string[] | undefined
) {
  try {
    console.log("post", postId, newContent, newTags);
    const postDoc = doc(db, "posts", postId);
    await updateDoc(postDoc, { post: newContent, tags: newTags || [] });
    console.log("Post updated successfully");
  } catch (error) {
    console.error("Error updating post:", error);
    throw error; // Rethrow the error to be caught in the calling function
  }
}

export async function updatePostAdvert({
  postId,
  editedTitle,
  editedDescription,
  editedContent,
  editedLink,
  editedStartTimeDate,
  editedEndTimeDate,
  editedPricePerClick,
  editedCommentable,
}: {
  postId: string;
  editedTitle: string;
  editedDescription: string;
  editedContent: string;
  editedLink: string;
  editedStartTimeDate: Date;
  editedEndTimeDate: Date;
  editedPricePerClick: number;
  editedCommentable: boolean;
}): Promise<void> {
  try {
    const postDocRef = doc(db, "posts", postId);

    await updateDoc(postDocRef, {
      post: editedContent,
      advert: {
        content: editedContent,
        description: editedDescription,
        link: editedLink,
        title: editedTitle,
        startTimeDate: editedStartTimeDate,
        endTimeDate: editedEndTimeDate,
        pricePerClick: editedPricePerClick,
        commentable: editedCommentable,
      },
    });
  } catch (error) {
    console.error("Error updating post advert:", error);
    throw error;
  }
}

export async function updatePostEvent({
  postId,
  editedTitle,
  editedDescription,
  editedLinks,
  editedStartTimeDate,
  editedEndTimeDate,
  editedTimezone,
  editedPrice,
  editedEventType,
  editedRecorded,
  editedCommentsEnabled,
  editedLumaWidget,
  editedPrivacy,
}: {
  postId: string;
  editedTitle: string;
  editedDescription: string;

  editedLinks: {
    link1: string;
    link2: string;
    link3: string;
  };
  editedStartTimeDate: Date;
  editedEndTimeDate: Date;
  editedTimezone: string;
  editedPrice: number;
  editedRecorded: boolean;
  editedEventType: string;
  editedCommentsEnabled: boolean;
  editedLumaWidget: string;
  editedPrivacy: string;
}): Promise<void> {
  try {
    const postDocRef = doc(db, "posts", postId);

    await updateDoc(postDocRef, {
      event: {
        description: editedDescription,
        links: editedLinks,
        title: editedTitle,
        startTimeDate: editedStartTimeDate,
        endTimeDate: editedEndTimeDate,
        timezone: editedTimezone,
        price: editedPrice,
        recorded: editedRecorded,
        eventType: editedEventType,
        commentsEnabled: editedCommentsEnabled,
        lumaWidget: editedLumaWidget,
        privacy: editedPrivacy,
      },
    });
  } catch (error) {
    console.error("Error updating post event:", error);
    throw error;
  }
}

type Event = {
  rsvps: {
    localId: string;
    email: string;
    displayName: string;
    photoUrl: string;
  }[];
};

export async function updateEventRSVP(
  postId: string,
  userData: {
    localId: string;
    email: string;
    displayName: string;
    photoUrl: string;
  }
): Promise<void> {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data() as { event?: Event };
      if (postData.event?.rsvps) {
        const updatedRSVPs = postData.event.rsvps.some(
          (rsvp) => rsvp.localId === userData.localId
        )
          ? postData.event.rsvps.filter(
              (rsvp) => rsvp.localId !== userData.localId
            )
          : [...postData.event.rsvps, userData];

        await updateDoc(postDoc, {
          event: { ...postData.event, rsvps: updatedRSVPs },
        });
      } else {
        const updatedRSVPs = [userData];
        await updateDoc(postDoc, {
          event: { ...postData.event, rsvps: updatedRSVPs },
        });
      }
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error updating event RSVP: ${error.message}`);
    }
    throw error;
  }
}

export async function checkUserRSVP(
  postId: string,
  userId: string
): Promise<boolean> {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data() as { event?: Event };
      if (postData.event?.rsvps) {
        return postData.event.rsvps.some((rsvp) => rsvp.localId === userId);
      }
    }
    return false;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Error updating event RSVP: ${error.message}`);
    }
    throw error;
  }
}

export async function updateComment(
  postId: string,
  commentId: string,
  newContent: {
    message: string;
    mentions: string[];
  }
) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const comment = findComment(postData.comments, commentId);

      if (comment) {
        comment.message.message = newContent.message; // Ensure the message content is updated
        comment.timestamp = new Date();
        await updateDoc(postDoc, { comments: postData.comments });
        console.log(`Comment ${commentId} updated in post ${postId}`);
      } else {
        console.error(`Comment ${commentId} does not exist in post ${postId}`);
      }
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error updating comment:", error);
  }
}

export async function likePost(
  postId: string,
  userId: string,
  reaction: string
) {
  const newLike: Like = {
    userId,
    reaction,
    timestamp: new Date(),
  };

  console.log("Liking post:", postId);
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    console.log("Post snapshot:", postSnap.data());
    if (postSnap.exists()) {
      const postData = postSnap.data();
      const existingLike = postData.likes?.find(
        (like: { userId: string }) => like.userId === userId
      );

      if (existingLike) {
        existingLike.reaction = reaction;
        existingLike.timestamp = new Date();
      } else {
        postData.likes = postData.likes
          ? [...postData.likes, newLike]
          : [newLike];
      }

      await updateDoc(postDoc, { likes: postData.likes });
      console.log(`Like added/updated for post ${postId}`);
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error adding like:", error);
  }
}

export async function unlikePost(postId: string, userId: string) {
  console.log("Unliking post:", postId);
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const updatedLikes = postData.likes?.filter(
        (like: { userId: string }) => like.userId !== userId
      );

      await updateDoc(postDoc, { likes: updatedLikes });
      console.log(`Like removed for post ${postId}`);
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error removing like:", error);
  }
}

export async function likeComment(
  postId: string,
  commentId: string,
  userId: string,
  reaction: string,
  posterId: string,
  communityId: string,
  userName: string
) {
  const newLike = {
    userId,
    reaction,
    timestamp: new Date(),
  };

  console.log("Liking comment:", commentId);
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const comment = findComment(postData.comments, commentId);

      if (comment) {
        const existingLike = comment.likes?.find(
          (like: { userId: string }) => like.userId === userId
        );

        if (existingLike) {
          existingLike.reaction = reaction;
          existingLike.timestamp = new Date();
        } else {
          comment.likes = comment.likes
            ? [...comment.likes, newLike]
            : [newLike];
        }

        await updateDoc(postDoc, { comments: postData.comments });
        await sendNotification(
          posterId,
          communityId,
          userName,
          "LIKED",
          "POST"
        );

        console.log(`Like added/updated for comment ${commentId}`);
      } else {
        console.error(`Comment ${commentId} does not exist in post ${postId}`);
      }
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error adding like to comment:", error);
  }
}

export async function unlikeComment(
  postId: string,
  commentId: string,
  userId: string
): Promise<void> {
  console.log("Unliking comment:", commentId);
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const updatedComments = postData.comments.map((comment: Comment) => {
        if (comment.id === commentId) {
          const updatedLikes = comment.likes.filter(
            (like) => like.userId !== userId
          );
          return { ...comment, likes: updatedLikes };
        }
        return comment;
      });

      await updateDoc(postDoc, { comments: updatedComments });
      console.log(`Like removed for comment ${commentId}`);
    } else {
      console.error(`Post ${postId} does not exist`);
    }
  } catch (error) {
    console.error("Error removing like from comment:", error);
  }
}

function findComment(comments: Comment[], commentId: string): Comment | null {
  for (const comment of comments) {
    if (comment.id === commentId) {
      return comment;
    }
    if (comment.comments && comment.comments.length > 0) {
      const found = findComment(comment.comments, commentId);
      if (found) {
        return found;
      }
    }
  }
  return null;
}

// Comment on a post
export async function commentOnPost(
  postId: string,
  newComment: {
    userId: string;
    userName: string;
    userPic: string;
    message: { message: string; mentions: string[] };
    timestamp: Date;
    likes: never[];
    comments: never[];
    postReference: string;
    communityId: string;
  },
  posterId: string
) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const newCommentWithId: Comment = {
        ...newComment,
        id: `${postId}_comment_${postData.comments?.length + 1 || 1}`,
        userId: newComment.userId || "",
        message: newComment.message,
        timestamp: new Date(),
        likes: [],
        comments: [],
      };

      console.log("Updating post with comments:", newCommentWithId);

      postData.comments = postData.comments
        ? [...postData.comments, newCommentWithId]
        : [newCommentWithId];
      await updateDoc(postDoc, { comments: postData.comments });

      console.log(`Comment added to post ${postId}`);

      await sendNotification(
        posterId,
        newComment.communityId,
        newComment.userName,
        "COMMENTED",
        "POST"
      );

      return newCommentWithId;
    }
  } catch (error) {
    console.error("Error adding comment:", error);
  }
}

// Share a post
export async function sharePostOnNewsfeed(postId: string, userId: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);
    const postData = postSnap.data();

    const newPost = {
      userId,
      message: `Shared a post: ${postData?.message}`,
      timestamp: new Date(),
      pictures: postData?.pictures,
      documents: postData?.documents,
      likes: [],
      comments: [],
    };

    const docRef = await addDoc(collection(db, "posts"), newPost);
    return { id: docRef.id, ...newPost };
  } catch (error) {
    console.error("Error sharing post:", error);
  }
}

export function taggingUsersInPost(postId: string, taggedUsers: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = getDoc(postDoc);

    if (postSnap) {
      const postData = postSnap.data();
      postData.taggedUsers = taggedUsers;

      updateDoc(postDoc, { taggedUsers });
    }
  } catch (error) {
    console.error("Error tagging users in post:", error);
  }
}

// View all posts in the newsfeed
export async function getAllPosts() {
  try {
    const querySnapshot = await getDocs(collection(db, "posts"));
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    return posts;
  } catch (error) {
    console.error("Error fetching posts:", error);
    return []; // Return an empty array or handle error as per your requirement
  }
}

export function subscribeToFeaturedPost(
  onPostsChange: (posts: Post[]) => void
) {
  const q = query(
    collection(db, "posts"),
    // where('featured', '==', true),
    orderBy("modifiedAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const posts = querySnapshot.docs.map((doc) => {
        const postData = doc.data();
        if (postData.comments) {
          postData.comments.sort(
            (a: { timestamp: number }, b: { timestamp: number }) =>
              b.timestamp - a.timestamp
          );
        }
        return { id: doc.id, ...postData };
      });
      onPostsChange(posts);
    },
    (error) => {
      console.error("Error fetching posts by newsfeed ID:", error);
    }
  );

  return unsubscribe; // Return the unsubscribe function to stop listening to changes when necessary
}

export async function getFeaturedPosts(lastDoc = null) {
  try {
    let q = query(
      collection(db, "posts"),
      where("featured", "==", true),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    if (lastDoc) {
      // Add validation for DocumentSnapshot
      if (!(lastDoc instanceof DocumentSnapshot) || !lastDoc.exists) {
        throw new Error("Invalid lastDoc - not a valid DocumentSnapshot");
      }

      // Verify the document has required fields
      if (!lastDoc.data().createdAt) {
        throw new Error("lastDoc missing createdAt field");
      }

      q = query(q, startAfter(lastDoc), limit(25));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      // Ensure createdAt exists for pagination
      createdAt: doc.data().createdAt.toMillis(),
    }));

    const newLastDoc =
      querySnapshot.docs.length >= 10
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    // Check if we received any new posts
    if (posts.length === 0) {
      return { posts: [], lastDoc: null }; // No more posts to fetch
    }
    // Sort posts by createdAt in descending order
    posts.sort((a, b) => b.createdAt - a.createdAt);
    return { posts, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching featured posts:", error);
    return { posts: [], lastDoc: null };
  }
}

export async function getPostsByUser(
  userId: string,
  lastDoc: DocumentSnapshot | null = null
) {
  try {
    let q = query(
      collection(db, "posts"),
      where("posterUserId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(25)
    );

    if (lastDoc) {
      if (!(lastDoc instanceof DocumentSnapshot) || !lastDoc.exists) {
        throw new Error("Invalid lastDoc - not a valid DocumentSnapshot");
      }
      if (!lastDoc.data().createdAt) {
        throw new Error("lastDoc missing createdAt field");
      }
      q = query(q, startAfter(lastDoc), limit(25));
    }

    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toMillis(),
    }));

    const newLastDoc =
      querySnapshot.docs.length >= 10
        ? querySnapshot.docs[querySnapshot.docs.length - 1]
        : null;

    if (posts.length === 0) {
      return { posts: [], lastDoc: null };
    }

    posts.sort((a, b) => b.createdAt - a.createdAt);
    return { posts, lastDoc: newLastDoc };
  } catch (error) {
    console.error("Error fetching user's posts:", error);
    return { posts: [], lastDoc: null };
  }
}

export function subscribeToPosts(onPostsChange: (posts: Post[]) => void) {
  const q = query(collection(db, "posts"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const posts = querySnapshot.docs.map((doc) => {
        const postData = doc.data();
        if (postData.comments) {
          postData.comments.sort(
            (a: { timestamp: number }, b: { timestamp: number }) =>
              b.timestamp - a.timestamp
          );
        }
        return { id: doc.id, ...postData };
      });
      onPostsChange(posts);
    },
    (error) => {
      console.error("Error fetching posts:", error);
    }
  );

  return unsubscribe; // Return the unsubscribe function to stop listening to changes when necessary
}

export function subscribeToPostsByUserId(
  userId: string,
  onPostsChange: (posts: Post[]) => void
) {
  const q = userId
    ? query(
        collection(db, "posts"),
        where("posterUserId", "==", userId),
        orderBy("createdAt", "desc")
      )
    : query(collection(db, "posts"), orderBy("createdAt", "desc"));

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const posts = querySnapshot.docs.map((doc) => {
        const postData = doc.data();
        if (postData.comments) {
          postData.comments.sort(
            (a: { timestamp: number }, b: { timestamp: number }) =>
              b.timestamp - a.timestamp
          );
        }
        return { id: doc.id, ...postData };
      });
      onPostsChange(posts);
    },
    (error) => {
      console.error("Error fetching posts by user ID:", error);
    }
  );

  return unsubscribe;
}

export function subscribeToPostsByNewsfeedId(
  newsfeedId: string,
  onPostsChange: (posts: Post[]) => void
) {
  const q = query(
    collection(db, "posts"),
    where("newsfeedId", "==", newsfeedId),
    orderBy("createdAt", "desc")
  );

  const unsubscribe = onSnapshot(
    q,
    (querySnapshot) => {
      const posts = querySnapshot.docs.map((doc) => {
        const postData = doc.data();
        if (postData.comments) {
          postData.comments.sort(
            (a: { timestamp: number }, b: { timestamp: number }) =>
              b.timestamp - a.timestamp
          );
        }
        return { id: doc.id, ...postData };
      });
      onPostsChange(posts);
    },
    (error) => {
      console.error("Error fetching posts by newsfeed ID:", error);
    }
  );

  return unsubscribe;
}

// get posts that belong to the same community
export async function getPostsByNewsfeedId(newsfeedId: string) {
  try {
    const q = query(
      collection(db, "posts"),
      where("newsfeedId", "==", newsfeedId)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return posts;
  } catch (error) {
    console.error("Error fetching posts by newsfeed ID:", error);
    return []; // Or handle the error differently
  }
}

// Search through all the posts
export async function searchThroughPosts(queryString: string) {
  try {
    const q = query(
      collection(db, "posts"),
      where("message", ">=", queryString),
      where("message", "<=", `${queryString}\uf8ff`)
    );
    const querySnapshot = await getDocs(q);
    const posts = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log("Search results:", posts);
    return posts;
  } catch (error) {
    console.error("Error searching posts:", error);
  }
}

export async function pinPost(postId: string, order: number) {
  try {
    const postDoc = doc(db, "posts", postId);
    await updateDoc(postDoc, { pinPost: { id: postId, order } });

    // Fetch the updated post and update the pinned posts state
    const postSnap = await getDoc(postDoc);
    if (postSnap.exists()) {
      const postData = postSnap.data();

      usePostStore.getState().setPinnedPosts((prevPinnedPosts) => {
        const updatedPinnedPosts = [...prevPinnedPosts, postData].sort(
          (a, b) => a.pinPost!.order - b.pinPost!.order
        );
        return updatedPinnedPosts;
      });
    }
  } catch (error) {
    console.error("Error pinning post:", error);
  }
}

export async function unpinPost(postId: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    await updateDoc(postDoc, { pinPost: { id: "", order: 0 } });

    // Fetch the updated post and update the pinned posts state
    const postSnap = await getDoc(postDoc);
    if (postSnap.exists()) {
      postSnap.data();

      usePostStore.getState().setPinnedPosts((prevPinnedPosts) => {
        const updatedPinnedPosts = prevPinnedPosts.filter(
          (post) => post.id !== postId
        );
        return updatedPinnedPosts;
      });
    }
  } catch (error) {
    console.error("Error unpinning post:", error);
  }
}

export async function orderPinnedPosts(reorderedPosts: Post[]) {
  try {
    for (let i = 0; i < reorderedPosts.length; i++) {
      const post = reorderedPosts[i];
      if (!post.id) {
        throw new Error("Post ID is undefined");
      }
      const postDoc = doc(db, "posts", post.id);
      await updateDoc(postDoc, { "pinPost.order": i + 1 });
    }
  } catch (error) {
    console.error("Error ordering pinned posts:", error);
  }
}

export async function getSinglePost(postId: string) {
  try {
    const postDoc = doc(db, "posts", postId);
    const postSnap = await getDoc(postDoc);

    if (postSnap.exists()) {
      return { id: postId, ...postSnap.data() };
    }
  } catch (error) {
    console.error("Error fetching post:", error);
  }
}
