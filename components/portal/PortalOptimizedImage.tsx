type Props = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  loading?: "eager" | "lazy";
  fetchPriority?: "high" | "low" | "auto";
  decoding?: "async" | "auto" | "sync";
};

/** jpg の並びで webp がある前提の picture（なければ jpg のみ） */
export function PortalOptimizedImage({
  src,
  alt,
  width,
  height,
  className,
  loading = "lazy",
  fetchPriority,
  decoding = "async",
}: Props) {
  const webpSrc = src.replace(/\.jpe?g$/i, ".webp");
  const hasWebp = webpSrc !== src;

  return (
    <picture>
      {hasWebp ? <source srcSet={webpSrc} type="image/webp" /> : null}
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={className}
        loading={loading}
        decoding={decoding}
        fetchPriority={fetchPriority}
      />
    </picture>
  );
}
