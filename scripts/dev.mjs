import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
// Managed browser QA forwards --strictPort. Serve the validated client build there;
// regular development keeps Astro + the Cloudflare runtime and all API bindings.
const args=process.argv.slice(2);
const uiPreview=args.includes('--strictPort');
if(uiPreview&&!existsSync('dist/client/index.html'))throw new Error('Run npm run build before starting the managed UI preview.');
const child=spawn(process.execPath,[uiPreview?'node_modules/vite/bin/vite.js':'node_modules/astro/bin/astro.mjs',...(uiPreview?['--config','vite.preview.config.mjs']:['dev']),...args],{stdio:'inherit',env:process.env});
for(const signal of ['SIGTERM','SIGINT'])process.on(signal,()=>child.kill(signal));
child.on('exit',code=>process.exit(code??1));
