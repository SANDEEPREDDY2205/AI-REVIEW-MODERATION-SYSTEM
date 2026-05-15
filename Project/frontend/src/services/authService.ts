import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { auth, db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

// SIGN UP
export async function signUp(email: string, password: string, fullName: string) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);

  // update display name
  if (auth.currentUser) {
    await updateProfile(auth.currentUser, {
      displayName: fullName,
    });
  }

  // store user in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    uid: userCredential.user.uid,
    email,
    fullName,
    createdAt: serverTimestamp(),
  });

  return userCredential;
}

// SIGN IN
export async function signIn(email: string, password: string) {
  return await signInWithEmailAndPassword(auth, email, password);
}

// LOGOUT
export async function logOut() {
  return await signOut(auth);
}