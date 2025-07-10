/**
 * 格式化时间显示
 */
export function formatDuration(milliseconds: number): string {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`;
  }
  
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

/**
 * 计算当前运行时间
 */
export function getCurrentDuration(startTime: Date): number {
  return Date.now() - startTime.getTime();
}

/**
 * 格式化实时时间显示
 */
export function formatRealTimeDuration(startTime: Date): string {
  const duration = getCurrentDuration(startTime);
  return formatDuration(duration);
}