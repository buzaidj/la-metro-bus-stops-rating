// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";

// TODO: Add SDKs for Firebase products that you want to use

// https://firebase.google.com/docs/web/setup#available-libraries


// Your web app's Firebase configuration

const firebaseConfig = {

  apiKey: "AIzaSyCXUjdWaqbWfK_xnnzReopzI4xfGv6qHmo",

  authDomain: "buzzy-bus-stops.firebaseapp.com",

  projectId: "buzzy-bus-stops",

  storageBucket: "buzzy-bus-stops.appspot.com",

  messagingSenderId: "107560733802",

  appId: "1:107560733802:web:a7e43d45d4c72ea48d4e13"

};


// Initialize Firebase

export const firebaseApp = initializeApp(firebaseConfig);

export const firebaseFunctions = getFunctions(firebaseApp);

export const db = getFirestore(firebaseApp);

export const realtimeDb = getDatabase(firebaseApp);