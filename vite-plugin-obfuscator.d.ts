declare module 'vite-plugin-obfuscator' {
  import { Plugin } from 'vite';
  export function viteObfuscateFile(options?: Record<string, any>): Plugin;
  export default viteObfuscateFile;
}
