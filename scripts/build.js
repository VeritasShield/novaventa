const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const files = [
  "src/nv_namespace.js",
  "src/state.js",
  "src/utils.js",
  "src/renderers.js",
  "src/exporters.js",
  "src/capture.js",
  "src/ui.js",
  "automation_novaventa.js"
];

let bundle = "(function(){ /* bundle-scope */\n";

for (const file of files) {
    const filePath = path.join(__dirname, '..', file);
    if (!fs.existsSync(filePath)) {
        console.error(`❌ Archivo no encontrado: ${file}`);
        process.exit(1);
    }
    let content = fs.readFileSync(filePath, 'utf8');
    // Purgar BOM (Byte Order Mark) si el archivo fue guardado con codificación Windows
    if (content.charCodeAt(0) === 0xFEFF) content = content.slice(1);
    bundle += `\n/* ===== ${file} ===== */\n` + content + "\n";
}
bundle += "\n})();";

const distDir = path.join(__dirname, '..', 'dist');
if (!fs.existsSync(distDir)) fs.mkdirSync(distDir);
const tempFile = path.join(distDir, 'temp_bundle.js');
fs.writeFileSync(tempFile, bundle, 'utf8');

console.log("📦 Minificando el bundle con esbuild...");
execSync(`npx esbuild "${tempFile}" --outfile="${path.join(distDir, 'content.js')}" --minify --target=es2020`, { stdio: 'inherit' });
fs.unlinkSync(tempFile);
console.log("✅ Build completado exitosamente en dist/content.js");