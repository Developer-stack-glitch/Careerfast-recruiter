'use client';
// src/firebase/fireBase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyA2rXuLi_kgfth-sGZnhM-xm-GUuo9Y0aE",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "careerfastjobportal.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "careerfastjobportal",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "careerfastjobportal.firebasestorage.app",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "130499988544",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:130499988544:web:52699b5654802be3d3a3a5",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-YX6Y57X00W"
};

const app = initializeApp(firebaseConfig);

// EXPORT messaging with client-side check
export const messaging = typeof window !== "undefined" && typeof navigator !== "undefined" 
  ? getMessaging(app) 
  : null;

export const requestForToken = async () => {
  if (!messaging) return null;

  // Check for notification permission before requesting token
  if (typeof window !== 'undefined' && 'Notification' in window) {
    if (Notification.permission !== 'granted') {
      console.warn("⚠️ Notification permission not granted, skipping FCM token request.");
      return null;
    }
  }

  try {
    const vapidKey = process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY || "BJ5NJwYWpuRGKS7KXzqSW-80m_9p8QrDdLcv4PV8TEsgcuonquxhnYE5PTq8z9Cwg7qHGStNp1RyW3pz-6r7i9E";
    const token = await getToken(messaging, { vapidKey });
    return token;
  } catch (err) {
    if (err?.code !== 'messaging/permission-blocked') {
      console.error("❌ Error getting FCM token", err);
    }
    return null;
  }
};
