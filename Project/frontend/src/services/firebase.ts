import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";


// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyAEOsCJHap-OnD8wLPeXYlCnh64JGAOEPs",
  authDomain: "project-1b114.firebaseapp.com",
  projectId: "project-1b114",
  storageBucket: "project-1b114.firebasestorage.app",
  messagingSenderId: "815761148545",
  appId: "1:815761148545:web:24b5955c7397b23cbe5b80",
  measurementId: "G-59X3X4SKR2",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);

export default app;