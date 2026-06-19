// Shared Firebase initialisation. Auth + Firestore + Storage.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCQ78AMirYEiUo5JMhH29iYjvOF8XzV4T4",
  authDomain: "newco-ihc.firebaseapp.com",
  projectId: "newco-ihc",
  storageBucket: "newco-ihc.firebasestorage.app",
  messagingSenderId: "1092602103003",
  appId: "1:1092602103003:web:c3b35376eac807c4d5b8fe",
  measurementId: "G-GE1JXHR4YP",
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
