import { defineConfig, type Plugin } from 'vite';
import { qwikVite } from '@builder.io/qwik/optimizer';
import { qwikCity } from '@builder.io/qwik-city/vite';
import tsconfigPaths from 'vite-tsconfig-paths';

// Workaround for Qwik 1.19 + Node 24: getViteDevIndexHtml calls
// JSON.stringify on serverData which contains circular refs from
// Node.js HTTP parser. Patch JSON.stringify to handle circular refs.
function patchCircularJson(): Plugin {
  return {
    name: 'patch-circular-json',
    enforce: 'pre',
    configureServer() {
      const origStringify = JSON.stringify;
      JSON.stringify = function (value: unknown, replacer?: unknown, space?: unknown) {
        try {
          return origStringify.call(JSON, value, replacer as any, space as any);
        } catch (e: any) {
          if (e?.message?.includes('circular')) {
            const seen = new WeakSet();
            return origStringify.call(JSON, value, (_key: string, val: unknown) => {
              if (typeof val === 'object' && val !== null) {
                if (seen.has(val)) return '[Circular]';
                seen.add(val);
              }
              return val;
            }, space as any);
          }
          throw e;
        }
      } as typeof JSON.stringify;
    },
  };
}

export default defineConfig({
  plugins: [
    patchCircularJson(),
    qwikCity(),
    qwikVite(),
    tsconfigPaths(),
  ],
});
