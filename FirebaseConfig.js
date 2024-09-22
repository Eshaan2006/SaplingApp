import { initializeApp, firebase } from "firebase/app";
import { initializeAuth, getReactNativePersistence, getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAbQJ7H6gJP5hsZAcMbjIctr4vp8NBfE4Y",
  authDomain: "sapling-ca7e2.firebaseapp.com",
  projectId: "sapling-ca7e2",
  storageBucket: "sapling-ca7e2.appspot.com",
  messagingSenderId: "825698792969",
  appId: "1:825698792969:web:4b73c432e58f9661ab6ad8",
  measurementId: "G-PF9XB33PPS"
};

// Initialize Firebase
export const FIREBASE_APP = initializeApp(firebaseConfig);
export const FIREBASE_AUTH = initializeAuth(FIREBASE_APP, {
    persistence: getReactNativePersistence(ReactNativeAsyncStorage)
});
export const FIRESTORE_DB = getFirestore(FIREBASE_APP)
