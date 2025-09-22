import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";

export async function loginWithEmail(
  email: string,
  password: string,
) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const { user } = userCredential;
  // const tokenResult = await user.getIdTokenResult();

  return user;
}

export async function registerWithEmail(email: string, password: string) {
  const userCredential = await createUserWithEmailAndPassword(
    auth,
    email,
    password
  );
  const { user } = userCredential;
  const tokenResult = await user.getIdTokenResult();
  console.log("register token", user, tokenResult);

  return user;
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password: ", error);
  }
}

const res = {
  address: {
    address: undefined,
    address2: undefined,
    city: undefined,
    country: undefined,
    state: undefined,
    zipCode: undefined,
  },
  backgroundPic:
    "https://firebasestorage.googleapis.com/v0/b/guap-social.appspot.com/o/profile-bg-pictures%2FCityMountain.jpeg?alt=media&token=8637b331-504e-452c-97bd-9f09101fa18b",
  bio: "Liver of life",
  city: undefined,
  createdAt: { postedTime: "0001-01-01T00:00:00.000Z" },
  email: "sonylomo2@gmail.com",
  finfluencer: true,
  id: "QEen0tAjEKcBXDIuTIGTA46tnd53",
  industry: undefined,
  interests: [
    "Computer Science",
    "Technology",
    "Personal Finance",
    "Entrepreneurship",
    "Business",
  ],
  modifiedAt: { postedTime: "0001-01-01T00:00:00.000Z" },
  moneyPersonality: undefined,
  profilePic:
    "https://lh3.googleusercontent.com/a/ACg8ocK5Ljdj-PGiSm2K0yZcb5tC5dy5jAMAedsgf-KiTl6pCmxsY4o=s96-c",
  socials: {
    discord: undefined,
    facebook: undefined,
    instagram: undefined,
    linkedin: undefined,
    medium: undefined,
    snapchat: undefined,
    tiktok: undefined,
    twitch: undefined,
    twitter: undefined,
    userId: undefined,
    website: undefined,
    website2: undefined,
    website3: undefined,
    youtube: undefined,
  },
  status: undefined,
  subscribePrice: undefined,
  timezone: undefined,
  username: "smooth-operator",
};
