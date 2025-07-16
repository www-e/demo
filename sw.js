// A version number for our cache. Change this version number
// anytime you update any of the cached files to force the service worker to update.
const CACHE_VERSION = 10 ;
const CACHE_NAME = `edu-center-cache-v${CACHE_VERSION}`;

// A list of all the essential files (the "app shell") that we want to cache.
const APP_SHELL_URLS = [
    './',
    'index.html',
    'pages/admin.html',
    'pages/schedule-admin.html',
    'pages/centers.html',
    'manifest.json',

    // --- Global CSS & Assets ---
    'css/styles.css',
    'css/tags.css',
    'assets/mloky.png',
    'assets/icons8-study-undefined-16.png',
    'assets/icons8-study-undefined-32.png',

    // --- Registration Form (index.html) ---
    'css/registration.css',
    'css/modal.css',
    'css/dropdown-fix.css',
    'css/fees-modal.css',
    'js/main.js',
    'js/validation.js',
    'js/ui/dropdowns.js',
    'js/ui/modals.js',

    // --- Admin Dashboard (admin.html) ---
    'css/schedule-admin.css', // Shared styles
    'css/student-modal-admin-page.css',
    'js/admin.js',
    'js/pages/admin/constants.js',
    'js/pages/admin/state.js',
    'js/pages/admin/helpers.js',
    'js/pages/admin/supabase-client.js',
    'js/pages/admin/filters.js',
    'js/pages/admin/filter-cards.js',
    'js/pages/admin/table-renderer.js',
    'js/pages/admin/modal-manager.js',
    'js/pages/admin/crud-operations.js',
    'js/pages/admin/event-handlers.js',
    'js/features/pdf-printer.js',
    'templates/student-report-template.html',
    // --- Schedule Admin (schedule-admin.html) ---
    'js/pages/schedule-admin/main-admin.js',
    'js/pages/schedule-admin/dom-elements.js',
    'js/pages/schedule-admin/state.js',
    'js/pages/schedule-admin/ui-helpers.js',
    'js/pages/schedule-admin/ui-manager.js',
    'js/pages/schedule-admin/time-builder.js',
    'js/pages/schedule-admin/table-handler.js',
    'js/pages/schedule-admin/event-handlers.js',

    // --- Shared Components & Services ---
    'js/components/material-modal.js',
    'js/components/teacher-modal.js',
    'js/components/fees-modal.js',
    'js/components/update-modal.js',
    'js/services/center-service.js',
    'js/services/material-service.js',
    'js/services/teacher-service.js',
    'js/services/registration-service.js',
    'js/services/schedule-service.js',

    // --- Core Infrastructure ---
    'js/config.js',
    'js/supabase-client.js',
];

// The install event fires when the service worker is first installed.
self.addEventListener('install', event => {
    console.log('[Service Worker] Install');
    self.skipWaiting();
    // We wait until the app shell is fully cached before completing installation.
    event.waitUntil(
        caches.open(CACHE_NAME)
        .then(cache => {
            console.log('[Service Worker] Caching all: app shell and content');
            // Using { cache: 'reload' } to bypass the browser's HTTP cache for these requests.
            // This ensures we get the latest files from the server during installation.
            const cachePromises = APP_SHELL_URLS.map(url => {
                return fetch(url, { cache: 'reload' })
                    .then(response => {
                        if (!response.ok) {
                            throw new TypeError(`Bad response status ${response.status} for ${url}`);
                        }
                        return cache.put(url, response);
                    })
                    .catch(err => {
                        console.error(`[Service Worker] Failed to cache ${url}`, err);
                    });
            });
            return Promise.all(cachePromises);
        })
    );
});

// The activate event fires after installation.
// It's the perfect place to clean up old, unused caches.
self.addEventListener('activate', event => {
    console.log('[Service Worker] Activate');
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cache => {
                    if (cache !== CACHE_NAME) {
                        console.log('[Service Worker] Deleting old cache:', cache);
                        return caches.delete(cache);
                    }
                })
            );
        })
    );
    return self.clients.claim();
});

// The fetch event fires for every network request the page makes.
self.addEventListener('fetch', event => {
    const url = new URL(event.request.url);

    // Strategy: Network First for HTML and Supabase API calls.
    // This guarantees users see the latest page structure and data.
    // It falls back to the cache if the network is unavailable.
    if (event.request.mode === 'navigate' || url.hostname.includes('supabase.co')) {
        event.respondWith(
            fetch(event.request)
            .catch(() => {
                // If the fetch fails (e.g., offline), try to get it from the cache
                return caches.match(event.request);
            })
        );
        return;
    }

    // Strategy: Cache First, then Network for all other assets (CSS, JS, images).
    // This is fast and efficient. It only goes to the network if the asset is not in the cache.
    event.respondWith(
        caches.match(event.request).then(cachedResponse => {
            return cachedResponse || fetch(event.request).then(response => {
                // For non-essential assets, we can cache them as they are requested.
                return caches.open(CACHE_NAME).then(cache => {
                    if (response.ok) { // Only cache valid responses
                        cache.put(event.request, response.clone());
                    }
                    return response;
                });
            });
        })
    );
});