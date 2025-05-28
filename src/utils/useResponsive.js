import { useEffect, useState } from "react";

// Detects mobile by width, device type, and orientation (portrait OR landscape if it's a mobile device)
export default function useResponsive() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    function checkMobile() {
      // 1. Is a touch device or common mobile/tablet user agent?
      const ua = navigator.userAgent;
      const isDeviceMobile =
        /Mobi|Android|iPhone|iPad|iPod|Opera Mini|IEMobile|Mobile/i.test(ua) ||
        (window.matchMedia && window.matchMedia("(pointer: coarse)").matches);

      // 2. Is the viewport width small?
      const isSmallScreen = window.innerWidth <= 900;

      // 3. Is the device in portrait mode?
      const isPortrait =
        window.matchMedia &&
        window.matchMedia("(orientation: portrait)").matches;

      // Consider mobile if: 
      //  - Device is mobile/tablet, OR
      //  - Small screen (portrait or landscape, e.g., foldable, iPad), OR
      //  - Portrait mode on any device below 1100px width
      setIsMobile(
        isDeviceMobile ||
        isSmallScreen ||
        (isPortrait && window.innerWidth < 1100)
      );
    }

    window.addEventListener("resize", checkMobile);
    window.addEventListener("orientationchange", checkMobile);
    checkMobile();
    return () => {
      window.removeEventListener("resize", checkMobile);
      window.removeEventListener("orientationchange", checkMobile);
    };
  }, []);

  return { isMobile };
}
