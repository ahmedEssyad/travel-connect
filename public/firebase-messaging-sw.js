importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyCLuOc1oE2yq2wZbPmg-O5Ej7aBWtGrbsk",
  authDomain: "vegli-10458.firebaseapp.com",
  projectId: "vegli-10458",
  storageBucket: "vegli-10458.firebasestorage.app",
  messagingSenderId: "630168987440",
  appId: "1:630168987440:web:4169c96c4fcb20726a4af5"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('Received background message:', payload);
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      click_action: payload.notification.click_action
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const clickAction = event.notification.data.click_action;
  if (clickAction) {
    event.waitUntil(
      clients.openWindow(clickAction)
    );
  } else {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});