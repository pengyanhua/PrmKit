const esbuild = require('esbuild');
const path = require('path');

const args = process.argv.slice(2);
const isWatch = args.includes('--watch');
const isProduction = args.includes('--production');
const isWebviewOnly = args.includes('--webview');

/** @type {esbuild.BuildOptions} */
const extensionConfig = {
  entryPoints: ['src/extension.ts'],
  bundle: true,
  outfile: 'dist/extension.js',
  external: ['vscode'],
  format: 'cjs',
  platform: 'node',
  target: 'node18',
  sourcemap: !isProduction,
  minify: isProduction,
  tsconfig: 'tsconfig.json',
};

/** @type {esbuild.BuildOptions} */
const webviewConfig = {
  entryPoints: ['webview/index.tsx'],
  bundle: true,
  outfile: 'dist/webview/index.js',
  format: 'iife',
  platform: 'browser',
  target: 'es2022',
  sourcemap: !isProduction,
  minify: isProduction,
  tsconfig: 'tsconfig.webview.json',
  define: {
    'process.env.NODE_ENV': isProduction ? '"production"' : '"development"',
  },
};

async function build() {
  const configs = isWebviewOnly ? [webviewConfig] : [extensionConfig, webviewConfig];

  if (isWatch) {
    for (const config of configs) {
      const ctx = await esbuild.context(config);
      await ctx.watch();
    }
    console.log('[esbuild] watching for changes...');
  } else {
    for (const config of configs) {
      await esbuild.build(config);
    }
    console.log('[esbuild] build complete');
  }
}

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
