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
    "revision": "238cf5da7033ef6f5751d2db65b607dd"
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
    "url": "assets/react-vendor-C3RQjzdA.js",
    "revision": null
  }, {
    "url": "assets/index-D44ZqZBY.css",
    "revision": null
  }, {
    "url": "assets/index-BObh0CAO.js",
    "revision": null
  }, {
    "url": "assets/icons-vendor-CiP5-56F.js",
    "revision": null
  }, {
    "url": "assets/firebase-vendor-BrgdeQ0n.js",
    "revision": null
  }, {
    "url": "assets/aistudio/________pwabuilder_score__1__a416ddcf.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______fa4c6ab4.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______f2f4a03c.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______f0b76602.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______ed827de0.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______d5edeb64.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______a3d3c275.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______9d2c2229.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______9afd9aec.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______9acdca25.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______83560749.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______7f4edde0.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______75df6db4.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______6e3addc0.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______5765ebee.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______4fdd1406.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______4d95b1b4.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______1e0c4f3f.png",
    "revision": null
  }, {
    "url": "assets/aistudio/Screenshot_________-_______0b969687.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_________________bbacd415.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_________________968a2b82.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_________________8268e9cb.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG_________________7d764930.png",
    "revision": null
  }, {
    "url": "assets/aistudio/IMG-20261017-WA0049_72bb8e59.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/1793581205833_a58b2e3a.jpg",
    "revision": null
  }, {
    "url": "assets/aistudio/1793046289767_eb8707e3.jpg",
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
