import { app } from "@/config/firebase";
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  updateDoc,
  where,
} from "firebase/firestore";

const db = getFirestore(app);

export interface Message {
  id: string;
  text: string;
  senderId: string;
  createdAt: Timestamp | null;
  read: boolean;
  reactions?: Record<string, string[]>; // emoji → [userId, ...]
  mediaUrl?: string;                    // Firebase Storage download URL
  mediaType?: "image" | "video";
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastMessageBy: string;
  unreadCount?: number;
  title?: string; // Custom title for the conversation
}

/**
 * Deterministic conversation ID from two user IDs so both sides
 * always resolve to the same Firestore document.
 */
export function getConversationId(uid1: string, uid2: string): string {
  return [uid1, uid2].sort().join("_");
}

/**
 * Ensures a conversation document exists between two users.
 * Returns the conversation ID.
 */
export async function getOrCreateConversation(
  currentUserId: string,
  otherUserId: string
): Promise<string> {
  const conversationId = getConversationId(currentUserId, otherUserId);
  const conversationRef = doc(db, "conversations", conversationId);
  const conversationSnap = await getDoc(conversationRef);

  if (!conversationSnap.exists()) {
    await setDoc(conversationRef, {
      participants: [currentUserId, otherUserId],
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
      lastMessageBy: "",
      createdAt: serverTimestamp(),
    });
  }

  return conversationId;
}

/**
 * Send a message in a conversation, optionally with media.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  media?: { mediaUrl: string; mediaType: "image" | "video" }
): Promise<void> {
  const trimmed = text.trim();
  if (!trimmed && !media) return;

  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );

  await addDoc(messagesRef, {
    text: trimmed,
    senderId,
    createdAt: serverTimestamp(),
    read: false,
    ...(media ?? {}),
  });

  // Update conversation summary
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    lastMessage: trimmed,
    lastMessageAt: serverTimestamp(),
    lastMessageBy: senderId,
  });
}

/**
 * Subscribe to real-time messages in a conversation.
 * Returns an unsubscribe function.
 */
export function subscribeToMessages(
  conversationId: string,
  callback: (messages: Message[]) => void
): () => void {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const q = query(messagesRef, orderBy("createdAt", "asc"));

  return onSnapshot(q, (snapshot) => {
    const messages: Message[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Message, "id">),
    }));
    callback(messages);
  });
}

/**
 * Get all conversations for a user, ordered by most recent message.
 */
export async function getConversations(userId: string): Promise<Conversation[]> {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
    limit(50)
  );

  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<Conversation, "id">),
  }));
}

/**
 * Subscribe to conversations list in real-time.
 */
export function subscribeToConversations(
  userId: string,
  callback: (conversations: Conversation[]) => void
): () => void {
  const conversationsRef = collection(db, "conversations");
  const q = query(
    conversationsRef,
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc"),
    limit(50)
  );

  return onSnapshot(q, (snapshot) => {
    const conversations: Conversation[] = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Conversation, "id">),
    }));
    callback(conversations);
  });
}

/**
 * Toggle a reaction emoji on a message.
 * If the user already reacted with that emoji it is removed, otherwise added.
 */
export async function toggleReaction(
  conversationId: string,
  messageId: string,
  emoji: string,
  userId: string
): Promise<void> {
  const messageRef = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );

  const snap = await getDoc(messageRef);
  if (!snap.exists()) return;

  const existing: string[] = snap.data()?.reactions?.[emoji] ?? [];
  const alreadyReacted = existing.includes(userId);

  await updateDoc(messageRef, {
    [`reactions.${emoji}`]: alreadyReacted
      ? arrayRemove(userId)
      : arrayUnion(userId),
  });
}

/**
 * Mark all unread messages in a conversation as read for a given user.
 */
export async function markMessagesAsRead(
  conversationId: string,
  userId: string
): Promise<void> {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const q = query(messagesRef, where("read", "==", false));
  const snapshot = await getDocs(q);

  const updates = snapshot.docs
    .filter((doc) => doc.data().senderId !== userId)
    .map((doc) => updateDoc(doc.ref, { read: true }));

  await Promise.all(updates);
}

/**
 * Update the title of a conversation.
 */
export async function updateConversationTitle(
  conversationId: string,
  title: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, { title: title.trim() });
}

/**
 * Delete a conversation and all its messages.
 */
export async function deleteConversation(
  conversationId: string
): Promise<void> {
  const messagesRef = collection(
    db,
    "conversations",
    conversationId,
    "messages"
  );
  const snapshot = await getDocs(messagesRef);

  // Delete all messages in the conversation
  const deletePromises = snapshot.docs.map((doc) => {
    return deleteDoc(doc.ref);
  });

  await Promise.all(deletePromises);

  // Delete the conversation itself
  const conversationRef = doc(db, "conversations", conversationId);
  await deleteDoc(conversationRef);
}

/**
 * Add a participant to an existing conversation.
 */
export async function addParticipantToConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, { participants: arrayUnion(userId) });
}

/**
 * Remove a participant from an existing conversation.
 */
export async function removeParticipantFromConversation(
  conversationId: string,
  userId: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, { participants: arrayRemove(userId) });
}

