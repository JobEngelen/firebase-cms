// /lib/firebase.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyA6ap1SaMNnOG7AnlwhVyjWcOGMJ2Hugnw",
  authDomain: "skinpoint-nl.firebaseapp.com",
  projectId: "skinpoint-nl",
  storageBucket: "skinpoint-nl.firebasestorage.app",
  messagingSenderId: "776540962701",
  appId: "1:776540962701:web:3eee3c07efd852fc5e87c4",
  measurementId: "G-KVZ2FYGS7F"
};

// Initialize Firebase Client SDK
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

export { app, db, auth, storage };