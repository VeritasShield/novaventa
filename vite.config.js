import { defineConfig } from 'vite';
import monkey from 'vite-plugin-monkey';

export default defineConfig({
  plugins: [
    monkey({
      entry: 'automation_novaventa.js',
      userscript: {
        name: 'Automatización de Pedidos Novaventa — Full Plus (TM)',
        namespace: 'http://tampermonkey.net/',
        version: '3.1.1',
        description: 'Vista para Docs (HTML/PNG recortado), UI flotante, captura ampliada, totales es-CO y atajos.',
        match: ['https://comercio.novaventa.com.co/nautilusb2bstorefront/nautilus/es/COP/*'],
        grant: ['GM_addStyle', 'GM_getValue', 'GM_setValue', 'GM_deleteValue', 'GM_xmlhttpRequest'],
      },
      build: {
        fileName: 'novaventa.user.js',
      },
    }),
  ],
});