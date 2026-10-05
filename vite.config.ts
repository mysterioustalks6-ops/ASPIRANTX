import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig(() => {
  return {
    plugins: [
      react(), 
      tailwindcss(),
      visualizer({
        filename: 'dist/stats.html',
        json: true,
        open: false,
        gzipSize: true
      })
    ],
    resolve: {
      alias: {
        '@': path.resolve('.'),
      },
    },
    build: {
      chunkSizeWarningLimit: 1600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('openkoshDetailedSyllabus') || id.includes('jeeSyllabusData') || id.includes('syllabusTemplates')) {
              return 'data-syllabus';
            }
            if (id.includes('examRegistry') || id.includes('aeJeRegistryConfigs')) {
              return 'data-exams';
            }
            if (id.includes('node_modules')) {
              if (id.includes('@dnd-kit')) {
                return 'vendor-dndkit';
              }
              if (id.includes('three')) {
                return 'vendor-three';
              }
              if (id.includes('katex')) {
                return 'vendor-katex';
              }
              if (id.includes('recharts') || id.includes('d3-')) {
                return 'vendor-charts';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@google/genai') || id.includes('@supabase')) {
                return 'vendor-sdk';
              }
            }
          },
        },
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modifyâfile watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
