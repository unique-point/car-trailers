import {defineConfig} from 'vite';
export default defineConfig({root:'dist/client',appType:'mpa',server:{host:'0.0.0.0',allowedHosts:['terminal.local']}});
