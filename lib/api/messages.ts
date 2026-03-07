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
  increment,
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
  replyToId?: string;                   // ID of the message being replied to
  replyToText?: string;                 // Quoted text snippet
  replyToSenderName?: string;           // Display name of quoted sender
}

/** Per-sender budget stored on the conversation document. */
export interface MessageBudget {
  messagesRemaining: number;
  pricePerMsg: number;      // USDC per message (e.g. 0.10)
  totalPaid: number;        // cumulative USDC paid across all top-ups
  txSignature: string;      // signature of the most recent top-up tx
  lastTopUpAt: Timestamp | null;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastMessageAt: Timestamp | null;
  lastMessageBy: string;
  unreadCounts?: Record<string, number>; // { userId: unreadCount }
  title?: string; // Custom title for the conversation
  budgets?: Record<string, MessageBudget>; // senderId → remaining budget
  gradient?: string | null; // Optional gradient name for conversation background
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
 * Create a new group conversation with a custom title and multiple participants.
 * Returns the new conversation ID.
 */
export async function createGroupConversation(
  creatorId: string,
  participantIds: string[],
  title: string
): Promise<string> {
  const allParticipants = Array.from(new Set([creatorId, ...participantIds]));
  const conversationRef = await addDoc(collection(db, "conversations"), {
    participants: allParticipants,
    title: title.trim() || null,
    lastMessage: "",
    lastMessageAt: serverTimestamp(),
    lastMessageBy: "",
    createdAt: serverTimestamp(),
  });
  return conversationRef.id;
}

/**
 * Send a message in a conversation, optionally with media and/or a reply reference.
 */
export async function sendMessage(
  conversationId: string,
  senderId: string,
  text: string,
  media?: { mediaUrl: string; mediaType: "image" | "video" },
  reply?: { replyToId: string; replyToText: string; replyToSenderName: string }
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
    ...(reply ?? {}),
  });

  // Update conversation summary + increment unread counts for other participants
  const conversationRef = doc(db, "conversations", conversationId);
  const convSnap = await getDoc(conversationRef);

  const updateData: Record<string, any> = {
    lastMessage: trimmed || (media ? `[${media.mediaType}]` : ""),
    lastMessageAt: serverTimestamp(),
    lastMessageBy: senderId,
  };

  if (convSnap.exists()) {
    const participants: string[] = convSnap.data().participants ?? [];
    participants.forEach((pid) => {
      if (pid !== senderId) {
        updateData[`unreadCounts.${pid}`] = increment(1);
      }
    });
  }

  await updateDoc(conversationRef, updateData);
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

  // Reset unread count for this user in the conversation
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, { [`unreadCounts.${userId}`]: 0 });
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
 * Update the gradient (appearance) of a conversation.
 */
export async function updateConversationGradient(
  conversationId: string,
  gradientName: string | null
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, { gradient: gradientName });
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
 * Delete a single message from a conversation.
 * Only the sender should call this.
 */
export async function deleteMessage(
  conversationId: string,
  messageId: string
): Promise<void> {
  const messageRef = doc(
    db,
    "conversations",
    conversationId,
    "messages",
    messageId
  );
  await deleteDoc(messageRef);
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

/**
 * Subscribe to the total unread message count across all conversations for a user.
 * Returns an unsubscribe function.
 */
export function subscribeToTotalUnreadCount(
  userId: string,
  callback: (count: number) => void
): () => void {
  return subscribeToConversations(userId, (conversations) => {
    const total = conversations.reduce((sum, conv) => {
      return sum + (conv.unreadCounts?.[userId] ?? 0);
    }, 0);
    callback(total);
  });
}

/**
 * Add (or initially create) a message budget for a sender in a conversation.
 * Uses Firestore increment so it safely handles both first-time setup and top-ups.
 */
export async function topUpMessageBudget(
  conversationId: string,
  senderId: string,
  addMessages: number,
  pricePerMsg: number,
  addTotalPaid: number,
  txSignature: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    [`budgets.${senderId}.messagesRemaining`]: increment(addMessages),
    [`budgets.${senderId}.totalPaid`]: increment(addTotalPaid),
    [`budgets.${senderId}.pricePerMsg`]: pricePerMsg,
    [`budgets.${senderId}.txSignature`]: txSignature,
    [`budgets.${senderId}.lastTopUpAt`]: serverTimestamp(),
  });
}

/**
 * Decrement a sender's remaining message count by 1.
 * Call this after every successfully sent message in a priced conversation.
 */
export async function decrementMessageBudget(
  conversationId: string,
  senderId: string
): Promise<void> {
  const conversationRef = doc(db, "conversations", conversationId);
  await updateDoc(conversationRef, {
    [`budgets.${senderId}.messagesRemaining`]: increment(-1),
  });
}

/**
 * Read the current budget for a sender in a conversation (one-time fetch).
 */
export async function getMessageBudget(
  conversationId: string,
  senderId: string
): Promise<MessageBudget | null> {
  const conversationRef = doc(db, "conversations", conversationId);
  const snap = await getDoc(conversationRef);
  if (!snap.exists()) return null;
  const data = snap.data();
  return (data.budgets?.[senderId] as MessageBudget) ?? null;
}

/** A single earning entry — one sender paid into a conversation with this user. */
export interface MessageEarning {
  conversationId: string;
  senderId: string;
  totalPaid: number;       // cumulative USDC paid by this sender
  pricePerMsg: number;
  lastTopUpAt: Timestamp | null;
}

/**
 * Fetch all USDC message earnings for a recipient user.
 * Scans all conversations the user participates in and collects
 * budget entries from *other* senders who have paid to message them.
 */
export async function getMessageEarnings(
  userId: string
): Promise<MessageEarning[]> {
  const conversations = await getConversations(userId);
  const earnings: MessageEarning[] = [];

  for (const conv of conversations) {
    if (!conv.budgets) continue;
    for (const [senderId, budget] of Object.entries(conv.budgets)) {
      if (senderId === userId) continue; // skip budgets the user themselves created
      const b = budget as MessageBudget;
      if (b.totalPaid > 0) {
        earnings.push({
          conversationId: conv.id,
          senderId,
          totalPaid: b.totalPaid,
          pricePerMsg: b.pricePerMsg,
          lastTopUpAt: b.lastTopUpAt,
        });
      }
    }
  }

  return earnings;
}

