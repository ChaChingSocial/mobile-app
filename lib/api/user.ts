
import {
  collection,
  getFirestore,
  doc,
  setDoc,
  getDocs,
  getDoc,
  deleteDoc,
  collectionGroup,
  addDoc,
} from "firebase/firestore";
import { UserPreference } from "@/types/user";
import { useSession } from "../providers/AuthContext";
import { app } from "@/config/firebase";

const db = getFirestore(app);

async function updateUserPreferences(preferences: UserPreference) {
  const { session: user } = useSession();

  if (!user) {
    throw new Error("User is not authenticated");
  }

  const userId = user.uid;
  const userPreferencesDocRef = doc(db, "users", userId, "profile", userId);

  try {
    await setDoc(userPreferencesDocRef, { ...preferences, userId });
  } catch (error) {
    console.error("Error updating user preferences:", error);
  }
  return preferences;
}

async function getUserPreferences(userId: string) {
  if (userId) {
    const userPreferenceRef = doc(db, "users", userId, "profile", userId);
    const userPreference = await getDoc(userPreferenceRef);

    return userPreference.data();
  }
}

export const getUserProfile = async (userId: string) => {
  try {
    // Create a reference to the user document within the "users" collection
    const userDocRef = doc(db, "users", userId, "profile", userId);
    // Fetch the document
    const userDoc = await getDoc(userDocRef);

    // Check if the document exists
    if (userDoc.exists()) {
      // Return the user's profile data
      return userDoc.data();
    }
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return null;
  }
};

const fetchAllUserDisplayNames = async () => {
  try {
    const profiles = await getDocs(collectionGroup(db, "profile"));

    const users = profiles.docs
      .map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          displayName: data.displayName,
        };
      })
      .filter(
        (user) => user.displayName !== undefined && user.displayName !== ""
      );

    return users;
  } catch (error) {
    console.error("Error fetching user display names:", error);
    return [];
  }
};

async function followUser(userId: string, followerId: string) {
  const userDoc = doc(db, "users", userId, "followers", followerId);
  const followerDoc = doc(db, "users", followerId, "following", userId);

  try {
    await setDoc(userDoc, { followerId });
    await setDoc(followerDoc, { userId });

    return true;
  } catch (error) {
    console.error("Error writing document:", error);
    return false;
  }
}

async function unfollowUser(userId: string, followerId: string) {
  const followerDoc = doc(db, "users", userId, "followers", followerId);
  const followingDoc = doc(db, "users", followerId, "following", userId);

  await deleteDoc(followerDoc);
  await deleteDoc(followingDoc);

  return true;
}

async function fetchFollowers(userId: string) {
  return getDocs(collection(db, "users", userId, "followers"));
}

async function fetchFollowing(userId: string) {
  return getDocs(collection(db, "users", userId, "following"));
}

async function isFollowing(userId: string, followerId: string) {
  if (userId && followerId) {
    try {
      const docSnap = await getDoc(
        doc(db, "users", userId, "followers", followerId)
      );
      return docSnap.exists();
    } catch (error) {
      console.error("Error checking if user is following:", error);
      throw error;
    }
  }
  return false;
}

async function getAllFollowerNamesIds(userId: string) {
  try {
    const followersSnapshot = await getDocs(
      collection(db, "users", userId, "following")
    );
    const userIds = followersSnapshot.docs.map((doc) => doc.id);

    if (userIds.length === 0) {
      return [];
    }

    const followers = await Promise.all(
      userIds.map(async (followerId) => {
        const userProfileDoc = await getDoc(
          doc(db, "users", followerId, "profile", followerId)
        );
        if (userProfileDoc.exists()) {
          const userProfile = userProfileDoc.data();
          return { id: followerId, displayName: userProfile.displayName };
        }
        return null;
      })
    );

    return followers.filter((follower) => follower !== null);
  } catch (error) {
    console.error("Error fetching followers:", error);
    throw error;
  }
}

interface UserProfile {
  // Define the structure of a user profile based on your data
  bio: string;
  displayName: string;
  interests: string[];
  photoURL: string;
  userId: string;
}

async function getAllUsers(): Promise<UserProfile[]> {
  try {
    const profiles = await getDocs(collectionGroup(db, "profile"));
    return profiles.docs
      .map((doc) => doc.data() as UserProfile)
      .filter((user) => !!user.displayName);
  } catch (error) {
    console.error("Error fetching user profiles:", error);
    return [];
  }
}

async function fetchAllUsernames() {
  try {
    const usersCollectionRef = collection(db, "users");
    const usersSnapshot = await getDocs(usersCollectionRef);

    if (usersSnapshot.empty) {
      return [];
    }

    const usernames:string[] = [];
    usersSnapshot.forEach((doc) => {
      const userData = doc.data();
      if (userData.displayName) {
        usernames.push(userData.displayName); // Add the displayName to the array
      }
    });

    return usernames;
  } catch (error) {
    console.error("Error fetching usernames: ", error);
    return [];
  }
}

async function updateBackgroundImage(userId: string, backgroundImage: string) {
  try {
    const userDocRef = doc(db, "users", userId, "profile", userId);
    await setDoc(userDocRef, { backgroundImage }, { merge: true });
    return backgroundImage;
  } catch (error) {
    console.error("Error updating background image:", error);
    throw error;
  }
}

