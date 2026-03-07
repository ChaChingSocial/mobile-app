import { app } from "@/config/firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  addDoc,
  query,
  orderBy,
} from "firebase/firestore";

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

// ─── Community contributions ────────────────────────────────────────────────

export interface CommunityContributionInput {
  userId: string;
  displayName: string;
  profilePic: string | null;
  amount: number;
  asset: "SOL" | "USDC";
  transactionId: string;
  network: "mainnet-beta" | "devnet";
  status: "COMPLETED";
  date: string; // ISO string
}

export interface CommunityContributor {
  userId: string;
  displayName: string;
  profilePic: string | null;
  totalAmount: number;
  asset: string;
}

/**
 * Persist a completed on-chain contribution to a community's
 * `paidContributions` sub-collection so it can be displayed to other users.
 */
export async function addCommunityPaidContribution(
  communityId: string,
  contribution: CommunityContributionInput
): Promise<void> {
  const colRef = collection(
    db,
    "communities",
    communityId,
    "paidContributions"
  );
  await addDoc(colRef, contribution);
}

/**
 * Fetch all contributors for a community, aggregated by userId.
 * Returns the most recent contributor first.
 */
export async function getCommunityContributors(
  communityId: string
): Promise<CommunityContributor[]> {
  try {
    const colRef = collection(
      db,
      "communities",
      communityId,
      "paidContributions"
    );
    const snapshot = await getDocs(query(colRef, orderBy("date", "desc")));

    // Aggregate amounts per unique user
    const map = new Map<string, CommunityContributor>();
    for (const d of snapshot.docs) {
      const data = d.data() as CommunityContributionInput;
      const key = data.userId || "anonymous";
      const prev = map.get(key);
      if (prev) {
        map.set(key, {
          ...prev,
          totalAmount: prev.totalAmount + (data.amount ?? 0),
        });
      } else {
        map.set(key, {
          userId: data.userId ?? "anonymous",
          displayName: data.displayName ?? "Anonymous",
          profilePic: data.profilePic ?? null,
          totalAmount: data.amount ?? 0,
          asset: data.asset ?? "SOL",
        });
      }
    }

    return Array.from(map.values());
  } catch (error) {
    console.error("Error fetching community contributors:", error);
    return [];
  }
}
