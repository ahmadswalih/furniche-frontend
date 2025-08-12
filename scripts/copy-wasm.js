#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

// Ensure wasm directory exists
const wasmDir = path.join(__dirname, "..", "public", "wasm");
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true });
}

// Copy OpenCascade WebAssembly files
const srcDir = path.join(
  __dirname,
  "..",
  "node_modules",
  "opencascade.js",
  "dist"
);
const wasmFiles = ["opencascade.wasm.wasm", "opencascade.wasm.js"];

wasmFiles.forEach((file) => {
  const srcPath = path.join(srcDir, file);
  const destPath = path.join(wasmDir, file);

  if (fs.existsSync(srcPath)) {
    if (file.endsWith(".js")) {
      // Read the JS file and remove ES module export for browser compatibility
      let content = fs.readFileSync(srcPath, "utf8");

      // Remove export statement that causes "Unexpected token 'export'" error
      content = content.replace(/\nexport default [^;]+;?\s*$/, "");

      // Write the modified content
      fs.writeFileSync(destPath, content);
      console.log(`✅ Copied and processed ${file} to public/wasm/`);
    } else {
      // Copy binary files as-is
      fs.copyFileSync(srcPath, destPath);
      console.log(`✅ Copied ${file} to public/wasm/`);
    }
  } else {
    console.log(`⚠️  ${file} not found in OpenCascade.js dist`);
  }
});

console.log("🔧 WebAssembly files ready for OpenCascade.js!");