async function checkIfFinFluencer(userId: string) {
  try {
    const userDocRef = doc(db, "users", userId, "profile", userId);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
      const user = userDoc.data();
      return user.finfluencer;
    }
    return false;
  } catch (error) {
    console.error("Error checking if user is an influencer:", error);
    throw error;
  }
}

// async function checkIfFinFluencer(userId: string) {
//   try {
//     const userDocRef = doc(db, "users", userId);
//     const userDoc = await getDoc(userDocRef);

//     if (!userDoc.exists()) return false;

//     // Case 1: Profile is a field
//     if (userDoc.data().profile) {
//       return userDoc.data().profile.finfluencer || false;
//     }

//     // Case 2: Profile is a subcollection
//     const profileRef = doc(db, "users", userId, "profile", userId);
//     const profileDoc = await getDoc(profileRef);
//     return profileDoc.exists() && profileDoc.data().finfluencer;
//   } catch (error) {
//     console.error("Error checking if user is an influencer:", error);
//     throw error;
//   }
// }

async function saveUserSettings(
  userId: string,
  settings: { [key: string]: boolean }
) {
  try {
    const userSettingsDocRef = doc(db, "users", userId, "settings", "profile");
    await setDoc(userSettingsDocRef, settings);
  } catch (error) {
    console.error("Error saving user settings:", error);
    throw error;
  }
}

async function fetchUserSettings(userId: string) {
  try {
    const userSettingsDocRef = doc(db, "users", userId, "settings", "profile");
    const userSettingsDoc = await getDoc(userSettingsDocRef);

    if (userSettingsDoc.exists()) {
      return userSettingsDoc.data();
    }
    return {};
  } catch (error) {
    console.error("Error fetching user settings:", error);
    throw error;
  }
}

async function sendEmailInvites(emails: string[], userName: string) {
  const url =
    "https://chachingsocial-20694693160.us-central1.run.app/notifications/notify-email";
  const headers = {
    accept: "application/json",
    "Content-Type": "application/json",
  };
  const body = JSON.stringify({
    emails,
    notificationType: "INVITE",
    notificationMessage: userName,
    entityType: "USER",
  });

  console.log("Sending email invites:", body);
  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log("Notification sent successfully:", data);
  } catch (error) {
    console.error("Error sending notification:", error);
  }
}

async function blockUser(
  userId: string,
  blockedUserId: string,
  reason?: string,
  abuseReportId?: string
) {
  const blockedUserDoc = doc(db, "users", userId, "blockedUsers", blockedUserId);
  const blockedByDoc = doc(db, "users", blockedUserId, "blockedBy", userId);

  try {
    const blockData = {
      userId: blockedUserId,
      blockedAt: new Date(),
      ...(reason && { reason }),
      ...(abuseReportId && { abuseReportId }),
    };

    await setDoc(blockedUserDoc, blockData);
    await setDoc(blockedByDoc, { userId, blockedAt: new Date() });

    return true;
  } catch (error) {
    console.error("Error blocking user:", error);
    return false;
  }
}

async function unblockUser(userId: string, blockedUserId: string) {
  const blockedUserDoc = doc(db, "users", userId, "blockedUsers", blockedUserId);
  const blockedByDoc = doc(db, "users", blockedUserId, "blockedBy", userId);

  try {
    await deleteDoc(blockedUserDoc);
    await deleteDoc(blockedByDoc);
    return true;
  } catch (error) {
    console.error("Error unblocking user:", error);
    return false;
  }
}

async function isUserBlocked(userId: string, targetUserId: string) {
  try {
    const docSnap = await getDoc(
      doc(db, "users", userId, "blockedUsers", targetUserId)
    );
    return docSnap.exists();
  } catch (error) {
    console.error("Error checking if user is blocked:", error);
    return false;
  }
}

async function getBlockedUsers(userId: string) {
  try {
    const snapshot = await getDocs(
      collection(db, "users", userId, "blockedUsers")
    );
    return snapshot.docs.map((doc) => doc.id);
  } catch (error) {
    console.error("Error fetching blocked users:", error);
    return [];
  }
}

async function createAbuseReport(
  reporterId: string,
  reportedUserId: string,
  reason: string,
  reportedPostId?: string,
  evidence?: string
) {
  try {
    const abuseReportRef = collection(db, "abuseReports");
    const docRef = await addDoc(abuseReportRef, {
      reporterId,
      reportedUserId,
      reason,
      createdAt: new Date(),
      status: "pending",
      ...(reportedPostId && { reportedPostId }),
      ...(evidence && { evidence }),
    });

    console.log("Abuse report created with ID:", docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("Error creating abuse report:", error);
    throw error;
  }
}

export {
  updateUserPreferences,
  getAllUsers,
  getUserPreferences,
  followUser,
  unfollowUser,
  fetchFollowers,
  fetchFollowing,
  fetchUserSettings,
  isFollowing,
  getAllFollowerNamesIds,
  fetchAllUsernames,
  fetchAllUserDisplayNames,
  updateBackgroundImage,
  checkIfFinFluencer,
  saveUserSettings,
  sendEmailInvites,
  blockUser,
  unblockUser,
  isUserBlocked,
  getBlockedUsers,
  createAbuseReport,
};
