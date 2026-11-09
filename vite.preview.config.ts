// Build alternativo: gera um único HTML autocontido (usado para a prévia publicada).
import { defineConfig, mergeConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';
import base from './vite.config';

export default mergeConfig(base, defineConfig({ plugins: [viteSingleFile()], build: { outDir: 'dist-single', assetsInlineLimit: 100000000 } }));
