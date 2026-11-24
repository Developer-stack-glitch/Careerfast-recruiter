'use client';

import { Provider } from "react-redux";
import { store } from "../Redux/store";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import { App, ConfigProvider } from "antd";
import { useEffect } from "react";
import axios from "axios";
import { requestForToken, messaging } from "../firebase/fireBase";
import { onMessage } from "firebase/messaging";

const CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "288981358654-vrhl2uqu61r1ju40blnk4ibde6sbnu47.apps.googleusercontent.com";

// Suppress specific noisy development warnings from Dev Overlay
if (typeof window !== "undefined") {
  // Auto-reload on Turbopack / Webpack ChunkLoadError to recover seamlessly from stale cache
  const handleChunkError = (errorMsg) => {
    if (
      errorMsg.includes("ChunkLoadError") ||
      errorMsg.includes("Failed to load chunk") ||
      errorMsg.includes("Loading chunk")
    ) {
      const lastReload = sessionStorage.getItem("last_chunk_reload");
      const now = Date.now();
      if (!lastReload || now - Number(lastReload) > 5000) {
        sessionStorage.setItem("last_chunk_reload", String(now));
        window.location.reload();
      }
    }
  };

  window.addEventListener("error", (event) => {
    const errorMsg = event?.message || event?.error?.message || "";
    handleChunkError(errorMsg);
  });

  window.addEventListener("unhandledrejection", (event) => {
    const reason = event?.reason?.message || String(event?.reason || "");
    handleChunkError(reason);
  });

  const originalError = console.error;
  const originalWarn = console.warn;

  console.error = (...args) => {
    const msg = args[0] ? String(args[0]) : "";
    if (
      msg.includes("FedCM get() rejects") ||
      msg.includes("[GSI_LOGGER]") ||
      msg.includes("[antd: compatible]") ||
      msg.includes("[antd: message]") ||
      msg.includes("[antd: notification]") ||
      msg.includes("src attribute") ||
      msg.includes("BillingNotEnabledMapError") ||
      msg.includes("Places API error") ||
      msg.includes("google.maps")
    ) {
      return;
    }
    originalError.apply(console, args);
  };

  console.warn = (...args) => {
    const msg = args[0] ? String(args[0]) : "";
    if (
      msg.includes("[antd: compatible]") ||
      msg.includes("[antd: message]") ||
      msg.includes("[antd: notification]") ||
      msg.includes("antd v5 support React") ||
      msg.includes("src attribute")
    ) {
      return;
    }
    originalWarn.apply(console, args);
  };
}

export function Providers({ children }) {
  useEffect(() => {
    // disable console logs in production
    if (process.env.NODE_ENV === "production") {
      console.log = () => {};
      console.debug = () => {};
      console.info = () => {};
      console.warn = () => {};
      console.error = () => {};
    }
  }, []);

  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/firebase-messaging-sw.js")
        .then(() => {})
        .catch((err) => console.error("❌ SW registration failed", err));
    }
  }, []);

  useEffect(() => {
    const initFCM = async () => {
      if (typeof window !== 'undefined' && Notification.permission !== "granted") {
        const permission = await Notification.requestPermission();
        if (permission !== "granted") {
          return;
        }
      }

      const token = await requestForToken();
      if (token) {
        const subscribedToken = localStorage.getItem("fcm_subscribed_token");
        if (subscribedToken === token) {
          return;
        }

        try {
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL;
          if (apiUrl) {
            await axios.post(`${apiUrl}/api/subscribe-topic`, { token });
            localStorage.setItem("fcm_subscribed_token", token);
          } else {
            console.warn("⚠️ API URL not configured, skipping FCM subscription");
          }
        } catch (err) {
          console.warn("⚠️ Failed to subscribe to topic (backend might be down):", err.message);
        }
      }
    };

    initFCM();
  }, []);

  useEffect(() => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        console.log("📩 Foreground message received:", payload);
      });
    }
  }, []);

  return (
    <GoogleOAuthProvider clientId={CLIENT_ID}>
      <Provider store={store}>
        <ConfigProvider
          theme={{
            token: {
              fontFamily: "'Geist', var(--font-geist), -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
            },
          }}
        >
          <App>
            {children}
          </App>
        </ConfigProvider>
        <Toaster 
          position="top-center"
          toastOptions={{
            duration: 1500,
            style: {
              background: '#fff',
              color: '#363636',
            },
          }}
        />
      </Provider>
    </GoogleOAuthProvider>
  );
}
