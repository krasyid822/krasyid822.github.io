const CACHE_NAME = 'my-site-cache-v1';
const urlsToCache = [
  '/',
  'https://krasyid822.github.io/KalenderAkademikPolmed/',
  'https://krasyid822.github.io/KatalogIndomaret/',
  'https://krasyid822.github.io/tugasAkhirDesignWeb/',
  'https://krasyid822.github.io/blog-for-learning-English/',
  'https://krasyid822.github.io/blog-for-learning-English/level1.html',
  'https://krasyid822.github.io/AlMatsurat/',
  'https://krasyid822.github.io/AlMatsurat/AlMatsurat_Sugro_Pagi.html',
  'https://krasyid822.github.io/submission-web-dicoding/',
  'https://krasyid822.github.io/TwitterEmbed/',
  'https://krasyid822.github.io/Profile-Hover-Challenge/',
  'https://github.com/krasyid822/Drive',
  'https://www.markdownguide.org/basic-syntax/',
  'https://krasyid822.github.io/KalenderAkademikPolmed/',
  'https://krasyid822.github.io/KalenderAkademikPolmed/',
  'https://krasyid822.github.io/KalenderAkademikPolmed/',
  'https://krasyid822.github.io/KalenderAkademikPolmed/'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});