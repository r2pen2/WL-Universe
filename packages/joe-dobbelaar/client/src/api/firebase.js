import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyAWbFLjUXdBoarK-POQbiFFD6FT-YhdSac",
  authDomain: "wladminportal.firebaseapp.com",
  projectId: "wladminportal",
  storageBucket: "wladminportal.appspot.com",
  messagingSenderId: "76275437317",
  appId: "1:76275437317:web:d2a7ee5c7d964eb87b716c",
  measurementId: "G-61W670RMQR"
};

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);