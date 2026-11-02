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
define(['./workbox-7e5eb42b'], (function (workbox) { 'use strict';

  self.skipWaiting();
  workbox.clientsClaim();
  /**
   * The precacheAndRoute() method efficiently caches and responds to
   * requests for URLs in the manifest.
   * See https://goo.gl/S9QRab
   */
  workbox.precacheAndRoute([{
    "url": "registerSW.js",
    "revision": "1872c500de691dce40960bb85481de07"
  }, {
    "url": "offline.html",
    "revision": "57ba7c3d61171cc3f05b92c877b117ca"
  }, {
    "url": "index.html",
    "revision": "dbe6cf1ce4544ccd8ba9d6ae6dc2b5dc"
  }, {
    "url": "assets/index-D_I5-rBT.css",
    "revision": null
  }, {
    "url": "assets/index-BhQ6ppSL.js",
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

}));
