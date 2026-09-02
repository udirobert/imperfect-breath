import { useEffect, useState } from "react";
import { isTouchDevice } from "@/utils/mobile-detection";

const MOBILE_MQ = "(max-width: 767px)";

function computeIsMobile() {
  if (typeof window === "undefined") return false;
  return isTouchDevice() || window.matchMedia(MOBILE_MQ).matches;
}

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState(computeIsMobile);

  useEffect(() => {
    const mq = window.matchMedia(MOBILE_MQ);
    const check = () => setIsMobile(isTouchDevice() || mq.matches);
    check();
    mq.addEventListener("change", check);
    window.addEventListener("orientationchange", check);
    return () => {
      mq.removeEventListener("change", check);
      window.removeEventListener("orientationchange", check);
    };
  }, []);

  return isMobile;
}
