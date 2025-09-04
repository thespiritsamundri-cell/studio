// src/lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// TODO: PASTE YOUR FIREBASE CONFIGURATION OBJECT HERE
const firebaseConfig = {
  "projectId": "educentral-mxfgr",
  "appId": "1:93439797301:web:c0cd1d46e7588e4df4297c",
  "storageBucket": "educentral-mxfgr.firebasestorage.app",
  "apiKey": "AIzaSyAtnV9kiSJ-NFLfI6pG4LDvvLcjpRh_jtM",
  "authDomain": "educentral-mxfgr.firebaseapp.com",
  "messagingSenderId": "93439797301"
};

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
const db = getFirestore(app);
const auth = getAuth(app);

export { app, db, auth };
