import { auth } from "@/config/firebase";
import {
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import Toast from "react-native-toast-message";

export async function loginWithEmail(email: string, password: string) {
  const userCredential = await signInWithEmailAndPassword(
    auth,
    email,
    password
  );
  const { user } = userCredential;

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

  await sendEmailVerification(userCredential.user)
    .then(() => {
      console.log("Email verification sent.");
      Toast.show({
        type: "success",
        text1: "Verification Email Sent",
        text2: "Please check your email to verify your account.",
      });
    })
    .catch((err) => console.log(err));

  return user;
}

export async function resetPassword(email: string) {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error("Error resetting password: ", error);
  }
}
