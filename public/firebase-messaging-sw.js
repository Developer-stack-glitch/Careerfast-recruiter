/* global importScripts, firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.11/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.6.11/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyA2rXuLi_kgfth-sGZnhM-xm-GUuo9Y0aE",
  authDomain: "careerfastjobportal.firebaseapp.com",
  projectId: "careerfastjobportal",
  storageBucket: "careerfastjobportal.firebasestorage.app",
  messagingSenderId: "130499988544",
  appId: "1:130499988544:web:52699b5654802be3d3a3a5",
  measurementId: "G-YX6Y57X00W"
});

const messaging = firebase.messaging();

// Create a broadcast channel for cross-tab communication
const channel = new BroadcastChannel('careerfast-notifications');
const shownNotifications = new Set();

messaging.onBackgroundMessage((payload) => {
  console.log("📩 Background message received:", payload);

  const { title, body, icon } = payload.notification || {};
  const click_action =
    payload?.fcmOptions?.link ||
    payload?.data?.click_action ||
    "https://careerfast.in/job-portal";

  // Create a unique ID for this notification
  const notificationId = `${title}-${body}`;

  // Check if we've already shown this notification
  if (shownNotifications.has(notificationId)) {
    console.log("⏭️ Skipping duplicate notification");
    return;
  }

  // Mark as shown
  shownNotifications.add(notificationId);

  // Broadcast to other tabs that we're showing this notification
  channel.postMessage({ type: 'notification-shown', id: notificationId });

  // Clean up after 5 seconds
  setTimeout(() => {
    shownNotifications.delete(notificationId);
  }, 5000);

  // Use a consistent tag based on the message content
  const notificationTag = notificationId.replace(/\s+/g, '-').toLowerCase();

  self.registration.showNotification(title || "CareerFast", {
    body: body || "",
    icon: icon || "/favicon.png",
    tag: notificationTag,
    renotify: false,
    data: { click_action },
  });
});

// Listen for notifications shown by other tabs
channel.onmessage = (event) => {
  if (event.data.type === 'notification-shown') {
    shownNotifications.add(event.data.id);
    // Clean up after 5 seconds
    setTimeout(() => {
      shownNotifications.delete(event.data.id);
    }, 5000);
  }
};

// 🔹 Handle click on notification
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = event.notification.data?.click_action || "https://careerfast.in";
  event.waitUntil(clients.openWindow(url));
});
