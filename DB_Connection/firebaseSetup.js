// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAcxbFZYSIsG8j9cSW6zcDXy1vlDbA5oDQ",
  authDomain: "civixai-48022.firebaseapp.com",
  databaseURL: "https://civixai-48022-default-rtdb.firebaseio.com",
  projectId: "civixai-48022",
  storageBucket: "civixai-48022.firebasestorage.app",
  messagingSenderId: "1019257713238",
  appId: "1:1019257713238:web:4892073b0fa10db27781f7",
  measurementId: "G-1PRBCEQC1M"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

// Test logging
console.log("Firebase initialized successfully!");
console.log("Project ID:", firebaseConfig.projectId);
console.log("App:", app);