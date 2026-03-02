interface StrainImageProps {
  strainId: number;
  strainName: string;
  strainType: string;
  fallbackUrl: string;
  className?: string;
  alt?: string;
}

export function StrainImage({ strainId, strainName, strainType, fallbackUrl, className = "", alt }: StrainImageProps) {
  return (
    <img
      src={fallbackUrl}
      alt={alt || strainName}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = "/placeholder.svg";
      }}
    />
  );
}
