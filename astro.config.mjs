import { defineConfig } from 'astro/config';
import cloudflare from '@astrojs/cloudflare';
export default defineConfig({
  site: 'https://www.car-trailers.com.au',
  output: 'server',
  adapter: cloudflare({ imageService: 'compile', prerenderEnvironment: 'node', remoteBindings: false }),
  server: { host: '0.0.0.0', port: 4173 },
  vite: { server: { allowedHosts: ['terminal.local'] } },
  devToolbar: { enabled: false },
});
