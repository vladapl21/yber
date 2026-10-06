// Inlines src/* into a single self-contained index.html.
//   node build.js          writes index.html (used by npm start / npm test)
//   node build.js --dist   also writes dist/index.html, the only file the hosted site needs (Netlify publishes dist/)
const fs = require('fs'), path = require('path');
const src = (f) => fs.readFileSync(path.join(__dirname, 'src', f), 'utf8');
const seed = JSON.stringify(JSON.parse(src('seed.json')));           // validate + minify
const js = ['art.js', 'api.js', 'app-core.js', 'app-views-1.js', 'app-views-2.js'].map(src).join('\n\n');
if (js.includes('</script')) throw new Error('JS contains </script — would break inline embedding');
let html = src('template.html')
  .replace('/*__CSS__*/', () => src('styles.css'))
  .replace('/*__SEED__*/', () => seed.replace(/<\//g, '<\\/'))
  .replace('/*__JS__*/', () => js);
fs.writeFileSync(path.join(__dirname, 'index.html'), html);
console.log('built index.html (' + (html.length / 1024).toFixed(0) + ' KB)');
if (process.argv.includes('--dist')) {
  const dist = path.join(__dirname, 'dist');
  fs.rmSync(dist, { recursive: true, force: true });
  fs.mkdirSync(dist);
  fs.writeFileSync(path.join(dist, 'index.html'), html);
  console.log('built dist/index.html');
}
