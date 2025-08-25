// Use Preferences for now - secure storage will be added via manual install
// import { SecureStorage } from '@capawesome/capacitor-secure-storage';
// import { Preferences } from '@capacitor/preferences';

// Fallback to localStorage for now until secure storage is properly installed
const isNative = window.location.protocol === 'capacitor:';

const storage = {
  async get(key: string): Promise<string | null> {
    if (isNative) {
      // Will use SecureStorage when properly installed
      return localStorage.getItem(key);
    }
    return localStorage.getItem(key);
  },
  async set(key: string, value: string): Promise<void> {
    if (isNative) {
      // Will use SecureStorage when properly installed  
      localStorage.setItem(key, value);
    } else {
      localStorage.setItem(key, value);
    }
  },
  async remove(key: string): Promise<void> {
    if (isNative) {
      localStorage.removeItem(key);
    } else {
      localStorage.removeItem(key);
    }
  }
};

const KEY = 'cc_ai_credits_v1';
export const FREE_LIMIT = 3;

export type CreditsState = {
  freeUsed: number;     // 0..3
  paidCredits: number;  // from 5/60 packs
  subActive: boolean;   // unlimited
  updatedAt: number;
};

let cache: CreditsState | null = null;
const listeners = new Set<(s: CreditsState)=>void>();

async function readSecure(): Promise<CreditsState | null> {
  try { 
    const value = await storage.get(KEY); 
    if (!value) return null; 
    return JSON.parse(value); 
  }
  catch { return null; }
}
async function writeSecure(s: CreditsState) {
  await storage.set(KEY, JSON.stringify(s));
}
async function migrateIfNeeded(): Promise<CreditsState | null> {
  const freeUsed = Number((await storage.get('ai_free_used')) || '0');
  const paid = Number((await storage.get('ai_paid_credits')) || '0');
  const sub = ((await storage.get('ai_sub_active')) || 'false') === 'true';
  if (freeUsed || paid || sub) {
    const st: CreditsState = { freeUsed: Math.min(FREE_LIMIT, Math.max(0, freeUsed)), paidCredits: Math.max(0, paid), subActive: !!sub, updatedAt: Date.now() };
    await writeSecure(st);
    await storage.remove('ai_free_used');
    await storage.remove('ai_paid_credits');
    await storage.remove('ai_sub_active');
    return st;
  }
  return null;
}
export async function getCredits(): Promise<CreditsState> {
  if (cache) return cache!;
  const s = (await readSecure()) || (await migrateIfNeeded()) || { freeUsed: 0, paidCredits: 0, subActive: false, updatedAt: Date.now() };
  cache = s; return s;
}
async function save(st: CreditsState) { cache = st; await writeSecure(st); listeners.forEach(fn => fn(st)); }
export function onCreditsChange(fn:(s:CreditsState)=>void){ listeners.add(fn); return ()=>listeners.delete(fn); }
export async function addPack(n:number){ const s=await getCredits(); s.paidCredits+=n; s.updatedAt=Date.now(); await save(s); }
export async function setSubscription(active:boolean){ const s=await getCredits(); s.subActive=active; s.updatedAt=Date.now(); await save(s); }
export async function consumeOne(): Promise<'ok'|'paywall'> {
  const s=await getCredits();
  if (s.subActive) return 'ok';
  if (s.paidCredits>0){ s.paidCredits--; s.updatedAt=Date.now(); await save(s); return 'ok'; }
  if (s.freeUsed<FREE_LIMIT){ s.freeUsed++; s.updatedAt=Date.now(); await save(s); return 'ok'; }
  return 'paywall';
}
export function freeRemainingSync(){ return cache ? Math.max(0, FREE_LIMIT - cache.freeUsed) : FREE_LIMIT; }
export function paidRemainingSync(){ return Math.max(0, cache?.paidCredits ?? 0); }
export function subActiveSync(){ return !!cache?.subActive; }