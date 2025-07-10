import { useEffect, useState } from 'react';

interface ServiceIconProps {
  iconPath?: string;
  className?: string;
  fallback?: string;
}

export function ServiceIcon({ iconPath, className = "w-6 h-6", fallback = "🤖" }: ServiceIconProps) {
  const [svgContent, setSvgContent] = useState<string>('');
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!iconPath) {
      setError(true);
      return;
    }

    // 动态导入SVG文件
    fetch(iconPath)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load SVG');
        }
        return response.text();
      })
      .then(svg => {
        setSvgContent(svg);
        setError(false);
      })
      .catch(() => {
        setError(true);
      });
  }, [iconPath]);

  if (error || !iconPath) {
    return (
      <div className={`${className} flex items-center justify-center text-lg`}>
        {fallback}
      </div>
    );
  }

  if (!svgContent) {
    return (
      <div className={`${className} bg-gray-200 rounded animate-pulse`} />
    );
  }

  return (
    <div 
      className={className}
      dangerouslySetInnerHTML={{ __html: svgContent }}
    />
  );
}