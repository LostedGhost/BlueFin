// vite.config.ts - Version corrigée avec gestion des cookies

import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

function figmaAssetResolver() {
  return {
    name: 'figma-asset-resolver',
    resolveId(id) {
      if (id.startsWith('figma:asset/')) {
        const filename = id.replace('figma:asset/', '')
        return path.resolve(__dirname, 'src/assets', filename)
      }
    },
  }
}

export default defineConfig({
  plugins: [
    figmaAssetResolver(),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    host: '0.0.0.0',
    historyApiFallback: true,
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '.ngrok-free.dev',
      '.ngrok.io',
      'splashed-commotion-glitter.ngrok-free.dev',
    ],
    proxy: {
      // ✅ Proxy principal pour toutes les requêtes API
      '/api': {
        target: 'https://api.bluefin-immo.com',
        changeOrigin: true,
        cookieDomainRewrite: '',
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            // ✅ Récupérer TOUS les cookies
            const cookies = req.headers.cookie;
            if (cookies) {
              proxyReq.setHeader('Cookie', cookies);
              console.log('🍪 Cookies transmis:', cookies);
            } else {
              console.warn('⚠️ Aucun cookie trouvé dans la requête');
            }
            
            // ✅ Ajouter les headers nécessaires
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
            proxyReq.setHeader('Origin', 'https://bluefin-immo.com');
            proxyReq.setHeader('Referer', 'https://bluefin-immo.com/');

            // Preserve incoming content type (especially multipart/form-data with boundary).
            const incomingContentType = req.headers['content-type'];
            if (incomingContentType) {
              proxyReq.setHeader('Content-Type', incomingContentType);
            }
            
            // ✅ Ajouter le token CSRF si présent
            const xsrfToken = req.headers['x-xsrf-token'] || req.headers['x-csrf-token'];
            if (xsrfToken) {
              proxyReq.setHeader('X-XSRF-TOKEN', xsrfToken);
              proxyReq.setHeader('X-CSRF-TOKEN', xsrfToken);
            }
          });
          
          // ✅ Gérer les réponses du proxy
          proxy.on('proxyRes', (proxyRes, req, res) => {
            // ✅ Transmettre et réécrire les cookies de réponse pour le dev local
              const setCookie = proxyRes.headers['set-cookie'];
              if (setCookie) {
                // Réécrire chaque cookie pour supprimer Domain et Secure en dev
                const rewritten = setCookie.map((c: string) => {
                  let cookie = c.replace(/;\s*Domain=[^;]+/i, '');
                  cookie = cookie.replace(/;\s*Secure/i, '');
                  // Forcer SameSite à Lax si présent différemment
                  cookie = cookie.replace(/;\s*SameSite=[^;]+/i, '; SameSite=Lax');
                  return cookie;
                });
                res.setHeader('Set-Cookie', rewritten);
                console.log('🍪 Set-Cookie reçu (réécrit):', rewritten);
              } else {
                console.warn('⚠️ Aucun Set-Cookie reçu du serveur');
              }
            
            // ✅ Ajouter les headers CORS pour les réponses
            res.setHeader('Access-Control-Allow-Origin', 'http://localhost:5173');
            res.setHeader('Access-Control-Allow-Credentials', 'true');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept, X-Requested-With, X-XSRF-TOKEN, X-CSRF-TOKEN, Cookie, Set-Cookie');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
          });
          
          // ✅ Gérer les erreurs du proxy
          proxy.on('error', (err, req, res) => {
            console.error('❌ Proxy error:', err.message);
            if (!res.headersSent) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({ 
                success: false, 
                message: 'Proxy error: ' + err.message 
              }));
            }
          });
        },
      },

      '/storage': {
        target: 'https://api.bluefin-immo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },

      '/api/public/storage': {
        target: 'https://api.bluefin-immo.com',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path,
      },

      
      // ✅ Proxy pour Sanctum CSRF
      '/sanctum': {
        target: 'https://api.bluefin-immo.com',
        changeOrigin: true,
        cookieDomainRewrite: '',
        secure: false,
        rewrite: (path) => path,
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            const cookies = req.headers.cookie;
            if (cookies) {
              proxyReq.setHeader('Cookie', cookies);
            }
            proxyReq.setHeader('X-Requested-With', 'XMLHttpRequest');
            proxyReq.setHeader('Accept', 'application/json');
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            const setCookie = proxyRes.headers['set-cookie'];
            if (setCookie) {
              const rewritten = setCookie.map((c: string) => {
                let cookie = c.replace(/;\s*Domain=[^;]+/i, '');
                cookie = cookie.replace(/;\s*Secure/i, '');
                cookie = cookie.replace(/;\s*SameSite=[^;]+/i, '; SameSite=Lax');
                return cookie;
              });
              res.setHeader('Set-Cookie', rewritten);
              console.log('🍪 Sanctum Set-Cookie (réécrit):', rewritten);
            }
          });
        },
      },
    },
  },
  assetsInclude: ['**/*.svg', '**/*.csv'],
})