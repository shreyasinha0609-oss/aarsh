import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDJ9C0J4Lw8BBBoLeahdgLJpid0-ra5eBc",
  authDomain: "aarsh-live.firebaseapp.com",
  projectId: "aarsh-live",
  storageBucket: "aarsh-live.firebasestorage.app",
  messagingSenderId: "1097084173712",
  appId: "1:1097084173712:web:d7d5366f92b0b9483c0715",
  measurementId: "G-CBD3D7ZF06"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);