import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "TERA_API_KEY",
  authDomain: "TERA_AUTH_DOMAIN",
  projectId: "TERA_PROJECT_ID",
  storageBucket: "TERA_BUCKET",
  messagingSenderId: "TERA_SENDER_ID",
  appId: "TERA_APP_ID"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);