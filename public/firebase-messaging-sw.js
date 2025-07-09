importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.13.2/firebase-messaging-compat.js');

console.log("Service Worker: initializing...");

(async () => {
  try {
    const firebaseConfig = {
      apiKey: "AIzaSyBF7DIyylS8ByVbXxdmnmLkKpLyXSdEbQA",
      authDomain: "ableai-mvp.firebaseapp.com",
      projectId: "ableai-mvp",
      storageBucket: "ableai-mvp.firebasestorage.app",
      messagingSenderId: "697522507372",
      appId: "1:697522507372:web:7ce039897f0e597d4d9249"
    };

    firebase.initializeApp(firebaseConfig);
    console.log("Service Worker: Firebase initialized", firebase);

    const messaging = firebase.messaging();
    console.log("Service Worker: Messaging initialized", messaging);

    messaging.onBackgroundMessage((payload) => {
      console.log("[SW] 🎯 Background message received:", payload);

      if (!payload?.notification) {
        console.warn("[SW] ⚠️ payload.notification not found");
        return;
      }

      const { title, body, icon } = payload.notification;
      const notificationTitle = title || "📬 Notification";
      const notificationOptions = {
        body: body || "New message",
        icon: icon || "/icon.png",
        data: {
          url: payload.fcmOptions?.link || "/"
        }
      };

      console.log("[SW] 📢 Showing notification:", notificationTitle, notificationOptions);
      self.registration.showNotification(notificationTitle, notificationOptions);
    });

    self.addEventListener("notificationclick", (event) => {
      console.log("[SW] 🖱️ Notification clicked:", event.notification);
      event.notification.close();

      const urlToOpen = event.notification?.data?.url || "/";
      event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
          for (const client of windowClients) {
            if (client.url === urlToOpen && "focus" in client) {
              console.log("[SW] 🔄 Focusing existing window:", client.url);
              return client.focus();
            }
          }
          console.log("[SW] 🆕 Opening new window:", urlToOpen);
          return clients.openWindow(urlToOpen);
        })
      );
    });

  } catch (error) {
    console.error("[SW] ❌ Error loading Firebase config:", error);
  }
})();
