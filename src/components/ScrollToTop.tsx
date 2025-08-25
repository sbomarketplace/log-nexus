import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname } = useLocation();
  
  useEffect(() => {
    const scroller = document.getElementById("app-scroll") ?? window;
    if ("scrollTo" in scroller) {
      (scroller as any).scrollTo?.({ top: 0, left: 0, behavior: "auto" });
    } else {
      (scroller as any).scrollTop = 0;
    }
  }, [pathname]);
  
  return null;
}