const assets = {
  lockup: { file: "brand-lockup.svg", width: 790, height: 200 },
  wordmark: { file: "wordmark.svg", width: 533, height: 170 },
  mark: { file: "logo.svg", width: 200, height: 200 },
} as const;

interface BrandLogoProps {
  variant?: keyof typeof assets;
  className?: string;
  decorative?: boolean;
  assetBaseUrl?: string;
}

/** Original Figma exports; keep their proportions and outlined lettering intact. */
export function BrandLogo({ variant = "lockup", className = "", decorative = false, assetBaseUrl = "/" }: BrandLogoProps) {
  const asset = assets[variant];
  return <img
    className={`brand-logo ${className}`.trim()}
    src={`${assetBaseUrl.replace(/\/$/, "")}/assets/${asset.file}`}
    width={asset.width}
    height={asset.height}
    alt={decorative ? "" : "Wispora"}
    aria-hidden={decorative || undefined}
    draggable={false}
  />;
}
