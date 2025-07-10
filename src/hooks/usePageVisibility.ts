import { useState, useEffect } from 'react';

export interface PageStatus {
  isVisible: boolean;
  isOnline: boolean;
  isIdle: boolean;
}

export function usePageVisibility() {
  const [isVisible, setIsVisible] = useState(!document.hidden);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isIdle, setIsIdle] = useState(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsVisible(!document.hidden);
    };

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // 检测用户是否长时间未活动
    let idleTimer: number;
    const resetIdleTimer = () => {
      setIsIdle(false);
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        setIsIdle(true);
      }, 5 * 60 * 1000); // 5分钟后认为用户空闲
    };

    // 监听页面可见性变化
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // 监听网络状态变化
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 监听用户活动
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => {
      document.addEventListener(event, resetIdleTimer, { passive: true });
    });

    // 初始化空闲计时器
    resetIdleTimer();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      events.forEach(event => {
        document.removeEventListener(event, resetIdleTimer);
      });
      clearTimeout(idleTimer);
    };
  }, []);

  return {
    isVisible,
    isOnline,
    isIdle
  };
}