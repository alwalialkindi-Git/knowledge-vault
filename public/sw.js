// Minimal service worker: enough to make the app installable.
// Intentionally does not cache responses, to avoid storing private content.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("fetch", () => {
  // Pass through to the network (default handling).
});
