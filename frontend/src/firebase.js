// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCGD4bpMRaKHLChgPIU5BeMA21Ess60CYc",
  authDomain: "grabexpress-test.firebaseapp.com",
  projectId: "grabexpress-test",
  storageBucket: "grabexpress-test.firebasestorage.app",
  messagingSenderId: "1074513031977",
  appId: "1:1074513031977:web:3762f9047380e3b9defd38",
  measurementId: "G-P7PN6P7VVZ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Firestore Database
export const db = getFirestore(app);
