
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyAVImMlQtPzJ082140hYOZEw0JroUFDA5U",
  authDomain: "goalgetter-ai-xel7l.firebaseapp.com",
  projectId: "goalgetter-ai-xel7l",
  storageBucket: "goalgetter-ai-xel7l.firebasestorage.app",
  messagingSenderId: "379900622497",
  appId: "1:379900622497:web:68cc4aef921bcb6c1be2e0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
