// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCMQEV-7vQOvf6TFcc187d6V0L0FEzlN0w",
  authDomain: "airiga.firebaseapp.com",
  projectId: "airiga",
  storageBucket: "airiga.appspot.com",
  messagingSenderId: "331803235933",
  appId: "1:331803235933:web:ec36bbf0d268a9ed86dfb4"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app)
export {auth, db };

