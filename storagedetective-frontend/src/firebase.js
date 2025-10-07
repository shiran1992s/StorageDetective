import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration from your project settings
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
console.log("Initializing Firebase app...");
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
console.log("Firebase services initializing...");
const auth = getAuth(app);

// By default, getFirestore() connects to the '(default)' database.
// To connect to a specific, non-default database, you would pass its ID as the second argument.
// For example: const db = getFirestore(app, "figma-to-code-db1");
const db = getFirestore(app, "storage-detective-db-1");
const storage = getStorage(app);
const googleProvider = new GoogleAuthProvider();
console.log("Firebase services initialized successfully.");

export {
    auth,
    db,
	storage,
    googleProvider,
    signInWithPopup,
    onAuthStateChanged,
    signOut
};