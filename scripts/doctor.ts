import fs from "node:fs";
import path from "node:path";

function readJSON(p: string) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

const pkg = readJSON(path.resolve("package.json"));
const deps = { ...pkg.dependencies, ...pkg.devDependencies };

const req = ["@capacitor/core", "@capacitor/ios", "@capacitor/app", "@capacitor/status-bar"];
const missing = req.filter(r => !deps[r]);

const vCore = deps["@capacitor/core"] || "";
const vIOS = deps["@capacitor/ios"] || "";
const coreMajor = vCore.match(/\d+/)?.[0];
const iosMajor = vIOS.match(/\d+/)?.[0];

const envNeeded = ["VITE_SUPABASE_URL", "VITE_SUPABASE_ANON_KEY"];
const envMissing = envNeeded.filter(k => !process.env[k]);

const probs: string[] = [];
if (missing.length) probs.push(`Missing deps: ${missing.join(", ")}`);
if (coreMajor && iosMajor && coreMajor !== iosMajor) probs.push(`Capacitor major mismatch core ${coreMajor} vs ios ${iosMajor}`);
if (envMissing.length) probs.push(`Missing env: ${envMissing.join(", ")}`);

console.log("Doctor checks:");
console.log(`- Capacitor core: ${vCore}`);
console.log(`- Capacitor ios:  ${vIOS}`);
console.log(`- Required env present: ${envNeeded.filter(k => !envMissing.includes(k)).join(", ") || "none"}`);
if (probs.length) {
  console.error("Issues found:");
  probs.forEach(p => console.error(`- ${p}`));
  process.exit(1);
} else {
  console.log("All checks passed");
}