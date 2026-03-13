// vite.config.ts
import { defineConfig } from "file:///home/ubuntu/consultorio-medico-zip/consultorio-medico-inteligente-main/node_modules/vite/dist/node/index.js";
import react from "file:///home/ubuntu/consultorio-medico-zip/consultorio-medico-inteligente-main/node_modules/@vitejs/plugin-react-swc/index.js";
import path from "path";
import { componentTagger } from "file:///home/ubuntu/consultorio-medico-zip/consultorio-medico-inteligente-main/node_modules/lovable-tagger/dist/index.js";
import obfuscator from "file:///home/ubuntu/consultorio-medico-zip/consultorio-medico-inteligente-main/node_modules/vite-plugin-obfuscator/index.js";
var __vite_injected_original_dirname = "/home/ubuntu/consultorio-medico-zip/consultorio-medico-inteligente-main";
var vite_config_default = defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    mode === "production" && obfuscator({
      options: {
        compact: true,
        controlFlowFlattening: true,
        controlFlowFlatteningThreshold: 0.5,
        deadCodeInjection: true,
        deadCodeInjectionThreshold: 0.2,
        debugProtection: false,
        disableConsoleOutput: false,
        identifierNamesGenerator: "hexadecimal",
        log: false,
        numbersToExpressions: true,
        renameGlobals: false,
        selfDefending: true,
        simplify: true,
        splitStrings: true,
        splitStringsChunkLength: 5,
        stringArray: true,
        stringArrayCallsTransform: true,
        stringArrayEncoding: ["base64"],
        stringArrayIndexShift: true,
        stringArrayRotate: true,
        stringArrayShuffle: true,
        stringArrayWrappersCount: 2,
        stringArrayWrappersChainedCalls: true,
        stringArrayWrappersType: "function",
        stringArrayThreshold: 0.75,
        transformObjectKeys: true,
        unicodeEscapeSequence: false
      }
    })
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__vite_injected_original_dirname, "./src")
    }
  },
  build: {
    minify: "terser",
    terserOptions: {
      compress: {
        drop_debugger: true,
        passes: 2
      },
      mangle: {
        safari10: true
      },
      format: {
        comments: false
      }
    },
    rollupOptions: {
      output: {
        manualChunks: void 0
      }
    }
  }
}));
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS91YnVudHUvY29uc3VsdG9yaW8tbWVkaWNvLXppcC9jb25zdWx0b3Jpby1tZWRpY28taW50ZWxpZ2VudGUtbWFpblwiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9maWxlbmFtZSA9IFwiL2hvbWUvdWJ1bnR1L2NvbnN1bHRvcmlvLW1lZGljby16aXAvY29uc3VsdG9yaW8tbWVkaWNvLWludGVsaWdlbnRlLW1haW4vdml0ZS5jb25maWcudHNcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfaW1wb3J0X21ldGFfdXJsID0gXCJmaWxlOi8vL2hvbWUvdWJ1bnR1L2NvbnN1bHRvcmlvLW1lZGljby16aXAvY29uc3VsdG9yaW8tbWVkaWNvLWludGVsaWdlbnRlLW1haW4vdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xuaW1wb3J0IHJlYWN0IGZyb20gXCJAdml0ZWpzL3BsdWdpbi1yZWFjdC1zd2NcIjtcbmltcG9ydCBwYXRoIGZyb20gXCJwYXRoXCI7XG5pbXBvcnQgeyBjb21wb25lbnRUYWdnZXIgfSBmcm9tIFwibG92YWJsZS10YWdnZXJcIjtcbmltcG9ydCBvYmZ1c2NhdG9yIGZyb20gXCJ2aXRlLXBsdWdpbi1vYmZ1c2NhdG9yXCI7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoKHsgbW9kZSB9KSA9PiAoe1xuICBzZXJ2ZXI6IHtcbiAgICBob3N0OiBcIjo6XCIsXG4gICAgcG9ydDogODA4MCxcbiAgfSxcbiAgcGx1Z2luczogW1xuICAgIHJlYWN0KCksXG4gICAgbW9kZSA9PT0gXCJkZXZlbG9wbWVudFwiICYmIGNvbXBvbmVudFRhZ2dlcigpLFxuICAgIG1vZGUgPT09IFwicHJvZHVjdGlvblwiICYmXG4gICAgICBvYmZ1c2NhdG9yKHtcbiAgICAgICAgb3B0aW9uczoge1xuICAgICAgICAgIGNvbXBhY3Q6IHRydWUsXG4gICAgICAgICAgY29udHJvbEZsb3dGbGF0dGVuaW5nOiB0cnVlLFxuICAgICAgICAgIGNvbnRyb2xGbG93RmxhdHRlbmluZ1RocmVzaG9sZDogMC41LFxuICAgICAgICAgIGRlYWRDb2RlSW5qZWN0aW9uOiB0cnVlLFxuICAgICAgICAgIGRlYWRDb2RlSW5qZWN0aW9uVGhyZXNob2xkOiAwLjIsXG4gICAgICAgICAgZGVidWdQcm90ZWN0aW9uOiBmYWxzZSxcbiAgICAgICAgICBkaXNhYmxlQ29uc29sZU91dHB1dDogZmFsc2UsXG4gICAgICAgICAgaWRlbnRpZmllck5hbWVzR2VuZXJhdG9yOiBcImhleGFkZWNpbWFsXCIsXG4gICAgICAgICAgbG9nOiBmYWxzZSxcbiAgICAgICAgICBudW1iZXJzVG9FeHByZXNzaW9uczogdHJ1ZSxcbiAgICAgICAgICByZW5hbWVHbG9iYWxzOiBmYWxzZSxcbiAgICAgICAgICBzZWxmRGVmZW5kaW5nOiB0cnVlLFxuICAgICAgICAgIHNpbXBsaWZ5OiB0cnVlLFxuICAgICAgICAgIHNwbGl0U3RyaW5nczogdHJ1ZSxcbiAgICAgICAgICBzcGxpdFN0cmluZ3NDaHVua0xlbmd0aDogNSxcbiAgICAgICAgICBzdHJpbmdBcnJheTogdHJ1ZSxcbiAgICAgICAgICBzdHJpbmdBcnJheUNhbGxzVHJhbnNmb3JtOiB0cnVlLFxuICAgICAgICAgIHN0cmluZ0FycmF5RW5jb2Rpbmc6IFtcImJhc2U2NFwiXSxcbiAgICAgICAgICBzdHJpbmdBcnJheUluZGV4U2hpZnQ6IHRydWUsXG4gICAgICAgICAgc3RyaW5nQXJyYXlSb3RhdGU6IHRydWUsXG4gICAgICAgICAgc3RyaW5nQXJyYXlTaHVmZmxlOiB0cnVlLFxuICAgICAgICAgIHN0cmluZ0FycmF5V3JhcHBlcnNDb3VudDogMixcbiAgICAgICAgICBzdHJpbmdBcnJheVdyYXBwZXJzQ2hhaW5lZENhbGxzOiB0cnVlLFxuICAgICAgICAgIHN0cmluZ0FycmF5V3JhcHBlcnNUeXBlOiBcImZ1bmN0aW9uXCIsXG4gICAgICAgICAgc3RyaW5nQXJyYXlUaHJlc2hvbGQ6IDAuNzUsXG4gICAgICAgICAgdHJhbnNmb3JtT2JqZWN0S2V5czogdHJ1ZSxcbiAgICAgICAgICB1bmljb2RlRXNjYXBlU2VxdWVuY2U6IGZhbHNlLFxuICAgICAgICB9LFxuICAgICAgfSksXG4gIF0uZmlsdGVyKEJvb2xlYW4pLFxuICByZXNvbHZlOiB7XG4gICAgYWxpYXM6IHtcbiAgICAgIFwiQFwiOiBwYXRoLnJlc29sdmUoX19kaXJuYW1lLCBcIi4vc3JjXCIpLFxuICAgIH0sXG4gIH0sXG4gIGJ1aWxkOiB7XG4gICAgbWluaWZ5OiBcInRlcnNlclwiLFxuICAgIHRlcnNlck9wdGlvbnM6IHtcbiAgICAgIGNvbXByZXNzOiB7XG4gICAgICAgIGRyb3BfZGVidWdnZXI6IHRydWUsXG4gICAgICAgIHBhc3NlczogMixcbiAgICAgIH0sXG4gICAgICBtYW5nbGU6IHtcbiAgICAgICAgc2FmYXJpMTA6IHRydWUsXG4gICAgICB9LFxuICAgICAgZm9ybWF0OiB7XG4gICAgICAgIGNvbW1lbnRzOiBmYWxzZSxcbiAgICAgIH0sXG4gICAgfSxcbiAgICByb2xsdXBPcHRpb25zOiB7XG4gICAgICBvdXRwdXQ6IHtcbiAgICAgICAgbWFudWFsQ2h1bmtzOiB1bmRlZmluZWQsXG4gICAgICB9LFxuICAgIH0sXG4gIH0sXG59KSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXVZLFNBQVMsb0JBQW9CO0FBQ3BhLE9BQU8sV0FBVztBQUNsQixPQUFPLFVBQVU7QUFDakIsU0FBUyx1QkFBdUI7QUFDaEMsT0FBTyxnQkFBZ0I7QUFKdkIsSUFBTSxtQ0FBbUM7QUFPekMsSUFBTyxzQkFBUSxhQUFhLENBQUMsRUFBRSxLQUFLLE9BQU87QUFBQSxFQUN6QyxRQUFRO0FBQUEsSUFDTixNQUFNO0FBQUEsSUFDTixNQUFNO0FBQUEsRUFDUjtBQUFBLEVBQ0EsU0FBUztBQUFBLElBQ1AsTUFBTTtBQUFBLElBQ04sU0FBUyxpQkFBaUIsZ0JBQWdCO0FBQUEsSUFDMUMsU0FBUyxnQkFDUCxXQUFXO0FBQUEsTUFDVCxTQUFTO0FBQUEsUUFDUCxTQUFTO0FBQUEsUUFDVCx1QkFBdUI7QUFBQSxRQUN2QixnQ0FBZ0M7QUFBQSxRQUNoQyxtQkFBbUI7QUFBQSxRQUNuQiw0QkFBNEI7QUFBQSxRQUM1QixpQkFBaUI7QUFBQSxRQUNqQixzQkFBc0I7QUFBQSxRQUN0QiwwQkFBMEI7QUFBQSxRQUMxQixLQUFLO0FBQUEsUUFDTCxzQkFBc0I7QUFBQSxRQUN0QixlQUFlO0FBQUEsUUFDZixlQUFlO0FBQUEsUUFDZixVQUFVO0FBQUEsUUFDVixjQUFjO0FBQUEsUUFDZCx5QkFBeUI7QUFBQSxRQUN6QixhQUFhO0FBQUEsUUFDYiwyQkFBMkI7QUFBQSxRQUMzQixxQkFBcUIsQ0FBQyxRQUFRO0FBQUEsUUFDOUIsdUJBQXVCO0FBQUEsUUFDdkIsbUJBQW1CO0FBQUEsUUFDbkIsb0JBQW9CO0FBQUEsUUFDcEIsMEJBQTBCO0FBQUEsUUFDMUIsaUNBQWlDO0FBQUEsUUFDakMseUJBQXlCO0FBQUEsUUFDekIsc0JBQXNCO0FBQUEsUUFDdEIscUJBQXFCO0FBQUEsUUFDckIsdUJBQXVCO0FBQUEsTUFDekI7QUFBQSxJQUNGLENBQUM7QUFBQSxFQUNMLEVBQUUsT0FBTyxPQUFPO0FBQUEsRUFDaEIsU0FBUztBQUFBLElBQ1AsT0FBTztBQUFBLE1BQ0wsS0FBSyxLQUFLLFFBQVEsa0NBQVcsT0FBTztBQUFBLElBQ3RDO0FBQUEsRUFDRjtBQUFBLEVBQ0EsT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsZUFBZTtBQUFBLE1BQ2IsVUFBVTtBQUFBLFFBQ1IsZUFBZTtBQUFBLFFBQ2YsUUFBUTtBQUFBLE1BQ1Y7QUFBQSxNQUNBLFFBQVE7QUFBQSxRQUNOLFVBQVU7QUFBQSxNQUNaO0FBQUEsTUFDQSxRQUFRO0FBQUEsUUFDTixVQUFVO0FBQUEsTUFDWjtBQUFBLElBQ0Y7QUFBQSxJQUNBLGVBQWU7QUFBQSxNQUNiLFFBQVE7QUFBQSxRQUNOLGNBQWM7QUFBQSxNQUNoQjtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQ0YsRUFBRTsiLAogICJuYW1lcyI6IFtdCn0K
