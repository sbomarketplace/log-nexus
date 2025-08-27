import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const envProd = path.join(root, ".env.production");
const envDev  = path.join(root, ".env");
const plist   = path.join(root, "ios", "App", "App", "Info.plist");

function readEnvFile() {
  const file = fs.existsSync(envProd) ? envProd : (fs.existsSync(envDev) ? envDev : null);
  if (!file) return { file: null, vars: {} };
  const text = fs.readFileSync(file, "utf8");
  const vars = {};
  for (const line of text.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.+?)\s*$/);
    if (m) vars[m[1]] = m[2].replace(/^['"]|['"]$/g, "");
  }
  return { file, vars };
}

function readPlistText() {
  if (!fs.existsSync(plist)) return null;
  return fs.readFileSync(plist, "utf8");
}

function extractPlistString(xml, keyName) {
  const re = new RegExp(`<key>${keyName}<\\/key>\\s*<string>([^<]+)<\\/string>`, "m");
  const m = xml.match(re);
  return m ? m[1] : null;
}

function ok(msg)  { console.log(`✅ ${msg}`); }
function bad(msg) { console.error(`❌ ${msg}`); }

const { file: envFile, vars } = readEnvFile();
const xml = readPlistText();

let failed = false;

// 1) ENV checks
if (!envFile) {
  bad("No .env.production or .env file found.");
  failed = true;
} else {
  ok(`Using env file: ${path.basename(envFile)}`);
}

const required = [
  "VITE_IAP_REMOVE_ADS_MONTHLY",
  "VITE_ADMOB_APP_ID_IOS",
  "VITE_ADMOB_INLINE_BANNER_ID_IOS",
  "VITE_SHOW_AD_PLACEHOLDERS",
];

for (const k of required) {
  if (!vars[k]) { bad(`Missing ${k} in ${envFile || "env file"}`); failed = true; }
}

// Format validation
const appId = vars.VITE_ADMOB_APP_ID_IOS || "";
const unitId = vars.VITE_ADMOB_INLINE_BANNER_ID_IOS || "";
const appIdOk  = /^ca-app-pub-\d{16}~\d+$/.test(appId);
const unitIdOk = /^ca-app-pub-\d{16}\/\d+$/.test(unitId);
if (!appIdOk)  { bad("VITE_ADMOB_APP_ID_IOS format invalid."); failed = true; } else { ok("AdMob App ID format looks valid."); }
if (!unitIdOk) { bad("VITE_ADMOB_INLINE_BANNER_ID_IOS format invalid."); failed = true; } else { ok("Inline Banner Unit ID format looks valid."); }
if (/^ca-app-pub-3940256099942544/.test(unitId)) { bad("Inline Banner Unit ID is using Google TEST ID — replace with your real unit."); failed = true; }

if (vars.VITE_SHOW_AD_PLACEHOLDERS !== "false") {
  console.warn("⚠️  VITE_SHOW_AD_PLACEHOLDERS is not 'false'. Placeholders may render in prod.");
} else {
  ok("Placeholders disabled for production.");
}

// 2) Info.plist checks
if (!xml) {
  bad("ios/App/App/Info.plist not found.");
  failed = true;
} else {
  const plistAppId = extractPlistString(xml, "GADApplicationIdentifier");
  const attText    = extractPlistString(xml, "NSUserTrackingUsageDescription");

  if (!plistAppId) {
    bad("Info.plist missing GADApplicationIdentifier key.");
    failed = true;
  } else if (plistAppId !== appId) {
    bad(`Info.plist GADApplicationIdentifier does not match env. Plist: ${plistAppId}  Env: ${appId}`);
    failed = true;
  } else {
    ok("Info.plist GADApplicationIdentifier matches env.");
  }

  if (!attText || !attText.trim()) {
    bad("Info.plist missing NSUserTrackingUsageDescription or it is empty.");
    failed = true;
  } else {
    ok("Info.plist has NSUserTrackingUsageDescription.");
  }
}

if (failed) {
  console.error("\nOne or more checks failed. Fix the issues above, then re-run: npm run verify:ios\n");
  process.exit(1);
} else {
  console.log("\n🎉 iOS Ad/IAP preflight looks good.");
}