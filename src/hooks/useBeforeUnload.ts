import { useEffect } from 'react';

export function useBeforeUnload(shouldWarn: boolean, message?: string) {
  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (shouldWarn) {
        const confirmationMessage = message || '您有正在进行的转换任务，确定要离开吗？';
        event.returnValue = confirmationMessage;
        return confirmationMessage;
      }
    };

    if (shouldWarn) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [shouldWarn, message]);
}