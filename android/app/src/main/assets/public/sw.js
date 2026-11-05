/**
 * Copyright 2018 Google Inc. All Rights Reserved.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *     http://www.apache.org/licenses/LICENSE-2.0
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

// If the loader is already loaded, just stop.
if (!self.define) {
  let registry = {};

  // Used for `eval` and `importScripts` where we can't get script URL by other means.
  // In both cases, it's safe to use a global var because those functions are synchronous.
  let nextDefineUri;

  const singleRequire = (uri, parentUri) => {
    uri = new URL(uri + ".js", parentUri).href;
    return registry[uri] || (
      
        new Promise(resolve => {
          if ("document" in self) {
            const script = document.createElement("script");
            script.src = uri;
            script.onload = resolve;
            document.head.appendChild(script);
          } else {
            nextDefineUri = uri;
            importScripts(uri);
            resolve();
          }
        })
      
      .then(() => {
        let promise = registry[uri];
        if (!promise) {
          throw new Error(`Module ${uri} didn’t register its module`);
        }
        return promise;
      })
    );
  };

  self.define = (depsNames, factory) => {
    const uri = nextDefineUri || ("document" in self ? document.currentScript.src : "") || location.href;
    if (registry[uri]) {
      // Module is already loading or loaded.
      return;
    }
    let exports = {};
    const require = depUri => singleRequire(depUri, uri);
    const specialDeps = {
      module: { uri },
      exports,
      require
    };
    registry[uri] = Promise.all(depsNames.map(
      depName => specialDeps[depName] || require(depName)
    )).then(deps => {
      factory(...deps);
      return exports;
    });
  };
}
define(['./workbox-b1bafff1'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "screenshot-mobile.png",
    "revision": "827b70fbc6ddfff1619098cadd324f77"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "2274f0b64214ba1cf465d8bc3d3c9e0c"
  }, {
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "pwa-192x192.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "offline.html",
    "revision": "57ba7c3d61171cc3f05b92c877b117ca"
  }, {
    "url": "index.html",
    "revision": "8ed44a57f22fe73b1ad5db4963f9e9ae"
  }, {
    "url": "icon.svg",
    "revision": "d15cd26172a59d5a57aca17e2e55ef36"
  }, {
    "url": "apple-touch-icon.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "assets/rolldown-runtime-la_ZsWYt.js",
    "revision": null
  }, {
    "url": "assets/react-vendor-CidI60Xl.js",
    "revision": null
  }, {
    "url": "assets/index-C-QMEFL-.css",
    "revision": null
  }, {
    "url": "assets/index-B-S0iN15.js",
    "revision": null
  }, {
    "url": "assets/icons-vendor-Cooi5xIE.js",
    "revision": null
  }, {
    "url": "assets/firebase-vendor-BrgdeQ0n.js",
    "revision": null
  }, {
    "url": "assets/images/blood_donation_hero_banner.jpg",
    "revision": null
  }, {
    "url": "assets/images/blood_benefits_poster.jpg",
    "revision": null
  }, {
    "url": "assets/images/app_logo_icon.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG-20251014-WA0021_1__70d6223c.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/1793729827076_28d1039d.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/1793729364931_f9b871ba.jpg",
    "revision": null
  }, {
    "url": "apple-touch-icon.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "icon.svg",
    "revision": "d15cd26172a59d5a57aca17e2e55ef36"
  }, {
    "url": "offline.html",
    "revision": "57ba7c3d61171cc3f05b92c877b117ca"
  }, {
    "url": "pwa-192x192.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "pwa-512x512.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "pwa-maskable-512x512.png",
    "revision": "27980d22ccec67c9b5988d8ffbfa21c3"
  }, {
    "url": "screenshot-desktop.png",
    "revision": "2274f0b64214ba1cf465d8bc3d3c9e0c"
  }, {
    "url": "screenshot-mobile.png",
    "revision": "827b70fbc6ddfff1619098cadd324f77"
  }, {
    "url": "manifest.webmanifest",
    "revision": "3d29aaed41f7ee10808b194b73228a17"
  }], {});
  workbox.cleanupOutdatedCaches();
  workbox.registerRoute(new workbox.NavigationRoute(workbox.createHandlerBoundToURL("index.html")));
  workbox.registerRoute(/^https:\/\/fonts\.googleapis\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "google-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/^https:\/\/fonts\.gstatic\.com\/.*/i, new workbox.CacheFirst({
    "cacheName": "gstatic-fonts-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 10,
      maxAgeSeconds: 31536000
    }), new workbox.CacheableResponsePlugin({
      statuses: [0, 200]
    })]
  }), 'GET');
  workbox.registerRoute(/\.(?:png|jpg|jpeg|svg|gif|webp|ico)$/i, new workbox.StaleWhileRevalidate({
    "cacheName": "images-cache",
    plugins: [new workbox.ExpirationPlugin({
      maxEntries: 50,
      maxAgeSeconds: 2592000
    })]
  }), 'GET');

}));
