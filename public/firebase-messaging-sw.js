/*
 * Push service worker for dashboard notifications (Firebase Cloud Messaging delivers standard
 * Web Push messages). Kept dependency-free: it only shows the notification and opens the
 * dashboard page it points to when clicked.
 */
self.addEventListener("push", (event) => {
  let msg = {};
  try {
    msg = event.data ? event.data.json() : {};
  } catch (e) {
    msg = { notification: { title: "Notifikasi", body: event.data ? event.data.text() : "" } };
  }
  const n = msg.notification || {};
  const link = (msg.fcmOptions && msg.fcmOptions.link) || (msg.data && msg.data.href) || "/dashboard";
  event.waitUntil(
    self.registration.showNotification(n.title || "Notifikasi", {
      body: n.body || "",
      icon: n.icon || "/favicon.ico",
      data: { link },
    })
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const link = (event.notification.data && event.notification.data.link) || "/dashboard";
  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const c of list) {
        if ("focus" in c) {
          c.navigate(link);
          return c.focus();
        }
      }
      return self.clients.openWindow(link);
    })
  );
});
