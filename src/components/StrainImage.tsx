import { useStrainImage } from "@/hooks/useStrainImage";
import { Skeleton } from "@/components/ui/skeleton";

interface StrainImageProps {
  strainId: number;
  strainName: string;
  strainType: string;
  fallbackUrl: string;
  className?: string;
  alt?: string;
}

export function StrainImage({ strainId, strainName, strainType, fallbackUrl, className = "", alt }: StrainImageProps) {
  const { imageUrl, loading } = useStrainImage(strainId, strainName, strainType, fallbackUrl);

  if (loading) {
    return <Skeleton className={`w-full h-full ${className}`} />;
  }

  return (
    <img
      src={imageUrl}
      alt={alt || strainName}
      className={className}
      loading="lazy"
      onError={(e) => {
        e.currentTarget.src = "/placeholder.svg";
      }}
    />
  );
}
