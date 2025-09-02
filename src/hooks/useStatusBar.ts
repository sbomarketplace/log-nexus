import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { StatusBar, Style } from "@capacitor/status-bar";

export function useStatusBar() {
  useEffect(() => {
    if (Capacitor.getPlatform() === "ios") {
      // Let web view draw under notch; we'll pad via CSS safe areas
      StatusBar.setOverlaysWebView({ overlay: true }).catch(() => {});
      // Black text in status bar
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    } else {
      // Android: match header color + dark icons
      StatusBar.setBackgroundColor({ color: "#ffffff" }).catch(() => {});
      StatusBar.setStyle({ style: Style.Dark }).catch(() => {});
    }
  }, []);
}