// js/sw-register.js

// Check if service workers are supported by the browser
if ('serviceWorker' in navigator) {
  // Wait until the page is fully loaded to register the service worker.
  // This prevents it from delaying the initial page render.
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(registration => {
        console.log('Service Worker registered successfully with scope: ', registration.scope);
      })
      .catch(error => {
        console.log('Service Worker registration failed: ', error);
      });
  });
}   