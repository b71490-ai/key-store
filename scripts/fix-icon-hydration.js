const fs = require("fs");
const path = require("path");

const dirs = ["app", "components", "src"];
const exts = [".js", ".jsx", ".ts", ".tsx"];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  let files = [];
  for (const item of fs.readdirSync(dir)) {
    const full = path.join(dir, item);
    const stat = fs.statSync(full);
    if (stat.isDirectory()) files = files.concat(walk(full));
    else if (exts.includes(path.extname(full))) files.push(full);
  }
  return files;
}

let changed = 0;

for (const dir of dirs) {
  for (const file of walk(dir)) {
    let code = fs.readFileSync(file, "utf8");
    const old = code;

    code = code
      .replace(/\/store-icon\.svg\?v=\$\{Date\.now\(\)\}/g, "/store-icon.svg")
      .replace(/\/store-icon\.png\?v=\$\{Date\.now\(\)\}/g, "/store-icon.png")
      .replace(/\/store-icon\.svg\?v=\$\{new Date\(\)\.getTime\(\)\}/g, "/store-icon.svg")
      .replace(/\/store-icon\.png\?v=\$\{new Date\(\)\.getTime\(\)\}/g, "/store-icon.png");

    if (code !== old) {
      fs.writeFileSync(file, code);
      console.log("Fixed:", file);
      changed++;
    }
  }
}

console.log("Total files fixed:", changed);
