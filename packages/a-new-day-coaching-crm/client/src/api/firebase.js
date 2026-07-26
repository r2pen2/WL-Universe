// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { User } from "./db/dbUser.ts";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCYXvgJgtimrTD19uu6CDCdO_JkD48fD_0",
  authDomain: "a-new-day-coaching.firebaseapp.com",
  projectId: "a-new-day-coaching",
  storageBucket: "a-new-day-coaching.appspot.com",
  messagingSenderId: "528674261946",
  appId: "1:528674261946:web:f3f79d14e8a1a98e0deb83",
  measurementId: "G-86B0CB21Q3"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const analytics = getAnalytics(app);
export const db = getFirestore(app);
export const auth = getAuth(app);

/** 
 * Return the current user's details
 * @param {Function} setter - React setState function 
 * */
export async function getCurrentUser(setter, colorSchemeSetter) {
  auth.onAuthStateChanged(async (user) => {
    if (user) {
      const userObject = new User(user);
      await userObject.createDocument();
      userObject.subscribe(setter, colorSchemeSetter)
    } else {
      setter({id: null})
    }
  });
}