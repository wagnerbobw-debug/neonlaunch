import React from "react";

// PNG / WEBP (pfad anpassen, siehe Hinweis unten):
import bannerUrl from "../assets/branding/NeonLaunch-banner.png";
// Falls SVG:  import bannerUrl from "../assets/branding/neonlaunch-banner.svg?url";

type BrandLogoProps = {
  height?: number;     // sichtbare Höhe in px
  showBadge?: boolean; // MVP-Badge ja/nein
  className?: string;
};

export const BrandLogo: React.FC<BrandLogoProps> = ({
  height = 80,
  showBadge = false,
  className = "",
}) => {
  return (
    <a className={`brand ${className}`} href="#top" aria-label="Start">
      <img
        src={bannerUrl}
        alt="NeonLaunch"
        className="brand__logo"
        style={{ height }}
        // Performance-Hinweise:
        decoding="async"
        fetchPriority="high"
        draggable={false}
      />
    
    </a>
  );
};
``