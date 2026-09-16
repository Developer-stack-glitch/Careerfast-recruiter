'use client';
// src/firebase/fireBase.js
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyA2rXuLi_kgfth-sGZnhM-xm-GUuo9Y0aE",
  authDomain: "careerfastjobportal.firebaseapp.com",
  projectId: "careerfastjobportal",
  storageBucket: "careerfastjobportal.firebasestorage.app",
  messagingSenderId: "130499988544",
  appId: "1:130499988544:web:52699b5654802be3d3a3a5",
  measurementId: "G-YX6Y57X00W"
};

const app = initializeApp(firebaseConfig);

// ✅ EXPORT messaging with client-side check
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
    const token = await getToken(messaging, {
      vapidKey:
        "BJ5NJwYWpuRGKS7KXzqSW-80m_9p8QrDdLcv4PV8TEsgcuonquxhnYE5PTq8z9Cwg7qHGStNp1RyW3pz-6r7i9E",
    });
    return token;
  } catch (err) {
    // Only log if it's not a permission error (redundant but safe)
    if (err.code !== 'messaging/permission-blocked') {
      console.error("❌ Error getting FCM token", err);
    }
    return null;
  }
};
