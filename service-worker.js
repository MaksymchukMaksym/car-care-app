// Назва кешу з версією. Змінюйте її при оновленні додатку
const CACHE_NAME = 'my-pwa-cache-v1';

// Список файлів, які потрібно кешувати для роботи офлайн
const urlsToCache = [
  '/',
  '/index.html',
  '/styles.css',   // Підставте назву вашого CSS-файлу
  '/app.js',       // Підставте назву вашого JS-файлу
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png'
];

// Встановлення та кешування файлів
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache відкрито');
        return cache.addAll(urlsToCache);
      })
  );
});

// Відповідь на запити: спочатку з кешу, якщо немає — з мережі
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        return response || fetch(event.request);
      })
  );
});

// Очищення старих кешів при активації нового Service Worker
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
