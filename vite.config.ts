import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: [
          'favicon.ico',
          'icon.svg',
          'pwa-192x192.png',
          'pwa-512x512.png',
          'pwa-maskable-512x512.png',
          'apple-touch-icon.png',
          'screenshot-mobile.png',
          'screenshot-desktop.png',
          'offline.html'
        ],
        manifest: ({
          id: '/',
          name: 'قطرة دم تنقذ حياة إنسان - قعطبة',
          short_name: 'قطرة دم',
          description: 'تطبيق سجل المتبرعين بالدم بمديرية قعطبة - محافظة الضالع',
          theme_color: '#dc2626',
          background_color: '#ffffff',
          display: 'standalone',
          display_override: [
            'window-controls-overlay',
            'standalone',
            'minimal-ui',
            'browser'
          ],
          orientation: 'portrait',
          start_url: '/',
          scope: '/',
          lang: 'ar',
          dir: 'rtl',
          categories: ['medical', 'health', 'utilities', 'social'],
          iarc_rating_id: 'e84b072d-71b3-4d3e-86ae-31a8ce4e53b7',
          prefer_related_applications: false,
          related_applications: [
            {
              platform: 'play',
              url: 'https://play.google.com/store/apps/details?id=com.blood.qataba',
              id: 'com.blood.qataba'
            }
          ],
          launch_handler: {
            client_mode: 'auto'
          },
          edge_side_panel: {
            preferred_width: 480
          },
          note_taking: {
            new_note_url: '/?action=new-note'
          },
          file_handlers: [
            {
              action: '/?import=file',
              name: 'ملف بيانات المتبرعين',
              accept: {
                'text/csv': ['.csv'],
                'application/json': ['.json']
              }
            } as any
          ],
          protocol_handlers: [
            {
              protocol: 'web+blooddonor',
              url: '/?donor=%s'
            }
          ],
          scope_extensions: [
            {
              origin: 'https://*.run.app',
              type: 'origin'
            },
            {
              origin: 'https://ais-pre-2fwbjzqr5owseczvhlzoxa-948198712697.europe-west2.run.app',
              type: 'origin'
            },
            {
              origin: 'https://ais-dev-2fwbjzqr5owseczvhlzoxa-948198712697.europe-west2.run.app',
              type: 'origin'
            }
          ],
          icons: [
            {
              src: '/pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any'
            },
            {
              src: '/pwa-maskable-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable'
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any'
            }
          ],
          screenshots: [
            {
              src: '/screenshot-mobile.png',
              sizes: '1053x2340',
              type: 'image/png',
              form_factor: 'narrow',
              label: 'الواجهة الرئيسية للتطبيق وسجل المتبرعين بقعطبة'
            },
            {
              src: '/screenshot-desktop.png',
              sizes: '1279x720',
              type: 'image/png',
              form_factor: 'wide',
              label: 'لوحة البحث والفرز بحسب فصائل الدم بقعطبة'
            }
          ],
          shortcuts: [
            {
              name: 'البحث عن متبرع',
              short_name: 'بحث متبرع',
              description: 'البحث عن متبرعي الدم المتاحين في قعطبة',
              url: '/?tab=search',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'تسجيل كمتبرع جديد',
              short_name: 'تسجيل',
              description: 'تسجيل بياناتك كمتبرع بالدم لإنقاذ الأرواح',
              url: '/?tab=register',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            },
            {
              name: 'طلبات الدم العاجلة',
              short_name: 'طوارئ',
              description: 'استعراض ومتابعة حالات الطوارئ وطلب دم عاجل',
              url: '/?tab=urgent',
              icons: [
                {
                  src: '/pwa-192x192.png',
                  sizes: '192x192',
                  type: 'image/png'
                }
              ]
            }
          ]
        } as any),
        devOptions: {
          enabled: true,
          type: 'module'
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
        }
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      hmr: false,
      watch: null,
    },
  };
});
