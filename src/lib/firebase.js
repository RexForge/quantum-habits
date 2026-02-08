import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getStorage } from 'firebase/storage';

// TODO: Replace the following with your app's Firebase project configuration
// You can get this from the Firebase Console > Project Settings > General > Your apps
// IMPORTANT: Add your Realtime Database URL after creating the database
const firebaseConfig = {
    apiKey: "AIzaSyClC15MQc_m0WZVAYFVwcmlXpcBdqsQg0s",
    authDomain: "quantumhabits.firebaseapp.com",
    projectId: "quantumhabits",
    storageBucket: "quantumhabits.firebasestorage.app",
    messagingSenderId: "124929410484",
    appId: "1:124929410484:android:2db67cbc097dc3739edee1",
    // Realtime Database URL
    databaseURL: "https://quantumhabits-default-rtdb.firebaseio.com/"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getDatabase(app); // Realtime Database instead of Firestore
export const storage = getStorage(app);

// Realtime Database has offline persistence enabled by default
// No additional setup needed
