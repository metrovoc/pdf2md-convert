import { useEffect, useState } from "react";

interface ServiceIconProps {
  iconPath?: string;
  className?: string;
  fallback?: string;
}

export function ServiceIcon({
  iconPath,
  className = "w-6 h-6",
  fallback = "/assets/custom.svg",
}: ServiceIconProps) {
  const [svgContent, setSvgContent] = useState<string>("");
  const [error, setError] = useState(false);
  const [fallbackSvgContent, setFallbackSvgContent] = useState<string>("");
  const [fallbackError, setFallbackError] = useState(false);

  // Load main icon
  useEffect(() => {
    if (!iconPath) {
      setError(true);
      return;
    }

    fetch(iconPath)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load SVG");
        }
        return response.text();
      })
      .then((svg) => {
        setSvgContent(svg);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, [iconPath]);

  // Load fallback icon if it's an SVG path
  useEffect(() => {
    if (!fallback || !fallback.endsWith(".svg")) {
      setFallbackError(true);
      return;
    }

    fetch(fallback)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load fallback SVG");
        }
        return response.text();
      })
      .then((svg) => {
        setFallbackSvgContent(svg);
        setFallbackError(false);
      })
      .catch(() => {
        setFallbackError(true);
      });
  }, [fallback]);

  // Show main icon if loaded successfully
  if (!error && svgContent) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: svgContent }}
      />
    );
  }

  // Show fallback SVG if main icon failed but fallback SVG loaded
  if (error && !fallbackError && fallbackSvgContent) {
    return (
      <div
        className={className}
        dangerouslySetInnerHTML={{ __html: fallbackSvgContent }}
      />
    );
  }

  // Show emoji fallback if both failed or fallback is not SVG
  if (error || !iconPath) {
    const displayFallback = fallback?.endsWith(".svg") ? " " : fallback || " ";
    return (
      <div className={`${className} flex items-center justify-center text-lg`}>
        {displayFallback}
      </div>
    );
  }

  // Show loading state
  return <div className={`${className} bg-gray-200 rounded animate-pulse`} />;
}
