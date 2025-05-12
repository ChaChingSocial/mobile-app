import { app, auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  updateEmail,
  updatePassword,
  updateProfile,
  onAuthStateChanged,
  setPersistence,
  browserSessionPersistence,
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { useUserStore } from "../store/user";
import { userApi } from "@/config/backend";
import { useSession } from "../providers/AuthContext";

export async function loginWithEmail(
  email: string,
  password: string,
  setSession: (session: any) => void
) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  console.log("login With Email", userCredential);
  const { user } = userCredential;
  const tokenResult = await user.getIdTokenResult();
  console.log("token", user, tokenResult);
  const { token } = tokenResult;

  // Update user store
  const { setUser } = useUserStore.getState();

  setSession({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    profilePic: user.photoURL,
  });

  userApi.getUserById({ userId: user.uid }).then((res) => {
    setUser(res);
    console.log("user get user bt ID", res);
    return user;
  });
}
