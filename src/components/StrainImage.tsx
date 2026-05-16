interface StrainImageProps {
  strainId: number;
  strainName: string;
  strainType: string;
  fallbackUrl: string;
  className?: string;
  alt?: string;
}

export function StrainImage({ strainName, fallbackUrl, className = "", alt }: StrainImageProps) {
  return (
    <img
      src={fallbackUrl}
      alt={alt || `${strainName} - cannabis medicinal`}
      className={className}
      loading="lazy"
      decoding="async"
      draggable={false}
      onError={(e) => {
        const img = e.currentTarget;
        if (!img.dataset.fallback) {
          img.dataset.fallback = "1";
          img.src = "/placeholder.svg";
        }
      }}
    />
  );
}
