import React, { useEffect, useMemo, useRef, useState } from "react";
import { AdMob, BannerAdOptions, BannerAdPosition, BannerAdSize } from "@capacitor-community/admob";
import { isRemoveAdsActive } from '@/lib/iap';

type Slot = "home" | "home2" | "home3" | "settings";

const LS_DAY_KEY = "ad_daily_count_v1";
const SESSION_FLAGS: Record<Slot, boolean> = { home: false, home2: false, home3: false, settings: false };

// Global visibility guard: only one inline ad visible at a time
let VISIBLE_INLINE_SLOT: Slot | null = null;
function claimVisibility(slot: Slot) {
  if (VISIBLE_INLINE_SLOT && VISIBLE_INLINE_SLOT !== slot) return false;
  VISIBLE_INLINE_SLOT = slot;
  return true;
}
function releaseVisibility(slot: Slot) {
  if (VISIBLE_INLINE_SLOT === slot) {
    VISIBLE_INLINE_SLOT = null;
    document.dispatchEvent(new CustomEvent("inline-ad:released"));
  }
}

function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`;
}
function incDailyCount() {
  try {
    const k = todayKey();
    const raw = localStorage.getItem(LS_DAY_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    obj[k] = Math.min(5, (obj[k] || 0) + 1);
    localStorage.setItem(LS_DAY_KEY, JSON.stringify(obj));
    return obj[k] as number;
  } catch { return 0; }
}
function getDailyCount() {
  try {
    const raw = localStorage.getItem(LS_DAY_KEY);
    const obj = raw ? JSON.parse(raw) : {};
    return obj[todayKey()] || 0;
  } catch { return 0; }
}

// Get ATT permission and return NPA flag
async function requestATTAndGetNpaFlag(): Promise<string> {
  try {
    // Try App Tracking Transparency plugin first
    if ((window as any).AppTrackingTransparency?.requestPermission) {
      const result = await (window as any).AppTrackingTransparency.requestPermission();
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // Fallback to AdMob ATT if available
    if ((window as any).AdMob?.requestTrackingAuthorization) {
      const result = await (window as any).AdMob.requestTrackingAuthorization();
      return result.status === 'authorized' ? '0' : '1';
    }
    
    // No ATT available, assume non-personalized
    return '1';
  } catch (error) {
    console.warn('ATT request failed:', error);
    return '1'; // Default to non-personalized ads
  }
}

type PickedSize =
  | { kind: "LEADERBOARD"; width: number; height: number; admob: BannerAdSize }
  | { kind: "FULL_BANNER"; width: number; height: number; admob: BannerAdSize }
  | { kind: "LARGE_BANNER"; width: number; height: number; admob: BannerAdSize }
  | { kind: "BANNER"; width: number; height: number; admob: BannerAdSize }
  | { kind: "NONE"; width: 0; height: 0; admob: BannerAdSize };

// NOTE: renamed to avoid any accidental shadowing with prior declarations
function chooseBannerSize(containerWidth: number): PickedSize {
  // Pick a supported AdMob size by available width. Do not scale the ad.
  if (containerWidth >= 728) return { kind: "LEADERBOARD", width: 728, height: 90, admob: BannerAdSize.LEADERBOARD };
  if (containerWidth >= 480) return { kind: "FULL_BANNER", width: 468, height: 60, admob: BannerAdSize.FULL_BANNER };
  if (containerWidth >= 360) return { kind: "LARGE_BANNER", width: 320, height: 100, admob: BannerAdSize.LARGE_BANNER };
  if (containerWidth >= 320) return { kind: "BANNER", width: 320, height: 50, admob: BannerAdSize.BANNER };
  return { kind: "NONE", width: 0, height: 0, admob: BannerAdSize.BANNER };
}

export default function InlineAd({ slot }: { slot: Slot }) {
  const [active, setActive] = useState(false);
  const [size, setSize] = useState<PickedSize>({ kind: "NONE", width: 0, height: 0, admob: BannerAdSize.BANNER });
  const [isIntersecting, setIsIntersecting] = useState(false);

  const containerRef = useRef<HTMLDivElement | null>(null);
  const boxRef = useRef<HTMLDivElement | null>(null);
  const obsRef = useRef<IntersectionObserver | null>(null);
  const adShownRef = useRef(false);

  const PLACEHOLDER_MODE =
    import.meta.env.VITE_SHOW_AD_PLACEHOLDERS === "true" ||
    (!(window as any).cordova && import.meta.env.DEV);

  // Measure available width and pick a Banner size
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const compute = () => {
      const w = Math.round(el.getBoundingClientRect().width);
      setSize(chooseBannerSize(w));
    };
    compute();
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    window.addEventListener("orientationchange", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("orientationchange", compute);
    };
  }, []);

  const eligible = useMemo(() => {
    if (isRemoveAdsActive() && !PLACEHOLDER_MODE) return false;
    if (SESSION_FLAGS[slot]) return false;
    if (getDailyCount() >= 5) return false;
    return true;
  }, [slot, PLACEHOLDER_MODE]);

  // Placeholder for dev and web preview
  if (PLACEHOLDER_MODE) {
    return (
      <div className="my-3" ref={containerRef}>
        <div className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50/60 overflow-hidden">
          <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-200 bg-white">
            <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-neutral-600">Ad</span>
            <span className="text-xs text-neutral-500">
              Placeholder · {size.kind === "NONE" ? "No ad on this width" : `${size.width}×${size.height} ${size.kind.replace("_", " ")}`}
            </span>
          </div>
          <div className="flex items-center justify-center" style={{ height: size.kind === "NONE" ? 72 : size.height }}>
            <div className="text-xs text-neutral-500">Inline Banner renders here on device</div>
          </div>
        </div>
      </div>
    );
  }

  // If not enough width for a compliant banner, do not render
  if (!eligible || size.kind === "NONE") return null;

  useEffect(() => {
    if (!eligible) return;
    const box = boxRef.current;
    if (!box) return;

    const tryShow = async () => {
      if (!isIntersecting || adShownRef.current) return;
      if (!claimVisibility(slot)) return; // another inline ad is visible

      SESSION_FLAGS[slot] = true;
      incDailyCount();
      adShownRef.current = true;

      const rect = box.getBoundingClientRect();
      const scrollX = window.scrollX || window.pageXOffset;
      const scrollY = window.scrollY || window.pageYOffset;

      const offX = Math.round(rect.left + scrollX);
      const offY = Math.round(rect.top + scrollY);

      const npa = await requestATTAndGetNpaFlag();
      const opts: BannerAdOptions = {
        adId: import.meta.env.VITE_ADMOB_INLINE_BANNER_ID_IOS,
        adSize: size.admob,
        position: (BannerAdPosition as any).CUSTOM ?? ("CUSTOM" as any),
        x: offX,
        y: offY,
        offsetX: offX,
        offsetY: offY,
        margin: 0,
        additionalParameters: { npa },
      } as any;

      try {
        await AdMob.showBanner(opts);
        setActive(true);
      } catch (err) {
        console.warn("Inline banner error", err);
        releaseVisibility(slot);
      }
    };

    obsRef.current = new IntersectionObserver((entries) => {
      const e = entries[0];
      const nowIntersecting = !!e?.isIntersecting && e.intersectionRatio >= 0.5;
      setIsIntersecting(nowIntersecting);
      if (nowIntersecting) {
        void tryShow();
      } else {
        // If this ad was active and just scrolled out, hide & release so another slot can claim
        if (active && VISIBLE_INLINE_SLOT === slot) {
          AdMob.hideBanner().catch(() => {});
          setActive(false);
          releaseVisibility(slot);
        }
      }
    }, { threshold: 0.5 });

    const onMove = () => {
      if (!active) return;
      const r = box.getBoundingClientRect();
      const x = Math.round(r.left + (window.scrollX || window.pageXOffset));
      const y = Math.round(r.top + (window.scrollY || window.pageYOffset));
      // Try to update banner position if method exists
      try {
        (AdMob as any).updateBannerPosition?.({ x, y, offsetX: x, offsetY: y });
      } catch {
        // Method not available, skip position updates
      }
    };
    
    const onReleased = () => { void tryShow(); };

    window.addEventListener("scroll", onMove, { passive: true });
    window.addEventListener("resize", onMove);
    window.addEventListener("orientationchange", onMove);
    document.addEventListener("inline-ad:released", onReleased);

    obsRef.current.observe(box);
    return () => {
      obsRef.current?.disconnect();
      window.removeEventListener("scroll", onMove);
      window.removeEventListener("resize", onMove);
      window.removeEventListener("orientationchange", onMove);
      document.removeEventListener("inline-ad:released", onReleased);
      if (active) {
        AdMob.hideBanner().catch(() => {});
        releaseVisibility(slot);
      }
    };
  }, [eligible, active, size, slot, isIntersecting]);

  return (
    <div className="my-3" ref={containerRef}>
      <div className="rounded-xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-neutral-100">
          <span className="inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium text-neutral-600">Ad</span>
          <span className="text-xs text-neutral-500">Sponsored</span>
        </div>
        {/* The ad view is positioned exactly on this box */}
        <div
          ref={boxRef}
          style={{
            width: size.width,
            height: size.height,
            margin: "8px auto"
          }}
        />
      </div>
    </div>
  );
}