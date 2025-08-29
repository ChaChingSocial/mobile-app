import { app } from "@/config/firebase";
import { collection, doc, getDoc, getDocs, getFirestore } from "firebase/firestore";

const db = getFirestore(app);

export async function getAllCommunities() {
  try {
    const snapshot = await getDocs(collection(db, "communities"));

    return snapshot.docs.map((communityDoc) => ({
      id: communityDoc.id,
      data: communityDoc.data(),
    }));
  } catch (error) {
    console.error("Error fetching communities:", error);
    throw error;
  }
}
// get single community information by its id from URL query parameters
export async function getSingleCommunityById(communityId: string) {
  try {
    if (communityId) {
      const docRef = doc(db, "communities", communityId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const communityData = docSnap.data();
        return { id: docSnap.id, ...communityData };
      }
      return null;
    }
  } catch (error) {
    console.error("Error fetching community by ID:", error);
    throw error;
  }
  return null;
}

// get single community information by its slug from URL query parameters
export async function getSingleCommunityBySlug(communitySlug: string) {
  try {
    if (communitySlug) {
      const snapshot = await getDocs(collection(db, "communities"));
      const communityDoc = snapshot.docs.find(
        (doc) => doc.data().slug === communitySlug
      );

      if (communityDoc) {
        return { id: communityDoc.id, ...communityDoc.data() };
      }
      return null;
    }
  } catch (error) {
    console.error("Error fetching community by slug:", error);
    throw error;
  }
  return null;
}
