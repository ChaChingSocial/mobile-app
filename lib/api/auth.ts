import { userApi } from "@/config/backend";
import { auth } from "@/config/firebase";
import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useUserStore } from "../store/user";

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
  // const { token } = tokenResult;
  setSession({
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    profilePic: user.photoURL,
  });
  // Update user store
  const { setUser } = useUserStore.getState();

  await userApi.getUserById({ userId: user.uid }).then((res) => {
    setUser(res);
    setSession({
      uid: res.id,
      email: res.email,
      displayName: res.username,
      profilePic: res.profilePic,
    });
    console.log("user get user but ni ID", res);
    return user;
  });
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password: ", error);
  }
}
