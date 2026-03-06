import { app } from "@/config/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  updateDoc,
} from "firebase/firestore";

const db = getFirestore(app);

export interface UserLink {
  id?: string;
  title: string;
  url: string;
  description?: string;
  image?: string | null;
  cover?: boolean;
  category?: string;
  extraLink?: string;
  extraLinkText?: string;
  order?: number;
}

/**
 * Fetch all links for a user, sorted by the order field.
 * Matches the web app's Firestore path: users/{userId}/links.
 */
export async function getUserLinks(userId: string): Promise<UserLink[]> {
  try {
    const linksRef = collection(db, "users", userId, "links");
    const snapshot = await getDocs(linksRef);
    return snapshot.docs
      .map((d) => ({ id: d.id, ...d.data() } as UserLink))
      .sort((a, b) => (a.order ?? 999) - (b.order ?? 999));
  } catch (error) {
    console.error("Error fetching user links:", error);
    return [];
  }
}

/**
 * Add a new link. Returns the new document ID.
 */
export async function addUserLink(
  userId: string,
  link: Omit<UserLink, "id">
): Promise<string> {
  const linksRef = collection(db, "users", userId, "links");
  const docRef = await addDoc(linksRef, {
    ...link,
    createdAt: new Date(),
  });
  return docRef.id;
}

/**
 * Update an existing link's fields.
 */
export async function updateUserLink(
  userId: string,
  linkId: string,
  data: Partial<UserLink>
): Promise<void> {
  const linkRef = doc(db, "users", userId, "links", linkId);
  await updateDoc(linkRef, data as Record<string, any>);
}

/**
 * Delete a link document.
 */
export async function deleteUserLink(
  userId: string,
  linkId: string
): Promise<void> {
  const linkRef = doc(db, "users", userId, "links", linkId);
  await deleteDoc(linkRef);
}
