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
        // Fallback to picsum with strain id as seed
        const target = e.currentTarget;
        if (!target.dataset.retried) {
          target.dataset.retried = "1";
          target.src = `https://picsum.photos/seed/strain${strainId}/512/512`;
        } else {
          target.src = "/placeholder.svg";
        }
      }}
    />
  );
}
