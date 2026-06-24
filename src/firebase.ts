import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAdB-fYUXYep-wFz10TwYU3udxsak2E334",
  authDomain: "long-structure-1dzmz.firebaseapp.com",
  projectId: "long-structure-1dzmz",
  storageBucket: "long-structure-1dzmz.firebasestorage.app",
  messagingSenderId: "174732278874",
  appId: "1:174732278874:web:622c2455e7112f0f32ac63"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

export { 
  signInWithPopup, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
};
