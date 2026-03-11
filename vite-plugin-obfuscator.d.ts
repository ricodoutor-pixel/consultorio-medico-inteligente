declare module 'vite-plugin-obfuscator' {
  import { Plugin } from 'vite';
  interface ObfuscatorOptions {
    options?: Record<string, any>;
  }
  export default function obfuscator(options?: ObfuscatorOptions): Plugin;
}