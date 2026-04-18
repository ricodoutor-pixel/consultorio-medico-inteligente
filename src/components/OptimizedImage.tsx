import { ImgHTMLAttributes } from "react";

interface OptimizedImageProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  priority?: boolean;
}

/**
 * Wrapper de <img> com defaults de performance mobile:
 * - loading="lazy" (ou "eager" se priority=true para LCP)
 * - decoding="async"
 * - fetchpriority correto para Facebook/Instagram in-app browsers
 */
export const OptimizedImage = ({
  src,
  alt,
  priority = false,
  className,
  ...rest
}: OptimizedImageProps) => {
  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      // @ts-expect-error fetchpriority is valid HTML attr
      fetchpriority={priority ? "high" : "auto"}
      className={className}
      {...rest}
    />
  );
};

export default OptimizedImage;
