// import { defineConfig } from 'vite';

// export default defineConfig({
//   // Other Vite configuration options...

//   server: {
//     port: 5173, // Change this port to a different one if needed
//     hmr: {
//       overlay: false,
//     },
//   },

//   resolve: {
//     alias: {
//       // Use an alias to specify the correct import path for 'three.js'
//       'three': 'three',
//     },
//   },
// });


export default {
  root: path.resolve(__dirname, 'src'),
  build: {
    outDir: '../dist'
  },
  server: {
    port: 5173
  }
}
